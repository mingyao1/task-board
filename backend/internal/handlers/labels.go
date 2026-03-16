package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	supa "github.com/supabase-community/supabase-go"
)

// LabelHandler handles all label-related HTTP requests.
type LabelHandler struct {
	db *supa.Client
}

// NewLabelHandler creates a LabelHandler with the given Supabase client.
func NewLabelHandler(db *supa.Client) *LabelHandler {
	return &LabelHandler{db: db}
}

// Routes wires the label routes onto r under the caller's mount point.
func (h *LabelHandler) Routes(r chi.Router) {
	r.Get("/labels", h.List)
	r.Post("/labels", h.Create)
	r.Patch("/labels/{id}", h.Update)
	r.Delete("/labels/{id}", h.Delete)
}

// List handles GET /api/v1/labels
func (h *LabelHandler) List(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]any{
		"labels": []any{},
	})
}

// Create handles POST /api/v1/labels
func (h *LabelHandler) Create(w http.ResponseWriter, r *http.Request) {
	var body map[string]any
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeError(w, http.StatusBadRequest, "VALIDATION_ERROR", "invalid request body")
		return
	}
	writeJSON(w, http.StatusCreated, map[string]any{
		"label": body,
	})
}

// Update handles PATCH /api/v1/labels/{id}
func (h *LabelHandler) Update(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var body map[string]any
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeError(w, http.StatusBadRequest, "VALIDATION_ERROR", "invalid request body")
		return
	}
	body["id"] = id
	writeJSON(w, http.StatusOK, map[string]any{
		"label": body,
	})
}

// Delete handles DELETE /api/v1/labels/{id}
func (h *LabelHandler) Delete(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusNoContent)
}
