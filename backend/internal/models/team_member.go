package models

import "time"

// TeamMember represents a person that can be assigned to tasks.
// Matches the `team_members` table in Supabase.
type TeamMember struct {
	ID        string    `json:"id"`
	UserID    string    `json:"user_id"`
	Name      string    `json:"name"`
	Color     string    `json:"color"`
	AvatarURL *string   `json:"avatar_url"`
	CreatedAt time.Time `json:"created_at"`
}

// CreateTeamMemberInput is the request body for POST /api/v1/team-members.
type CreateTeamMemberInput struct {
	Name  string `json:"name"`
	Color string `json:"color"`
}

// UpdateTeamMemberInput is the request body for PATCH /api/v1/team-members/:id.
type UpdateTeamMemberInput struct {
	Name      *string `json:"name"`
	Color     *string `json:"color"`
	AvatarURL *string `json:"avatar_url"`
}
