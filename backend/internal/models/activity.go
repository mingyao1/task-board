package models

import (
	"encoding/json"
	"time"
)

// ActivityAction is the type of event that was recorded.
type ActivityAction string

const (
	ActivityActionCreated        ActivityAction = "created"
	ActivityActionStatusChange   ActivityAction = "status_change"
	ActivityActionPriorityChange ActivityAction = "priority_change"
	ActivityActionAssign         ActivityAction = "assign"
	ActivityActionComment        ActivityAction = "comment"
)

// ActivityLog records a state-change event on a task.
// Matches the `activity_logs` table in Supabase.
type ActivityLog struct {
	ID        string          `json:"id"`
	TaskID    string          `json:"task_id"`
	UserID    string          `json:"user_id"`
	Action    ActivityAction  `json:"action"`
	Details   json.RawMessage `json:"details"` // JSONB — shape varies by action
	CreatedAt time.Time       `json:"created_at"`
}
