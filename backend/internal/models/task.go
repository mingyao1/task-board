package models

import "time"

// TaskStatus represents the kanban column a task lives in.
type TaskStatus string

const (
	TaskStatusTodo       TaskStatus = "todo"
	TaskStatusInProgress TaskStatus = "in_progress"
	TaskStatusInReview   TaskStatus = "in_review"
	TaskStatusDone       TaskStatus = "done"
)

// TaskPriority represents how urgent a task is.
type TaskPriority string

const (
	TaskPriorityLow    TaskPriority = "low"
	TaskPriorityNormal TaskPriority = "normal"
	TaskPriorityHigh   TaskPriority = "high"
)

// Task is the core domain model returned by the API.
// Uses a single assignee (AssigneeID + Assignee) and multiple labels (LabelIDs + Labels).
type Task struct {
	ID          string       `json:"id"`
	Title       string       `json:"title"`
	Description *string      `json:"description"`
	Status      TaskStatus   `json:"status"`
	Priority    TaskPriority `json:"priority"`
	DueDate     *string      `json:"due_date"`
	Position    int          `json:"position"`
	UserID      string       `json:"user_id"`
	CreatedAt   time.Time    `json:"created_at"`
	UpdatedAt   time.Time    `json:"updated_at"`

	// Single assignee resolved from the task_assignees join table.
	AssigneeID *string     `json:"assignee_id"`
	Assignee   *TeamMember `json:"assignee,omitempty"`

	// Labels resolved from the task_labels join table.
	LabelIDs []string `json:"label_ids"`
	Labels   []Label  `json:"labels,omitempty"`
}

// CreateTaskInput is the validated request body for POST /api/v1/tasks.
type CreateTaskInput struct {
	Title       string       `json:"title"`
	Description string       `json:"description"`
	Status      TaskStatus   `json:"status"`
	Priority    TaskPriority `json:"priority"`
	DueDate     *string      `json:"due_date"`
	AssigneeID  *string      `json:"assignee_id"`
	LabelIDs    []string     `json:"label_ids"`
}

// UpdateTaskInput is the validated request body for PATCH /api/v1/tasks/:id.
// All fields are pointers so we can distinguish "not provided" from zero-value.
type UpdateTaskInput struct {
	Title       *string       `json:"title"`
	Description *string       `json:"description"`
	Status      *TaskStatus   `json:"status"`
	Priority    *TaskPriority `json:"priority"`
	DueDate     *string       `json:"due_date"`
	Position    *int          `json:"position"`
	AssigneeID  *string       `json:"assignee_id"`
	LabelIDs    *[]string     `json:"label_ids"`
}

// ReorderItem represents a single task position update in the bulk reorder request.
type ReorderItem struct {
	ID        string     `json:"id"`
	Status    TaskStatus `json:"status"`
	OldStatus TaskStatus `json:"old_status,omitempty"` // optional: previous status, used for activity logging
	Position  int        `json:"position"`
}

// ReorderInput is the request body for PATCH /api/v1/tasks/reorder.
type ReorderInput struct {
	Updates []ReorderItem `json:"updates"`
}

// TaskFilters holds optional query filters for listing tasks.
type TaskFilters struct {
	Status     string // comma-separated values accepted
	Priority   string // comma-separated values accepted
	Search     string
	AssigneeID string
	LabelID    string
}
