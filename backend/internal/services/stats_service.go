package services

import (
	"context"
	"encoding/json"
	"fmt"
	"time"
)

// BoardStats is the aggregate summary returned by GET /api/v1/stats.
type BoardStats struct {
	Total      int            `json:"total"`
	ByStatus   map[string]int `json:"by_status"`
	ByPriority map[string]int `json:"by_priority"`
	Overdue    int            `json:"overdue"`
	DueToday   int            `json:"due_today"`
}

// StatsService computes board statistics from PostgREST task data.
type StatsService struct {
	rest *RestClient
}

// NewStatsService creates a StatsService backed by the given RestClient.
func NewStatsService(rest *RestClient) *StatsService {
	return &StatsService{rest: rest}
}

type pgStatTask struct {
	Status   string  `json:"status"`
	Priority string  `json:"priority"`
	DueDate  *string `json:"due_date"`
}

// Get fetches all tasks for the user (minimal columns) and computes aggregate stats.
func (s *StatsService) Get(ctx context.Context, token string) (BoardStats, error) {
	body, status, err := s.rest.Do(ctx, RequestOptions{
		Method:      "GET",
		Path:        "/tasks",
		Token:       token,
		QueryParams: map[string]string{"select": "status,priority,due_date"},
	})
	if err != nil {
		return BoardStats{}, err
	}
	if status != 200 {
		return BoardStats{}, fmt.Errorf("stats fetch: %s", parsePostgRESTError(body, status))
	}

	var rows []pgStatTask
	if err := json.Unmarshal(body, &rows); err != nil {
		return BoardStats{}, fmt.Errorf("decode stats tasks: %w", err)
	}

	today := time.Now().UTC().Format("2006-01-02")

	stats := BoardStats{
		Total: len(rows),
		ByStatus: map[string]int{
			"todo":        0,
			"in_progress": 0,
			"in_review":   0,
			"done":        0,
		},
		ByPriority: map[string]int{
			"high":   0,
			"normal": 0,
			"low":    0,
		},
	}

	for _, t := range rows {
		stats.ByStatus[t.Status]++
		stats.ByPriority[t.Priority]++

		if t.DueDate != nil && *t.DueDate != "" && t.Status != "done" {
			due := *t.DueDate
			if due < today {
				stats.Overdue++
			} else if due == today {
				stats.DueToday++
			}
		}
	}

	return stats, nil
}
