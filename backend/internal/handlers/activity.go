package handlers

import (
	"net/http"

	supa "github.com/supabase-community/supabase-go"
)

// ActivityHandler handles activity-log-related HTTP requests.
type ActivityHandler struct {
	db *supa.Client
}

// NewActivityHandler creates an ActivityHandler with the given Supabase client.
func NewActivityHandler(db *supa.Client) *ActivityHandler {
	return &ActivityHandler{db: db}
}

// List handles GET /api/v1/tasks/{taskId}/activity
func (h *ActivityHandler) List(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]any{
		"activities": []any{},
	})
}
