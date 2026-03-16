package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	supa "github.com/supabase-community/supabase-go"
)

// TeamMemberHandler handles all team-member-related HTTP requests.
type TeamMemberHandler struct {
	db *supa.Client
}

// NewTeamMemberHandler creates a TeamMemberHandler with the given Supabase client.
func NewTeamMemberHandler(db *supa.Client) *TeamMemberHandler {
	return &TeamMemberHandler{db: db}
}

// Routes wires the team-member routes onto r under the caller's mount point.
func (h *TeamMemberHandler) Routes(r chi.Router) {
	r.Get("/team-members", h.List)
	r.Post("/team-members", h.Create)
	r.Patch("/team-members/{id}", h.Update)
	r.Delete("/team-members/{id}", h.Delete)
}

// List handles GET /api/v1/team-members
func (h *TeamMemberHandler) List(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]any{
		"members": []any{},
	})
}

// Create handles POST /api/v1/team-members
func (h *TeamMemberHandler) Create(w http.ResponseWriter, r *http.Request) {
	var body map[string]any
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeError(w, http.StatusBadRequest, "VALIDATION_ERROR", "invalid request body")
		return
	}
	writeJSON(w, http.StatusCreated, map[string]any{
		"member": body,
	})
}

// Update handles PATCH /api/v1/team-members/{id}
func (h *TeamMemberHandler) Update(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var body map[string]any
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeError(w, http.StatusBadRequest, "VALIDATION_ERROR", "invalid request body")
		return
	}
	body["id"] = id
	writeJSON(w, http.StatusOK, map[string]any{
		"member": body,
	})
}

// Delete handles DELETE /api/v1/team-members/{id}
func (h *TeamMemberHandler) Delete(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusNoContent)
}
