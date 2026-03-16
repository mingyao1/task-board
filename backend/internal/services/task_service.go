package services

import (
	supa "github.com/supabase-community/supabase-go"
)

// TaskService contains business logic for task operations and handles
// side-effects such as creating activity log entries.
type TaskService struct {
	db *supa.Client
}

// NewTaskService creates a TaskService with the given Supabase client.
func NewTaskService(db *supa.Client) *TaskService {
	return &TaskService{db: db}
}
