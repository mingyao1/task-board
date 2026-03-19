package services

import (
	"context"
	"encoding/json"
	"fmt"
	"time"
)

// ActivityService fetches activity logs from PostgREST and transforms them
// into the shape the frontend expects.
type ActivityService struct {
	rest *RestClient
}

// NewActivityService creates an ActivityService backed by the given RestClient.
func NewActivityService(rest *RestClient) *ActivityService {
	return &ActivityService{rest: rest}
}

// ActivityLogResponse is the shape sent to the frontend.
// It flattens the JSONB `details` column into old_value / new_value fields.
type ActivityLogResponse struct {
	ID        string  `json:"id"`
	TaskID    string  `json:"task_id"`
	UserID    string  `json:"user_id"`
	Action    string  `json:"action"`
	OldValue  *string `json:"old_value"`
	NewValue  *string `json:"new_value"`
	CreatedAt string  `json:"created_at"`
}

type pgActivityLog struct {
	ID        string          `json:"id"`
	TaskID    string          `json:"task_id"`
	UserID    string          `json:"user_id"`
	Action    string          `json:"action"`
	Details   json.RawMessage `json:"details"`
	CreatedAt time.Time       `json:"created_at"`
}

// ListActivity returns all activity log entries for a task, newest last.
func (s *ActivityService) ListActivity(ctx context.Context, token, taskID string) ([]ActivityLogResponse, error) {
	body, status, err := s.rest.Do(ctx, RequestOptions{
		Method: "GET",
		Path:   "/activity_logs",
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

	var rows []pgActivityLog
	if err := json.Unmarshal(body, &rows); err != nil {
		return nil, fmt.Errorf("decode activity logs: %w", err)
	}

	result := make([]ActivityLogResponse, len(rows))
	for i, row := range rows {
		entry := ActivityLogResponse{
			ID:        row.ID,
			TaskID:    row.TaskID,
			UserID:    row.UserID,
			Action:    row.Action,
			CreatedAt: row.CreatedAt.Format(time.RFC3339),
		}
		// Extract old_value / new_value from details JSONB.
		// Details shape for status/priority changes: {"from": "x", "to": "y"}
		if len(row.Details) > 0 {
			var details map[string]string
			if json.Unmarshal(row.Details, &details) == nil {
				if from, ok := details["from"]; ok {
					v := from
					entry.OldValue = &v
				}
				if to, ok := details["to"]; ok {
					v := to
					entry.NewValue = &v
				}
			}
		}
		result[i] = entry
	}

	return result, nil
}
