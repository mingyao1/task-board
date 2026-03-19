package handlers

import (
	"net/http"

	"task-board/backend/internal/middleware"
	"task-board/backend/internal/services"
)

// StatsHandler handles board-stats HTTP requests.
type StatsHandler struct {
	service *services.StatsService
}

// NewStatsHandler creates a StatsHandler backed by the given service.
func NewStatsHandler(service *services.StatsService) *StatsHandler {
	return &StatsHandler{service: service}
}

// Get handles GET /api/v1/stats
func (h *StatsHandler) Get(w http.ResponseWriter, r *http.Request) {
	token := middleware.GetToken(r.Context())

	stats, err := h.service.Get(r.Context(), token)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{"stats": stats})
}
