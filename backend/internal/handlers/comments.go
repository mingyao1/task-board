package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"

	"task-board/backend/internal/middleware"
	"task-board/backend/internal/models"
	"task-board/backend/internal/services"
)

// CommentHandler handles comment-related HTTP requests.
type CommentHandler struct {
	service *services.CommentService
}

// NewCommentHandler creates a CommentHandler backed by the given service.
func NewCommentHandler(service *services.CommentService) *CommentHandler {
	return &CommentHandler{service: service}
}

// Routes is unused — comment routes are wired directly in main.go.
func (h *CommentHandler) Routes(_ chi.Router) {}

// List handles GET /api/v1/tasks/{taskId}/comments
func (h *CommentHandler) List(w http.ResponseWriter, r *http.Request) {
	taskID := chi.URLParam(r, "taskId")
	token := middleware.GetToken(r.Context())

	comments, err := h.service.ListComments(r.Context(), token, taskID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{"comments": comments})
}

// Create handles POST /api/v1/tasks/{taskId}/comments
func (h *CommentHandler) Create(w http.ResponseWriter, r *http.Request) {
	taskID := chi.URLParam(r, "taskId")
	userID := middleware.GetUserID(r.Context())
	token := middleware.GetToken(r.Context())

	var input models.CreateCommentInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		writeError(w, http.StatusBadRequest, "VALIDATION_ERROR", "invalid request body")
		return
	}
	if input.Content == "" {
		writeError(w, http.StatusBadRequest, "VALIDATION_ERROR", "content is required")
		return
	}

	comment, err := h.service.CreateComment(r.Context(), token, taskID, userID, input.Content)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
		return
	}
	writeJSON(w, http.StatusCreated, map[string]interface{}{"comment": comment})
}

// Delete handles DELETE /api/v1/tasks/{taskId}/comments/{commentId}
func (h *CommentHandler) Delete(w http.ResponseWriter, r *http.Request) {
	taskID := chi.URLParam(r, "taskId")
	commentID := chi.URLParam(r, "commentId")
	userID := middleware.GetUserID(r.Context())
	token := middleware.GetToken(r.Context())

	if err := h.service.DeleteComment(r.Context(), token, taskID, commentID, userID); err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
