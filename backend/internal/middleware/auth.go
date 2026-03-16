package middleware

import (
	"context"
	"encoding/json"
	"net/http"
	"strings"
	"sync"
	"time"

	supa "github.com/supabase-community/supabase-go"
)

// contextKey is an unexported type for context keys in this package to avoid
// collisions with keys defined in other packages.
type contextKey string

const UserIDKey contextKey = "user_id"

// jwksCache caches the result of Supabase GetUser so we can at least avoid
// repeated token parses on the same token within a short window.
// For JWKS-level caching a dedicated JWKS library would be used; here we rely
// on the supabase-go client's Auth.GetUser which validates against the Supabase
// auth server and works correctly with the publishable key.
type userCache struct {
	mu      sync.Mutex
	entries map[string]cachedUser
}

type cachedUser struct {
	userID    string
	expiresAt time.Time
}

var cache = &userCache{
	entries: make(map[string]cachedUser),
}

const cacheTTL = 5 * time.Minute

func (c *userCache) get(token string) (string, bool) {
	c.mu.Lock()
	defer c.mu.Unlock()
	entry, ok := c.entries[token]
	if !ok || time.Now().After(entry.expiresAt) {
		delete(c.entries, token)
		return "", false
	}
	return entry.userID, true
}

func (c *userCache) set(token, userID string) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.entries[token] = cachedUser{
		userID:    userID,
		expiresAt: time.Now().Add(cacheTTL),
	}
}

// Auth returns a middleware that validates a Supabase Bearer token and injects
// the user_id into the request context.
func Auth(client *supa.Client) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			authHeader := r.Header.Get("Authorization")
			if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
				writeAuthError(w, "missing or malformed Authorization header")
				return
			}

			token := strings.TrimPrefix(authHeader, "Bearer ")
			if token == "" {
				writeAuthError(w, "empty bearer token")
				return
			}

			// Check in-memory cache first to avoid a round-trip on every request.
			if userID, ok := cache.get(token); ok {
				ctx := context.WithValue(r.Context(), UserIDKey, userID)
				// Also store the raw token so handlers can forward it to Supabase
				// for RLS-compliant queries.
				ctx = context.WithValue(ctx, contextKey("token"), token)
				next.ServeHTTP(w, r.WithContext(ctx))
				return
			}

			// Validate token via Supabase Auth.
			resp, err := client.Auth.WithToken(token).GetUser()
			if err != nil || resp == nil {
				writeAuthError(w, "invalid or expired token")
				return
			}

			userID := resp.ID.String()
			cache.set(token, userID)

			ctx := context.WithValue(r.Context(), UserIDKey, userID)
			ctx = context.WithValue(ctx, contextKey("token"), token)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// GetUserID extracts the authenticated user_id from the request context.
// Returns an empty string if not set.
func GetUserID(ctx context.Context) string {
	if v, ok := ctx.Value(UserIDKey).(string); ok {
		return v
	}
	return ""
}

// GetToken extracts the raw bearer token from the request context.
func GetToken(ctx context.Context) string {
	if v, ok := ctx.Value(contextKey("token")).(string); ok {
		return v
	}
	return ""
}

// writeAuthError writes a 401 JSON error response.
func writeAuthError(w http.ResponseWriter, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusUnauthorized)
	_ = json.NewEncoder(w).Encode(map[string]any{
		"error": map[string]string{
			"code":    "UNAUTHORIZED",
			"message": message,
		},
	})
}
