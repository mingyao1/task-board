package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	supa "github.com/supabase-community/supabase-go"
)

// CommentHandler handles comment-related HTTP requests.
type CommentHandler struct {
	db *supa.Client
}

// NewCommentHandler creates a CommentHandler with the given Supabase client.
func NewCommentHandler(db *supa.Client) *CommentHandler {
	return &CommentHandler{db: db}
}

// Routes wires the comment routes onto r under the caller's mount point.
// Expected to be mounted under /api/v1/tasks/{taskId}.
func (h *CommentHandler) Routes(r chi.Router) {
	r.Get("/comments", h.List)
	r.Post("/comments", h.Create)
	r.Delete("/comments/{id}", h.Delete)
}

// List handles GET /api/v1/tasks/{taskId}/comments
func (h *CommentHandler) List(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]any{
		"comments": []any{},
	})
}

// Create handles POST /api/v1/tasks/{taskId}/comments
func (h *CommentHandler) Create(w http.ResponseWriter, r *http.Request) {
	taskID := chi.URLParam(r, "taskId")
	var body map[string]any
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeError(w, http.StatusBadRequest, "VALIDATION_ERROR", "invalid request body")
		return
	}
	body["task_id"] = taskID
	writeJSON(w, http.StatusCreated, map[string]any{
		"comment": body,
	})
}

// Delete handles DELETE /api/v1/tasks/{taskId}/comments/{id}
func (h *CommentHandler) Delete(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusNoContent)
}
