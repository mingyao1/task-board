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

// Task is the core domain model, matching the `tasks` table in Supabase.
type Task struct {
	ID          string       `json:"id"`
	Title       string       `json:"title"`
	Description string       `json:"description"`
	Status      TaskStatus   `json:"status"`
	Priority    TaskPriority `json:"priority"`
	DueDate     *string      `json:"due_date"`   // ISO-8601 date string or null
	Position    int          `json:"position"`
	UserID      string       `json:"user_id"`
	CreatedAt   time.Time    `json:"created_at"`
	UpdatedAt   time.Time    `json:"updated_at"`

	// Relations populated by JOIN queries / separate fetches.
	Assignees []TeamMember `json:"assignees"`
	Labels    []Label      `json:"labels"`
}

// CreateTaskInput is the validated request body for POST /api/v1/tasks.
type CreateTaskInput struct {
	Title       string       `json:"title"`
	Description string       `json:"description"`
	Status      TaskStatus   `json:"status"`
	Priority    TaskPriority `json:"priority"`
	DueDate     *string      `json:"due_date"`
	AssigneeIDs []string     `json:"assignee_ids"`
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
	AssigneeIDs *[]string     `json:"assignee_ids"`
	LabelIDs    *[]string     `json:"label_ids"`
}

// ReorderItem represents a single task position update in the bulk reorder request.
type ReorderItem struct {
	ID       string     `json:"id"`
	Status   TaskStatus `json:"status"`
	Position int        `json:"position"`
}

// ReorderInput is the request body for PATCH /api/v1/tasks/reorder.
type ReorderInput struct {
	Updates []ReorderItem `json:"updates"`
}
