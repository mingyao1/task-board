# API Specification — Go Backend

## Overview

A lightweight Go REST API that sits between the React frontend and Supabase. Handles business logic, validation, and activity logging. Uses the Supabase Go client to interact with the database.

**Base URL:** `http://localhost:8080/api/v1`

**Auth:** Every request must include the Supabase JWT in the `Authorization: Bearer <token>` header. The Go backend validates the JWT and extracts `user_id` for RLS-compliant queries.

---

## Tech Stack

| Component | Choice |
|-----------|--------|
| Framework | [Chi](https://github.com/go-chi/chi) or [Gin](https://github.com/gin-gonic/gin) |
| Supabase client | [supabase-go](https://github.com/supabase-community/supabase-go) or raw `net/http` + REST API |
| Auth validation | Decode Supabase JWT (HS256 with JWT secret) |
| Environment | `.env` file with `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_JWT_SECRET` |
| CORS | Allow frontend origin |

---

## Middleware

### Auth Middleware

Applied to all `/api/v1/*` routes.

1. Extract `Authorization: Bearer <token>` from request header
2. Validate JWT signature using `SUPABASE_JWT_SECRET`
3. Extract `sub` claim as `user_id`
4. Inject `user_id` into request context
5. Forward the original JWT to Supabase calls so RLS applies

---

## Endpoints

### Tasks

#### `GET /api/v1/tasks`

Fetch all tasks for the authenticated user.

**Query params (optional):**
- `status` — filter by status (`todo`, `in_progress`, `in_review`, `done`)
- `priority` — filter by priority (`low`, `normal`, `high`)
- `assignee_id` — filter by assignee UUID
- `label_id` — filter by label UUID
- `search` — search title (case-insensitive `ILIKE`)

**Response:** `200 OK`
```json
{
  "tasks": [
    {
      "id": "uuid",
      "title": "Implement drag-and-drop",
      "description": "Use dnd-kit library",
      "status": "in_progress",
      "priority": "high",
      "due_date": "2025-04-01",
      "position": 1,
      "user_id": "uuid",
      "created_at": "2025-03-14T00:00:00Z",
      "assignees": [
        { "id": "uuid", "name": "Alice", "color": "#4F46E5" }
      ],
      "labels": [
        { "id": "uuid", "name": "Feature", "color": "#10B981" }
      ]
    }
  ]
}
```

#### `POST /api/v1/tasks`

Create a new task.

**Request body:**
```json
{
  "title": "New task",
  "description": "Optional description",
  "status": "todo",
  "priority": "normal",
  "due_date": "2025-04-01",
  "assignee_ids": ["uuid"],
  "label_ids": ["uuid"]
}
```

**Validation:**
- `title` is required, max 500 chars
- `status` must be one of: `todo`, `in_progress`, `in_review`, `done` (default: `todo`)
- `priority` must be one of: `low`, `normal`, `high` (default: `normal`)
- `due_date` must be a valid date string or null
- `position` auto-calculated as max position in target column + 1

**Response:** `201 Created` — returns the created task object

**Side effect:** Creates an activity log entry with action `created`

#### `PATCH /api/v1/tasks/:id`

Update a task. Accepts partial updates.

**Request body (all fields optional):**
```json
{
  "title": "Updated title",
  "description": "Updated description",
  "status": "in_review",
  "priority": "high",
  "due_date": "2025-04-15",
  "position": 2,
  "assignee_ids": ["uuid"],
  "label_ids": ["uuid"]
}
```

**Response:** `200 OK` — returns the updated task object

**Side effects:**
- If `status` changed → activity log entry `status_change` with `{"from": "old", "to": "new"}`
- If `priority` changed → activity log entry `priority_change`
- If `assignee_ids` changed → activity log entry `assign` with `{"added": [...], "removed": [...]}`

#### `DELETE /api/v1/tasks/:id`

Delete a task. Cascades to comments, activity logs, task_assignees, task_labels.

**Response:** `204 No Content`

#### `PATCH /api/v1/tasks/reorder`

Bulk reorder tasks within or across columns after drag-and-drop.

**Request body:**
```json
{
  "updates": [
    { "id": "uuid", "status": "in_progress", "position": 0 },
    { "id": "uuid", "status": "in_progress", "position": 1 },
    { "id": "uuid", "status": "todo", "position": 0 }
  ]
}
```

**Response:** `200 OK`

---

### Team Members

#### `GET /api/v1/team-members`

Fetch all team members for the authenticated user.

**Response:** `200 OK`
```json
{
  "members": [
    { "id": "uuid", "name": "Alice", "color": "#4F46E5", "avatar_url": null, "created_at": "..." }
  ]
}
```

#### `POST /api/v1/team-members`

Create a team member.

**Request body:**
```json
{
  "name": "Alice",
  "color": "#4F46E5"
}
```

**Validation:** `name` is required, max 100 chars. `color` must be valid hex.

**Response:** `201 Created`

#### `PATCH /api/v1/team-members/:id`

Update a team member.

#### `DELETE /api/v1/team-members/:id`

Delete a team member. Removes from all task assignments.

---

### Labels

#### `GET /api/v1/labels`

Fetch all labels for the authenticated user.

#### `POST /api/v1/labels`

Create a label.

**Request body:**
```json
{
  "name": "Bug",
  "color": "#EF4444"
}
```

#### `PATCH /api/v1/labels/:id`

Update a label.

#### `DELETE /api/v1/labels/:id`

Delete a label. Removes from all task associations.

---

### Comments

#### `GET /api/v1/tasks/:taskId/comments`

Fetch all comments for a task, ordered chronologically.

**Response:** `200 OK`
```json
{
  "comments": [
    { "id": "uuid", "content": "Looks good!", "created_at": "...", "user_id": "uuid" }
  ]
}
```

#### `POST /api/v1/tasks/:taskId/comments`

Add a comment to a task.

**Request body:**
```json
{
  "content": "This needs review"
}
```

**Side effect:** Creates activity log entry with action `comment`

#### `DELETE /api/v1/tasks/:taskId/comments/:id`

Delete a comment.

---

### Activity Log

#### `GET /api/v1/tasks/:taskId/activity`

Fetch activity log for a task, ordered by most recent first.

**Response:** `200 OK`
```json
{
  "activities": [
    {
      "id": "uuid",
      "action": "status_change",
      "details": { "from": "todo", "to": "in_progress" },
      "created_at": "2025-03-14T12:00:00Z"
    }
  ]
}
```

---

### Board Stats

#### `GET /api/v1/stats`

Fetch summary stats for the authenticated user's board.

**Response:** `200 OK`
```json
{
  "total_tasks": 24,
  "by_status": {
    "todo": 8,
    "in_progress": 6,
    "in_review": 4,
    "done": 6
  },
  "overdue": 3,
  "due_today": 2,
  "completed_this_week": 4
}
```

---

## Error Responses

All errors follow a consistent format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Title is required"
  }
}
```

| Status | Code | When |
|--------|------|------|
| 400 | `VALIDATION_ERROR` | Invalid input |
| 401 | `UNAUTHORIZED` | Missing or invalid JWT |
| 403 | `FORBIDDEN` | User doesn't own the resource |
| 404 | `NOT_FOUND` | Resource doesn't exist |
| 500 | `INTERNAL_ERROR` | Unexpected server error |

---

## Go Project Structure

```
backend/
├── cmd/
│   └── server/
│       └── main.go              # Entry point, server setup
├── internal/
│   ├── config/
│   │   └── config.go            # Env loading
│   ├── middleware/
│   │   ├── auth.go              # JWT validation
│   │   └── cors.go              # CORS config
│   ├── handlers/
│   │   ├── tasks.go
│   │   ├── team_members.go
│   │   ├── labels.go
│   │   ├── comments.go
│   │   ├── activity.go
│   │   └── stats.go
│   ├── models/
│   │   ├── task.go
│   │   ├── team_member.go
│   │   ├── label.go
│   │   ├── comment.go
│   │   └── activity.go
│   ├── services/
│   │   ├── task_service.go      # Business logic + activity logging
│   │   ├── team_service.go
│   │   ├── label_service.go
│   │   └── comment_service.go
│   └── database/
│       └── supabase.go          # Supabase client wrapper
├── go.mod
├── go.sum
└── .env.example
```

---

## Environment Variables

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_JWT_SECRET=your-jwt-secret

# Server
PORT=8080
FRONTEND_URL=http://localhost:5173
```
