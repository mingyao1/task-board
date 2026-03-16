package services

import (
	supa "github.com/supabase-community/supabase-go"
)

// CommentService contains business logic for comment operations and handles
// side-effects such as creating activity log entries when a comment is posted.
type CommentService struct {
	db *supa.Client
}

// NewCommentService creates a CommentService with the given Supabase client.
func NewCommentService(db *supa.Client) *CommentService {
	return &CommentService{db: db}
}
