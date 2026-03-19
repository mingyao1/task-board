package services

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"task-board/backend/internal/models"
)

// LabelService handles label CRUD against PostgREST.
type LabelService struct {
	rest *RestClient
}

// NewLabelService creates a LabelService backed by the given RestClient.
func NewLabelService(rest *RestClient) *LabelService {
	return &LabelService{rest: rest}
}

type pgLabel struct {
	ID        string    `json:"id"`
	UserID    string    `json:"user_id"`
	Name      string    `json:"name"`
	Color     string    `json:"color"`
	CreatedAt time.Time `json:"created_at"`
}

func (pg pgLabel) toModel() models.Label {
	return models.Label{
		ID:        pg.ID,
		UserID:    pg.UserID,
		Name:      pg.Name,
		Color:     pg.Color,
		CreatedAt: pg.CreatedAt,
	}
}

// List returns all labels for the authenticated user.
func (s *LabelService) List(ctx context.Context, token string) ([]models.Label, error) {
	body, status, err := s.rest.Do(ctx, RequestOptions{
		Method:      "GET",
		Path:        "/labels",
		Token:       token,
		QueryParams: map[string]string{"order": "created_at.asc"},
	})
	if err != nil {
		return nil, err
	}
	if status != 200 {
		return nil, parsePostgRESTError(body, status)
	}

	var rows []pgLabel
	if err := json.Unmarshal(body, &rows); err != nil {
		return nil, fmt.Errorf("decode labels: %w", err)
	}

	labels := make([]models.Label, len(rows))
	for i, row := range rows {
		labels[i] = row.toModel()
	}
	return labels, nil
}

// Create inserts a new label and returns the created record.
func (s *LabelService) Create(ctx context.Context, userID, token string, input models.CreateLabelInput) (models.Label, error) {
	name := strings.TrimSpace(input.Name)
	if name == "" {
		return models.Label{}, fmt.Errorf("name is required")
	}
	color := input.Color
	if color == "" {
		color = "#6366F1"
	}

	body, status, err := s.rest.Do(ctx, RequestOptions{
		Method: "POST",
		Path:   "/labels",
		Token:  token,
		Body: map[string]string{
			"user_id": userID,
			"name":    name,
			"color":   color,
		},
		Headers: map[string]string{"Prefer": "return=representation"},
	})
	if err != nil {
		return models.Label{}, err
	}
	if status != 201 {
		return models.Label{}, parsePostgRESTError(body, status)
	}

	var rows []pgLabel
	if err := json.Unmarshal(body, &rows); err != nil || len(rows) == 0 {
		return models.Label{}, fmt.Errorf("decode inserted label: %w", err)
	}
	return rows[0].toModel(), nil
}

// Update applies partial updates to a label and returns the updated record.
func (s *LabelService) Update(ctx context.Context, token, id string, input models.UpdateLabelInput) (models.Label, error) {
	payload := map[string]interface{}{}
	if input.Name != nil {
		name := strings.TrimSpace(*input.Name)
		if name == "" {
			return models.Label{}, fmt.Errorf("name cannot be empty")
		}
		payload["name"] = name
	}
	if input.Color != nil {
		payload["color"] = *input.Color
	}
	if len(payload) == 0 {
		return s.fetchOneLabel(ctx, token, id)
	}

	body, status, err := s.rest.Do(ctx, RequestOptions{
		Method:      "PATCH",
		Path:        "/labels",
		Token:       token,
		Body:        payload,
		QueryParams: map[string]string{"id": "eq." + id},
		Headers:     map[string]string{"Prefer": "return=representation"},
	})
	if err != nil {
		return models.Label{}, err
	}
	if status != 200 {
		return models.Label{}, parsePostgRESTError(body, status)
	}

	var rows []pgLabel
	if err := json.Unmarshal(body, &rows); err != nil || len(rows) == 0 {
		return models.Label{}, fmt.Errorf("decode updated label: %w", err)
	}
	return rows[0].toModel(), nil
}

// Delete removes a label by ID.
func (s *LabelService) Delete(ctx context.Context, token, id string) error {
	body, status, err := s.rest.Do(ctx, RequestOptions{
		Method:      "DELETE",
		Path:        "/labels",
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

func (s *LabelService) fetchOneLabel(ctx context.Context, token, id string) (models.Label, error) {
	body, status, err := s.rest.Do(ctx, RequestOptions{
		Method:      "GET",
		Path:        "/labels",
		Token:       token,
		QueryParams: map[string]string{"id": "eq." + id, "limit": "1"},
	})
	if err != nil {
		return models.Label{}, err
	}
	if status != 200 {
		return models.Label{}, parsePostgRESTError(body, status)
	}
	var rows []pgLabel
	if err := json.Unmarshal(body, &rows); err != nil || len(rows) == 0 {
		return models.Label{}, ErrNotFound
	}
	return rows[0].toModel(), nil
}
