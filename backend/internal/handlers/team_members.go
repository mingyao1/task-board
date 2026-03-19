package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"

	"task-board/backend/internal/middleware"
	"task-board/backend/internal/models"
	"task-board/backend/internal/services"
)

// TeamMemberHandler handles all team-member-related HTTP requests.
type TeamMemberHandler struct {
	service *services.TeamService
}

// NewTeamMemberHandler creates a TeamMemberHandler backed by the given service.
func NewTeamMemberHandler(service *services.TeamService) *TeamMemberHandler {
	return &TeamMemberHandler{service: service}
}

// Routes wires the team-member routes onto r.
func (h *TeamMemberHandler) Routes(r chi.Router) {
	r.Get("/team-members", h.List)
	r.Post("/team-members", h.Create)
	r.Patch("/team-members/{id}", h.Update)
	r.Delete("/team-members/{id}", h.Delete)
}

// List handles GET /api/v1/team-members
func (h *TeamMemberHandler) List(w http.ResponseWriter, r *http.Request) {
	token := middleware.GetToken(r.Context())

	members, err := h.service.List(r.Context(), token)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{"team_members": members})
}

// Create handles POST /api/v1/team-members
func (h *TeamMemberHandler) Create(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	token := middleware.GetToken(r.Context())

	var input models.CreateTeamMemberInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		writeError(w, http.StatusBadRequest, "VALIDATION_ERROR", "invalid request body")
		return
	}

	member, err := h.service.Create(r.Context(), userID, token, input)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
		return
	}
	writeJSON(w, http.StatusCreated, map[string]interface{}{"team_member": member})
}

// Update handles PATCH /api/v1/team-members/{id}
func (h *TeamMemberHandler) Update(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	token := middleware.GetToken(r.Context())

	var input models.UpdateTeamMemberInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		writeError(w, http.StatusBadRequest, "VALIDATION_ERROR", "invalid request body")
		return
	}

	member, err := h.service.Update(r.Context(), token, id, input)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{"team_member": member})
}

// Delete handles DELETE /api/v1/team-members/{id}
func (h *TeamMemberHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	token := middleware.GetToken(r.Context())

	if err := h.service.Delete(r.Context(), token, id); err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
