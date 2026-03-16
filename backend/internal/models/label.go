package models

import "time"

// Label is a coloured tag that can be attached to tasks.
// Matches the `labels` table in Supabase.
type Label struct {
	ID        string    `json:"id"`
	UserID    string    `json:"user_id"`
	Name      string    `json:"name"`
	Color     string    `json:"color"`
	CreatedAt time.Time `json:"created_at"`
}

// CreateLabelInput is the request body for POST /api/v1/labels.
type CreateLabelInput struct {
	Name  string `json:"name"`
	Color string `json:"color"`
}

// UpdateLabelInput is the request body for PATCH /api/v1/labels/:id.
type UpdateLabelInput struct {
	Name  *string `json:"name"`
	Color *string `json:"color"`
}
