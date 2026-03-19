package services

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"task-board/backend/internal/models"
)

// TeamService handles team member CRUD against PostgREST.
type TeamService struct {
	rest *RestClient
}

// NewTeamService creates a TeamService backed by the given RestClient.
func NewTeamService(rest *RestClient) *TeamService {
	return &TeamService{rest: rest}
}

type pgTeamMember struct {
	ID        string    `json:"id"`
	UserID    string    `json:"user_id"`
	Name      string    `json:"name"`
	Color     string    `json:"color"`
	AvatarURL *string   `json:"avatar_url"`
	CreatedAt time.Time `json:"created_at"`
}

func (pg pgTeamMember) toModel() models.TeamMember {
	return models.TeamMember{
		ID:        pg.ID,
		UserID:    pg.UserID,
		Name:      pg.Name,
		Color:     pg.Color,
		AvatarURL: pg.AvatarURL,
		CreatedAt: pg.CreatedAt,
	}
}

// List returns all team members for the authenticated user.
func (s *TeamService) List(ctx context.Context, token string) ([]models.TeamMember, error) {
	body, status, err := s.rest.Do(ctx, RequestOptions{
		Method:      "GET",
		Path:        "/team_members",
		Token:       token,
		QueryParams: map[string]string{"order": "created_at.asc"},
	})
	if err != nil {
		return nil, err
	}
	if status != 200 {
		return nil, parsePostgRESTError(body, status)
	}

	var rows []pgTeamMember
	if err := json.Unmarshal(body, &rows); err != nil {
		return nil, fmt.Errorf("decode team members: %w", err)
	}

	members := make([]models.TeamMember, len(rows))
	for i, row := range rows {
		members[i] = row.toModel()
	}
	return members, nil
}

// Create inserts a new team member and returns the created record.
func (s *TeamService) Create(ctx context.Context, userID, token string, input models.CreateTeamMemberInput) (models.TeamMember, error) {
	name := strings.TrimSpace(input.Name)
	if name == "" {
		return models.TeamMember{}, fmt.Errorf("name is required")
	}
	color := input.Color
	if color == "" {
		color = "#6366F1"
	}

	body, status, err := s.rest.Do(ctx, RequestOptions{
		Method: "POST",
		Path:   "/team_members",
		Token:  token,
		Body: map[string]string{
			"user_id": userID,
			"name":    name,
			"color":   color,
		},
		Headers: map[string]string{"Prefer": "return=representation"},
	})
	if err != nil {
		return models.TeamMember{}, err
	}
	if status != 201 {
		return models.TeamMember{}, parsePostgRESTError(body, status)
	}

	var rows []pgTeamMember
	if err := json.Unmarshal(body, &rows); err != nil || len(rows) == 0 {
		return models.TeamMember{}, fmt.Errorf("decode inserted team member: %w", err)
	}
	return rows[0].toModel(), nil
}

// Update applies partial updates to a team member and returns the updated record.
func (s *TeamService) Update(ctx context.Context, token, id string, input models.UpdateTeamMemberInput) (models.TeamMember, error) {
	payload := map[string]interface{}{}
	if input.Name != nil {
		name := strings.TrimSpace(*input.Name)
		if name == "" {
			return models.TeamMember{}, fmt.Errorf("name cannot be empty")
		}
		payload["name"] = name
	}
	if input.Color != nil {
		payload["color"] = *input.Color
	}
	if len(payload) == 0 {
		return s.fetchOneMember(ctx, token, id)
	}

	body, status, err := s.rest.Do(ctx, RequestOptions{
		Method:      "PATCH",
		Path:        "/team_members",
		Token:       token,
		Body:        payload,
		QueryParams: map[string]string{"id": "eq." + id},
		Headers:     map[string]string{"Prefer": "return=representation"},
	})
	if err != nil {
		return models.TeamMember{}, err
	}
	if status != 200 {
		return models.TeamMember{}, parsePostgRESTError(body, status)
	}

	var rows []pgTeamMember
	if err := json.Unmarshal(body, &rows); err != nil || len(rows) == 0 {
		return models.TeamMember{}, fmt.Errorf("decode updated team member: %w", err)
	}
	return rows[0].toModel(), nil
}

// Delete removes a team member by ID.
func (s *TeamService) Delete(ctx context.Context, token, id string) error {
	body, status, err := s.rest.Do(ctx, RequestOptions{
		Method:      "DELETE",
		Path:        "/team_members",
		Token:       token,
		QueryParams: map[string]string{"id": "eq." + id},
	})
	if err != nil {
		return err
	}
	if status != 204 && status != 200 {
		return parsePostgRESTError(body, status)
	}
	return nil
}

func (s *TeamService) fetchOneMember(ctx context.Context, token, id string) (models.TeamMember, error) {
	body, status, err := s.rest.Do(ctx, RequestOptions{
		Method:      "GET",
		Path:        "/team_members",
		Token:       token,
		QueryParams: map[string]string{"id": "eq." + id, "limit": "1"},
	})
	if err != nil {
		return models.TeamMember{}, err
	}
	if status != 200 {
		return models.TeamMember{}, parsePostgRESTError(body, status)
	}
	var rows []pgTeamMember
	if err := json.Unmarshal(body, &rows); err != nil || len(rows) == 0 {
		return models.TeamMember{}, ErrNotFound
	}
	return rows[0].toModel(), nil
}
