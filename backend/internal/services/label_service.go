package services

import (
	supa "github.com/supabase-community/supabase-go"
)

// LabelService contains business logic for label operations.
type LabelService struct {
	db *supa.Client
}

// NewLabelService creates a LabelService with the given Supabase client.
func NewLabelService(db *supa.Client) *LabelService {
	return &LabelService{db: db}
}
