package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	supa "github.com/supabase-community/supabase-go"
)

// TaskHandler handles all task-related HTTP requests.
type TaskHandler struct {
	db *supa.Client
}

// NewTaskHandler creates a TaskHandler with the given Supabase client.
func NewTaskHandler(db *supa.Client) *TaskHandler {
	return &TaskHandler{db: db}
}

// Routes wires the task routes onto r under the caller's mount point.
// Expected mount: /api/v1
func (h *TaskHandler) Routes(r chi.Router) {
	r.Get("/tasks", h.List)
	r.Post("/tasks", h.Create)
	r.Patch("/tasks/reorder", h.Reorder) // must be before /{id}
	r.Patch("/tasks/{id}", h.Update)
	r.Delete("/tasks/{id}", h.Delete)
}

// List handles GET /api/v1/tasks
// Supports optional query params: status, priority, assignee_id, label_id, search
func (h *TaskHandler) List(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]any{
		"tasks": []any{},
	})
}

// Create handles POST /api/v1/tasks
func (h *TaskHandler) Create(w http.ResponseWriter, r *http.Request) {
	var body map[string]any
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeError(w, http.StatusBadRequest, "VALIDATION_ERROR", "invalid request body")
		return
	}
	writeJSON(w, http.StatusCreated, map[string]any{
		"task": body,
	})
}

// Update handles PATCH /api/v1/tasks/{id}
func (h *TaskHandler) Update(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var body map[string]any
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeError(w, http.StatusBadRequest, "VALIDATION_ERROR", "invalid request body")
		return
	}
	body["id"] = id
	writeJSON(w, http.StatusOK, map[string]any{
		"task": body,
	})
}

// Delete handles DELETE /api/v1/tasks/{id}
func (h *TaskHandler) Delete(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusNoContent)
}

// Reorder handles PATCH /api/v1/tasks/reorder
func (h *TaskHandler) Reorder(w http.ResponseWriter, r *http.Request) {
	var body map[string]any
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeError(w, http.StatusBadRequest, "VALIDATION_ERROR", "invalid request body")
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"ok": true,
	})
}
