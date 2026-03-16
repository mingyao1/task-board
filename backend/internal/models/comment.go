package models

import "time"

// Comment is a user note attached to a task.
// Matches the `comments` table in Supabase.
type Comment struct {
	ID        string    `json:"id"`
	TaskID    string    `json:"task_id"`
	UserID    string    `json:"user_id"`
	Content   string    `json:"content"`
	CreatedAt time.Time `json:"created_at"`
}

// CreateCommentInput is the request body for POST /api/v1/tasks/:taskId/comments.
type CreateCommentInput struct {
	Content string `json:"content"`
}
