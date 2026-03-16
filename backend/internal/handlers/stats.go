package handlers

import (
	"net/http"

	supa "github.com/supabase-community/supabase-go"
)

// StatsHandler handles board-stats HTTP requests.
type StatsHandler struct {
	db *supa.Client
}

// NewStatsHandler creates a StatsHandler with the given Supabase client.
func NewStatsHandler(db *supa.Client) *StatsHandler {
	return &StatsHandler{db: db}
}

// Get handles GET /api/v1/stats
func (h *StatsHandler) Get(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]any{
		"total_tasks": 0,
		"by_status": map[string]int{
			"todo":        0,
			"in_progress": 0,
			"in_review":   0,
			"done":        0,
		},
		"overdue":              0,
		"due_today":            0,
		"completed_this_week":  0,
	})
}
