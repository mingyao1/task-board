package models

import (
	"encoding/json"
	"time"
)

// ActivityAction is the type of event that was recorded.
// These names match the frontend's ActivityAction union type.
type ActivityAction string

const (
	ActivityActionCreated         ActivityAction = "created"
	ActivityActionUpdated         ActivityAction = "updated"
	ActivityActionStatusChanged   ActivityAction = "status_changed"
	ActivityActionPriorityChanged ActivityAction = "priority_changed"
	ActivityActionAssigned        ActivityAction = "assigned"
	ActivityActionUnassigned      ActivityAction = "unassigned"
	ActivityActionDueDateSet      ActivityAction = "due_date_set"
	ActivityActionDueDateCleared  ActivityAction = "due_date_cleared"
	ActivityActionLabelAdded      ActivityAction = "label_added"
	ActivityActionLabelRemoved    ActivityAction = "label_removed"
	ActivityActionCommentAdded    ActivityAction = "comment_added"
	ActivityActionCommentDeleted  ActivityAction = "comment_deleted"
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
