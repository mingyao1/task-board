package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"

	"task-board/backend/internal/middleware"
	"task-board/backend/internal/models"
	"task-board/backend/internal/services"
)

// LabelHandler handles all label-related HTTP requests.
type LabelHandler struct {
	service *services.LabelService
}

// NewLabelHandler creates a LabelHandler backed by the given service.
func NewLabelHandler(service *services.LabelService) *LabelHandler {
	return &LabelHandler{service: service}
}

// Routes wires the label routes onto r.
func (h *LabelHandler) Routes(r chi.Router) {
	r.Get("/labels", h.List)
	r.Post("/labels", h.Create)
	r.Patch("/labels/{id}", h.Update)
	r.Delete("/labels/{id}", h.Delete)
}

// List handles GET /api/v1/labels
func (h *LabelHandler) List(w http.ResponseWriter, r *http.Request) {
	token := middleware.GetToken(r.Context())

	labels, err := h.service.List(r.Context(), token)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{"labels": labels})
}

// Create handles POST /api/v1/labels
func (h *LabelHandler) Create(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	token := middleware.GetToken(r.Context())

	var input models.CreateLabelInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		writeError(w, http.StatusBadRequest, "VALIDATION_ERROR", "invalid request body")
		return
	}

	label, err := h.service.Create(r.Context(), userID, token, input)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
		return
	}
	writeJSON(w, http.StatusCreated, map[string]interface{}{"label": label})
}

// Update handles PATCH /api/v1/labels/{id}
func (h *LabelHandler) Update(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	token := middleware.GetToken(r.Context())

	var input models.UpdateLabelInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		writeError(w, http.StatusBadRequest, "VALIDATION_ERROR", "invalid request body")
		return
	}

	label, err := h.service.Update(r.Context(), token, id, input)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{"label": label})
}

// Delete handles DELETE /api/v1/labels/{id}
func (h *LabelHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	token := middleware.GetToken(r.Context())

	if err := h.service.Delete(r.Context(), token, id); err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
