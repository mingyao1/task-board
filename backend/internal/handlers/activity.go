package handlers

import (
	"net/http"

	"github.com/go-chi/chi/v5"

	"task-board/backend/internal/middleware"
	"task-board/backend/internal/services"
)

// ActivityHandler handles activity-log-related HTTP requests.
type ActivityHandler struct {
	service *services.ActivityService
}

// NewActivityHandler creates an ActivityHandler backed by the given service.
func NewActivityHandler(service *services.ActivityService) *ActivityHandler {
	return &ActivityHandler{service: service}
}

// List handles GET /api/v1/tasks/{taskId}/activity
func (h *ActivityHandler) List(w http.ResponseWriter, r *http.Request) {
	taskID := chi.URLParam(r, "taskId")
	token := middleware.GetToken(r.Context())

	logs, err := h.service.ListActivity(r.Context(), token, taskID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{"activity": logs})
}
