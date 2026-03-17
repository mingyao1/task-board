package handlers

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"

	"task-board/backend/internal/middleware"
	"task-board/backend/internal/models"
	"task-board/backend/internal/services"
)

// TaskHandler handles all task-related HTTP requests.
type TaskHandler struct {
	service *services.TaskService
}

// NewTaskHandler creates a TaskHandler backed by the given service.
func NewTaskHandler(service *services.TaskService) *TaskHandler {
	return &TaskHandler{service: service}
}

// Routes is unused — task routes are wired directly in main.go to avoid
// chi sub-router conflicts between /{id} flat routes and /{taskId} nested routes.

// List handles GET /api/v1/tasks
func (h *TaskHandler) List(w http.ResponseWriter, r *http.Request) {
	token := middleware.GetToken(r.Context())

	filters := models.TaskFilters{
		Status:     r.URL.Query().Get("status"),
		Priority:   r.URL.Query().Get("priority"),
		Search:     r.URL.Query().Get("search"),
		AssigneeID: r.URL.Query().Get("assignee_id"),
		LabelID:    r.URL.Query().Get("label_id"),
	}

	tasks, err := h.service.ListTasks(r.Context(), token, filters)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{"tasks": tasks})
}

// Create handles POST /api/v1/tasks
func (h *TaskHandler) Create(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	token := middleware.GetToken(r.Context())

	var input models.CreateTaskInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		writeError(w, http.StatusBadRequest, "VALIDATION_ERROR", "invalid request body")
		return
	}

	input.Title = strings.TrimSpace(input.Title)
	if input.Title == "" {
		writeError(w, http.StatusBadRequest, "VALIDATION_ERROR", "title is required")
		return
	}
	if len(input.Title) > 500 {
		writeError(w, http.StatusBadRequest, "VALIDATION_ERROR", "title must be at most 500 characters")
		return
	}

	if input.Status == "" {
		input.Status = models.TaskStatusTodo
	}
	if input.Priority == "" {
		input.Priority = models.TaskPriorityNormal
	}

	switch input.Status {
	case models.TaskStatusTodo, models.TaskStatusInProgress, models.TaskStatusInReview, models.TaskStatusDone:
	default:
		writeError(w, http.StatusBadRequest, "VALIDATION_ERROR", "invalid status")
		return
	}
	switch input.Priority {
	case models.TaskPriorityLow, models.TaskPriorityNormal, models.TaskPriorityHigh:
	default:
		writeError(w, http.StatusBadRequest, "VALIDATION_ERROR", "invalid priority")
		return
	}

	task, err := h.service.CreateTask(r.Context(), userID, token, input)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
		return
	}
	writeJSON(w, http.StatusCreated, map[string]interface{}{"task": task})
}

// Update handles PATCH /api/v1/tasks/{taskId}
func (h *TaskHandler) Update(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "taskId")
	userID := middleware.GetUserID(r.Context())
	token := middleware.GetToken(r.Context())

	var input models.UpdateTaskInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		writeError(w, http.StatusBadRequest, "VALIDATION_ERROR", "invalid request body")
		return
	}

	if input.Title != nil {
		*input.Title = strings.TrimSpace(*input.Title)
		if *input.Title == "" {
			writeError(w, http.StatusBadRequest, "VALIDATION_ERROR", "title cannot be empty")
			return
		}
	}
	if input.Status != nil {
		switch *input.Status {
		case models.TaskStatusTodo, models.TaskStatusInProgress, models.TaskStatusInReview, models.TaskStatusDone:
		default:
			writeError(w, http.StatusBadRequest, "VALIDATION_ERROR", "invalid status")
			return
		}
	}
	if input.Priority != nil {
		switch *input.Priority {
		case models.TaskPriorityLow, models.TaskPriorityNormal, models.TaskPriorityHigh:
		default:
			writeError(w, http.StatusBadRequest, "VALIDATION_ERROR", "invalid priority")
			return
		}
	}

	task, err := h.service.UpdateTask(r.Context(), userID, token, id, input)
	if err != nil {
		if errors.Is(err, services.ErrNotFound) {
			writeError(w, http.StatusNotFound, "NOT_FOUND", "task not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{"task": task})
}

// Delete handles DELETE /api/v1/tasks/{taskId}
func (h *TaskHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "taskId")
	token := middleware.GetToken(r.Context())

	if err := h.service.DeleteTask(r.Context(), token, id); err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// Reorder handles PATCH /api/v1/tasks/reorder
func (h *TaskHandler) Reorder(w http.ResponseWriter, r *http.Request) {
	token := middleware.GetToken(r.Context())

	var input models.ReorderInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		writeError(w, http.StatusBadRequest, "VALIDATION_ERROR", "invalid request body")
		return
	}
	if len(input.Updates) == 0 {
		writeJSON(w, http.StatusOK, map[string]interface{}{"ok": true})
		return
	}

	if err := h.service.ReorderTasks(r.Context(), token, input.Updates); err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{"ok": true})
}
