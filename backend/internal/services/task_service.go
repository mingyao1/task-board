package services

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"task-board/backend/internal/models"
)

// ErrNotFound is returned when a requested resource does not exist.
var ErrNotFound = errors.New("not found")

// TaskService implements task CRUD and activity-log side-effects against
// the Supabase PostgREST REST API, forwarding the user's JWT so that RLS applies.
type TaskService struct {
	rest *RestClient
}

// NewTaskService creates a TaskService backed by the given RestClient.
func NewTaskService(rest *RestClient) *TaskService {
	return &TaskService{rest: rest}
}

// ─── Internal PostgREST response shapes ──────────────────────────────────────

// pgTask is the raw shape returned by PostgREST for a task row with embedded relations.
type pgTask struct {
	ID          string    `json:"id"`
	Title       string    `json:"title"`
	Description *string   `json:"description"`
	Status      string    `json:"status"`
	Priority    string    `json:"priority"`
	DueDate     *string   `json:"due_date"`
	Position    int       `json:"position"`
	UserID      string    `json:"user_id"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`

	TaskAssignees []pgAssigneeRow `json:"task_assignees"`
	TaskLabels    []pgLabelRow    `json:"task_labels"`
}

type pgAssigneeRow struct {
	TeamMembers *pgMember `json:"team_members"`
}

type pgMember struct {
	ID    string `json:"id"`
	Name  string `json:"name"`
	Color string `json:"color"`
}

type pgLabelRow struct {
	Labels *pgEmbeddedLabel `json:"labels"`
}

type pgEmbeddedLabel struct {
	ID    string `json:"id"`
	Name  string `json:"name"`
	Color string `json:"color"`
}

// toTask converts a pgTask to the API model.
func (pg pgTask) toTask() models.Task {
	task := models.Task{
		ID:          pg.ID,
		Title:       pg.Title,
		Description: pg.Description,
		Status:      models.TaskStatus(pg.Status),
		Priority:    models.TaskPriority(pg.Priority),
		DueDate:     pg.DueDate,
		Position:    pg.Position,
		UserID:      pg.UserID,
		CreatedAt:   pg.CreatedAt,
		UpdatedAt:   pg.UpdatedAt,
		LabelIDs:    []string{},
		Labels:      []models.Label{},
	}

	// First assignee (task is treated as single-assignee).
	if len(pg.TaskAssignees) > 0 && pg.TaskAssignees[0].TeamMembers != nil {
		m := pg.TaskAssignees[0].TeamMembers
		task.AssigneeID = &m.ID
		task.Assignee = &models.TeamMember{ID: m.ID, Name: m.Name, Color: m.Color}
	}

	for _, tl := range pg.TaskLabels {
		if l := tl.Labels; l != nil {
			task.LabelIDs = append(task.LabelIDs, l.ID)
			task.Labels = append(task.Labels, models.Label{
				ID:    l.ID,
				Name:  l.Name,
				Color: l.Color,
			})
		}
	}

	return task
}

// postgrestError is the error shape returned by PostgREST on failure.
type postgrestError struct {
	Code    string `json:"code"`
	Details string `json:"details"`
	Hint    string `json:"hint"`
	Message string `json:"message"`
}

func parsePostgRESTError(body []byte, status int) error {
	var pgErr postgrestError
	if err := json.Unmarshal(body, &pgErr); err == nil && pgErr.Message != "" {
		return fmt.Errorf("postgrest %d: %s", status, pgErr.Message)
	}
	return fmt.Errorf("postgrest %d: %s", status, string(body))
}

// taskSelectParam is the PostgREST select expression for tasks with embedded relations.
const taskSelectParam = "*,task_assignees(team_members(id,name,color)),task_labels(labels(id,name,color))"

// ─── Public methods ───────────────────────────────────────────────────────────

// ListTasks returns all tasks visible to the user (RLS enforced via JWT).
func (s *TaskService) ListTasks(ctx context.Context, token string, filters models.TaskFilters) ([]models.Task, error) {
	params := map[string]string{
		"select": taskSelectParam,
		"order":  "position.asc",
	}

	if filters.Status != "" {
		parts := strings.Split(filters.Status, ",")
		if len(parts) == 1 {
			params["status"] = "eq." + parts[0]
		} else {
			params["status"] = "in.(" + strings.Join(parts, ",") + ")"
		}
	}
	if filters.Priority != "" {
		parts := strings.Split(filters.Priority, ",")
		if len(parts) == 1 {
			params["priority"] = "eq." + parts[0]
		} else {
			params["priority"] = "in.(" + strings.Join(parts, ",") + ")"
		}
	}
	if filters.Search != "" {
		params["title"] = "ilike.*" + filters.Search + "*"
	}

	body, status, err := s.rest.Do(ctx, RequestOptions{
		Method:      "GET",
		Path:        "/tasks",
		Token:       token,
		QueryParams: params,
	})
	if err != nil {
		return nil, err
	}
	if status != 200 {
		return nil, parsePostgRESTError(body, status)
	}

	var rows []pgTask
	if err := json.Unmarshal(body, &rows); err != nil {
		return nil, fmt.Errorf("decode tasks: %w", err)
	}

	tasks := make([]models.Task, len(rows))
	for i, row := range rows {
		tasks[i] = row.toTask()
	}

	// Post-filter by assignee_id or label_id (simpler than PostgREST join filters).
	if filters.AssigneeID != "" {
		var filtered []models.Task
		for _, t := range tasks {
			if t.AssigneeID != nil && *t.AssigneeID == filters.AssigneeID {
				filtered = append(filtered, t)
			}
		}
		tasks = filtered
	}
	if filters.LabelID != "" {
		var filtered []models.Task
		for _, t := range tasks {
			for _, lid := range t.LabelIDs {
				if lid == filters.LabelID {
					filtered = append(filtered, t)
					break
				}
			}
		}
		tasks = filtered
	}

	if tasks == nil {
		tasks = []models.Task{}
	}
	return tasks, nil
}

// CreateTask inserts a new task, wires up assignee/labels, creates an activity log,
// and returns the full task with relations.
func (s *TaskService) CreateTask(ctx context.Context, userID, token string, input models.CreateTaskInput) (models.Task, error) {
	// Auto-calculate position as max+1 within the target status column.
	position, err := s.nextPosition(ctx, token, string(input.Status))
	if err != nil {
		return models.Task{}, fmt.Errorf("calculate position: %w", err)
	}

	payload := map[string]interface{}{
		"title":    input.Title,
		"status":   string(input.Status),
		"priority": string(input.Priority),
		"position": position,
		"user_id":  userID,
	}
	if input.Description != "" {
		payload["description"] = input.Description
	}
	if input.DueDate != nil && *input.DueDate != "" {
		payload["due_date"] = *input.DueDate
	}

	body, status, err := s.rest.Do(ctx, RequestOptions{
		Method:  "POST",
		Path:    "/tasks",
		Token:   token,
		Body:    payload,
		Headers: map[string]string{"Prefer": "return=representation"},
	})
	if err != nil {
		return models.Task{}, err
	}
	if status != 201 {
		return models.Task{}, parsePostgRESTError(body, status)
	}

	var inserted []map[string]interface{}
	if err := json.Unmarshal(body, &inserted); err != nil || len(inserted) == 0 {
		return models.Task{}, fmt.Errorf("decode inserted task: %w", err)
	}
	taskID, _ := inserted[0]["id"].(string)

	if input.AssigneeID != nil && *input.AssigneeID != "" {
		if err := s.setAssignee(ctx, token, taskID, input.AssigneeID); err != nil {
			return models.Task{}, fmt.Errorf("set assignee: %w", err)
		}
	}
	if len(input.LabelIDs) > 0 {
		if err := s.setLabels(ctx, token, taskID, input.LabelIDs); err != nil {
			return models.Task{}, fmt.Errorf("set labels: %w", err)
		}
	}

	// Activity log — non-fatal if it fails.
	_ = s.createActivityLog(ctx, token, taskID, userID, models.ActivityActionCreated, map[string]interface{}{"title": input.Title})

	return s.fetchOne(ctx, token, taskID)
}

// UpdateTask applies partial updates to a task, syncs assignee/labels,
// writes activity log entries for status/priority changes, and returns
// the updated task with relations.
func (s *TaskService) UpdateTask(ctx context.Context, userID, token, id string, input models.UpdateTaskInput) (models.Task, error) {
	// Fetch current state for activity-log diffing.
	current, err := s.fetchOne(ctx, token, id)
	if err != nil {
		return models.Task{}, err
	}

	updatePayload := map[string]interface{}{}
	if input.Title != nil {
		updatePayload["title"] = *input.Title
	}
	if input.Description != nil {
		if *input.Description == "" {
			updatePayload["description"] = nil
		} else {
			updatePayload["description"] = *input.Description
		}
	}
	if input.Status != nil {
		updatePayload["status"] = string(*input.Status)
	}
	if input.Priority != nil {
		updatePayload["priority"] = string(*input.Priority)
	}
	if input.DueDate != nil {
		if *input.DueDate == "" {
			updatePayload["due_date"] = nil
		} else {
			updatePayload["due_date"] = *input.DueDate
		}
	}
	if input.Position != nil {
		updatePayload["position"] = *input.Position
	}

	if len(updatePayload) > 0 {
		body, status, err := s.rest.Do(ctx, RequestOptions{
			Method:      "PATCH",
			Path:        "/tasks",
			Token:       token,
			Body:        updatePayload,
			QueryParams: map[string]string{"id": "eq." + id},
			Headers:     map[string]string{"Prefer": "return=representation"},
		})
		if err != nil {
			return models.Task{}, err
		}
		if status != 200 {
			return models.Task{}, parsePostgRESTError(body, status)
		}
	}

	if input.AssigneeID != nil {
		if err := s.setAssignee(ctx, token, id, input.AssigneeID); err != nil {
			return models.Task{}, fmt.Errorf("set assignee: %w", err)
		}
	}
	if input.LabelIDs != nil {
		if err := s.setLabels(ctx, token, id, *input.LabelIDs); err != nil {
			return models.Task{}, fmt.Errorf("set labels: %w", err)
		}
	}

	// Fetch updated state so we can compare assignee/label names in logs.
	updated, err := s.fetchOne(ctx, token, id)
	if err != nil {
		return models.Task{}, err
	}

	// Activity logs — all non-fatal.

	// Status change.
	if input.Status != nil && *input.Status != current.Status {
		_ = s.createActivityLog(ctx, token, id, userID, models.ActivityActionStatusChanged, map[string]string{
			"from": string(current.Status),
			"to":   string(*input.Status),
		})
	}

	// Priority change.
	if input.Priority != nil && *input.Priority != current.Priority {
		_ = s.createActivityLog(ctx, token, id, userID, models.ActivityActionPriorityChanged, map[string]string{
			"from": string(current.Priority),
			"to":   string(*input.Priority),
		})
	}

	// Title or description change — logged as a single "updated" event.
	titleChanged := input.Title != nil && *input.Title != current.Title
	descChanged := false
	if input.Description != nil {
		oldDesc := ""
		if current.Description != nil {
			oldDesc = *current.Description
		}
		descChanged = *input.Description != oldDesc
	}
	if titleChanged || descChanged {
		_ = s.createActivityLog(ctx, token, id, userID, models.ActivityActionUpdated, map[string]string{})
	}

	// Due date change.
	if input.DueDate != nil {
		oldDate := ""
		if current.DueDate != nil {
			oldDate = *current.DueDate
		}
		newDate := *input.DueDate
		if newDate == "" && oldDate != "" {
			_ = s.createActivityLog(ctx, token, id, userID, models.ActivityActionDueDateCleared, map[string]string{"from": oldDate})
		} else if newDate != "" && newDate != oldDate {
			_ = s.createActivityLog(ctx, token, id, userID, models.ActivityActionDueDateSet, map[string]string{"to": newDate})
		}
	}

	// Assignee change.
	if input.AssigneeID != nil {
		oldHas := current.AssigneeID != nil && *current.AssigneeID != ""
		newEmpty := *input.AssigneeID == ""
		if oldHas && newEmpty {
			name := ""
			if current.Assignee != nil {
				name = current.Assignee.Name
			}
			_ = s.createActivityLog(ctx, token, id, userID, models.ActivityActionUnassigned, map[string]string{"to": name})
		} else if !newEmpty && (!oldHas || *current.AssigneeID != *input.AssigneeID) {
			name := ""
			if updated.Assignee != nil {
				name = updated.Assignee.Name
			}
			_ = s.createActivityLog(ctx, token, id, userID, models.ActivityActionAssigned, map[string]string{"to": name})
		}
	}

	// Label changes.
	if input.LabelIDs != nil {
		oldLabels := map[string]string{}
		for _, l := range current.Labels {
			oldLabels[l.ID] = l.Name
		}
		newLabels := map[string]string{}
		for _, l := range updated.Labels {
			newLabels[l.ID] = l.Name
		}
		for lid, name := range newLabels {
			if _, exists := oldLabels[lid]; !exists {
				_ = s.createActivityLog(ctx, token, id, userID, models.ActivityActionLabelAdded, map[string]string{"to": name})
			}
		}
		for lid, name := range oldLabels {
			if _, exists := newLabels[lid]; !exists {
				_ = s.createActivityLog(ctx, token, id, userID, models.ActivityActionLabelRemoved, map[string]string{"to": name})
			}
		}
	}

	return updated, nil
}

// DeleteTask deletes a task by ID. Cascading deletes in the DB clean up relations.
func (s *TaskService) DeleteTask(ctx context.Context, token, id string) error {
	body, status, err := s.rest.Do(ctx, RequestOptions{
		Method:      "DELETE",
		Path:        "/tasks",
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

// ReorderTasks applies bulk position/status updates after a drag-and-drop.
// userID is used to attribute status-change activity log entries.
func (s *TaskService) ReorderTasks(ctx context.Context, userID, token string, updates []models.ReorderItem) error {
	for _, update := range updates {
		body, status, err := s.rest.Do(ctx, RequestOptions{
			Method: "PATCH",
			Path:   "/tasks",
			Token:  token,
			Body: map[string]interface{}{
				"status":   string(update.Status),
				"position": update.Position,
			},
			QueryParams: map[string]string{"id": "eq." + update.ID},
		})
		if err != nil {
			return err
		}
		if status != 200 && status != 204 {
			return parsePostgRESTError(body, status)
		}

		// Log status change when the column changed.
		if update.OldStatus != "" && update.OldStatus != update.Status {
			_ = s.createActivityLog(ctx, token, update.ID, userID, models.ActivityActionStatusChanged, map[string]string{
				"from": string(update.OldStatus),
				"to":   string(update.Status),
			})
		}
	}
	return nil
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

// fetchOne retrieves a single task with embedded relations.
func (s *TaskService) fetchOne(ctx context.Context, token, id string) (models.Task, error) {
	body, status, err := s.rest.Do(ctx, RequestOptions{
		Method: "GET",
		Path:   "/tasks",
		Token:  token,
		QueryParams: map[string]string{
			"select": taskSelectParam,
			"id":     "eq." + id,
			"limit":  "1",
		},
	})
	if err != nil {
		return models.Task{}, err
	}
	if status != 200 {
		return models.Task{}, parsePostgRESTError(body, status)
	}
	var rows []pgTask
	if err := json.Unmarshal(body, &rows); err != nil {
		return models.Task{}, fmt.Errorf("decode task: %w", err)
	}
	if len(rows) == 0 {
		return models.Task{}, ErrNotFound
	}
	return rows[0].toTask(), nil
}

// nextPosition returns max(position)+1 for the given status column, or 0 if empty.
func (s *TaskService) nextPosition(ctx context.Context, token, status string) (int, error) {
	body, statusCode, err := s.rest.Do(ctx, RequestOptions{
		Method: "GET",
		Path:   "/tasks",
		Token:  token,
		QueryParams: map[string]string{
			"select": "position",
			"status": "eq." + status,
			"order":  "position.desc",
			"limit":  "1",
		},
	})
	if err != nil {
		return 0, err
	}
	if statusCode != 200 {
		return 0, parsePostgRESTError(body, statusCode)
	}
	var rows []struct {
		Position int `json:"position"`
	}
	if err := json.Unmarshal(body, &rows); err != nil || len(rows) == 0 {
		return 0, nil
	}
	return rows[0].Position + 1, nil
}

// setAssignee replaces the task's current assignee (or clears it if assigneeID is nil/"").
func (s *TaskService) setAssignee(ctx context.Context, token, taskID string, assigneeID *string) error {
	// Delete existing assignee(s).
	_, _, err := s.rest.Do(ctx, RequestOptions{
		Method:      "DELETE",
		Path:        "/task_assignees",
		Token:       token,
		QueryParams: map[string]string{"task_id": "eq." + taskID},
	})
	if err != nil {
		return err
	}
	if assigneeID == nil || *assigneeID == "" {
		return nil
	}
	_, status, err := s.rest.Do(ctx, RequestOptions{
		Method: "POST",
		Path:   "/task_assignees",
		Token:  token,
		Body:   map[string]string{"task_id": taskID, "member_id": *assigneeID},
	})
	if err != nil {
		return err
	}
	if status != 201 && status != 200 {
		return fmt.Errorf("insert assignee: unexpected status %d", status)
	}
	return nil
}

// setLabels replaces all task label associations.
func (s *TaskService) setLabels(ctx context.Context, token, taskID string, labelIDs []string) error {
	// Delete existing labels.
	_, _, err := s.rest.Do(ctx, RequestOptions{
		Method:      "DELETE",
		Path:        "/task_labels",
		Token:       token,
		QueryParams: map[string]string{"task_id": "eq." + taskID},
	})
	if err != nil {
		return err
	}
	for _, labelID := range labelIDs {
		_, status, err := s.rest.Do(ctx, RequestOptions{
			Method: "POST",
			Path:   "/task_labels",
			Token:  token,
			Body:   map[string]string{"task_id": taskID, "label_id": labelID},
		})
		if err != nil {
			return err
		}
		if status != 201 && status != 200 {
			return fmt.Errorf("insert label: unexpected status %d", status)
		}
	}
	return nil
}

// createActivityLog inserts a row into activity_logs.
func (s *TaskService) createActivityLog(ctx context.Context, token, taskID, userID string, action models.ActivityAction, details interface{}) error {
	_, statusCode, err := s.rest.Do(ctx, RequestOptions{
		Method: "POST",
		Path:   "/activity_logs",
		Token:  token,
		Body: map[string]interface{}{
			"task_id": taskID,
			"user_id": userID,
			"action":  string(action),
			"details": details, // passed as Go value so json.Marshal serializes it as a JSON object
		},
	})
	if err != nil {
		return err
	}
	if statusCode != 201 && statusCode != 200 {
		return fmt.Errorf("insert activity log: unexpected status %d", statusCode)
	}
	return nil
}
