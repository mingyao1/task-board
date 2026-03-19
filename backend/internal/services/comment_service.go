package services

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"task-board/backend/internal/models"
)

// CommentService handles comment CRUD and creates activity log side-effects.
type CommentService struct {
	rest *RestClient
}

// NewCommentService creates a CommentService backed by the given RestClient.
func NewCommentService(rest *RestClient) *CommentService {
	return &CommentService{rest: rest}
}

type pgComment struct {
	ID        string    `json:"id"`
	TaskID    string    `json:"task_id"`
	UserID    string    `json:"user_id"`
	Content   string    `json:"content"`
	CreatedAt time.Time `json:"created_at"`
}

func (pg pgComment) toComment() models.Comment {
	return models.Comment{
		ID:        pg.ID,
		TaskID:    pg.TaskID,
		UserID:    pg.UserID,
		Content:   pg.Content,
		CreatedAt: pg.CreatedAt,
	}
}

// ListComments returns all comments for a task, oldest first.
func (s *CommentService) ListComments(ctx context.Context, token, taskID string) ([]models.Comment, error) {
	body, status, err := s.rest.Do(ctx, RequestOptions{
		Method: "GET",
		Path:   "/comments",
		Token:  token,
		QueryParams: map[string]string{
			"task_id": "eq." + taskID,
			"order":   "created_at.asc",
		},
	})
	if err != nil {
		return nil, err
	}
	if status != 200 {
		return nil, parsePostgRESTError(body, status)
	}

	var rows []pgComment
	if err := json.Unmarshal(body, &rows); err != nil {
		return nil, fmt.Errorf("decode comments: %w", err)
	}

	comments := make([]models.Comment, len(rows))
	for i, row := range rows {
		comments[i] = row.toComment()
	}
	return comments, nil
}

// CreateComment inserts a new comment and logs the activity.
func (s *CommentService) CreateComment(ctx context.Context, token, taskID, userID, content string) (models.Comment, error) {
	content = strings.TrimSpace(content)
	if content == "" {
		return models.Comment{}, fmt.Errorf("content is required")
	}

	body, status, err := s.rest.Do(ctx, RequestOptions{
		Method: "POST",
		Path:   "/comments",
		Token:  token,
		Body: map[string]string{
			"task_id": taskID,
			"user_id": userID,
			"content": content,
		},
		Headers: map[string]string{"Prefer": "return=representation"},
	})
	if err != nil {
		return models.Comment{}, err
	}
	if status != 201 {
		return models.Comment{}, parsePostgRESTError(body, status)
	}

	var rows []pgComment
	if err := json.Unmarshal(body, &rows); err != nil || len(rows) == 0 {
		return models.Comment{}, fmt.Errorf("decode inserted comment: %w", err)
	}

	// Activity log — non-fatal.
	_ = s.logActivity(ctx, token, taskID, userID, string(models.ActivityActionCommentAdded))

	return rows[0].toComment(), nil
}

// DeleteComment deletes a comment by ID and logs the activity.
func (s *CommentService) DeleteComment(ctx context.Context, token, taskID, commentID, userID string) error {
	body, status, err := s.rest.Do(ctx, RequestOptions{
		Method: "DELETE",
		Path:   "/comments",
		Token:  token,
		QueryParams: map[string]string{
			"id":      "eq." + commentID,
			"task_id": "eq." + taskID,
		},
	})
	if err != nil {
		return err
	}
	if status != 204 && status != 200 {
		return parsePostgRESTError(body, status)
	}

	// Activity log — non-fatal.
	_ = s.logActivity(ctx, token, taskID, userID, string(models.ActivityActionCommentDeleted))

	return nil
}

func (s *CommentService) logActivity(ctx context.Context, token, taskID, userID, action string) error {
	_, statusCode, err := s.rest.Do(ctx, RequestOptions{
		Method: "POST",
		Path:   "/activity_logs",
		Token:  token,
		Body: map[string]interface{}{
			"task_id": taskID,
			"user_id": userID,
			"action":  action,
			"details": map[string]string{},
		},
	})
	if err != nil {
		return err
	}
	if statusCode != 201 && statusCode != 200 {
		return fmt.Errorf("insert activity log: status %d", statusCode)
	}
	return nil
}
