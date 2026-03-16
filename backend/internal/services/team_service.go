package services

import (
	supa "github.com/supabase-community/supabase-go"
)

// TeamService contains business logic for team-member operations.
type TeamService struct {
	db *supa.Client
}

// NewTeamService creates a TeamService with the given Supabase client.
func NewTeamService(db *supa.Client) *TeamService {
	return &TeamService{db: db}
}
