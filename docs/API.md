# API Reference — Go Backend

## Overview

A Go REST API (chi router) that sits between the React frontend and Supabase. It handles input validation, join resolution (assignees, labels), and writes activity logs as side effects of task mutations.

**Base URL:** `http://localhost:8080/api/v1`

**Auth:** Every request requires a Supabase JWT in the `Authorization: Bearer <token>` header. The backend validates it via the Supabase JWKS endpoint (asymmetric ES256 — not a shared secret) and injects `user_id` into the request context for RLS-compliant queries.

> **Vercel / frontend-only mode:** The `prod` branch bypasses this API entirely and calls Supabase directly from the browser. See the README for details.

---

## Endpoints

### Tasks

#### `GET /api/v1/tasks`

Returns all tasks for the authenticated user, with embedded assignee and labels.

**Query params (all optional):**

| Param | Type | Description |
|-------|------|-------------|
| `status` | string | Filter by status: `todo`, `in_progress`, `in_review`, `done` |
| `priority` | string | Filter by priority: `low`, `normal`, `high` |
| `assignee_id` | uuid | Filter by assignee |
| `label_id` | uuid | Filter by label |
| `search` | string | Case-insensitive search on title and description |

**Response `200`:**
```json
{
  "tasks": [
    {
      "id": "uuid",
      "title": "Implement drag-and-drop",
      "description": "Use dnd-kit",
      "status": "in_progress",
      "priority": "high",
      "due_date": "2025-04-01",
      "position": 1,
      "user_id": "uuid",
      "created_at": "2025-03-14T00:00:00Z",
      "updated_at": "2025-03-14T00:00:00Z",
      "assignee_id": "uuid",
      "assignee": { "id": "uuid", "name": "Alice", "color": "#4F46E5", "created_at": "..." },
      "label_ids": ["uuid"],
      "labels": [{ "id": "uuid", "name": "Feature", "color": "#10B981", "created_at": "..." }]
    }
  ]
}
```

#### `POST /api/v1/tasks`

Create a new task. Position is auto-calculated as max position in the target status column + 1.

**Request body:**
```json
{
  "title": "New task",
  "description": "Optional",
  "status": "todo",
  "priority": "normal",
  "due_date": "2025-04-01",
  "assignee_id": "uuid",
  "label_ids": ["uuid"]
}
```

- `title` required
- `status` defaults to `todo`
- `priority` defaults to `normal`

**Response `201`:** `{ "task": { ... } }`

**Side effect:** Writes `created` activity log entry.

#### `PATCH /api/v1/tasks/:id`

Partial update. Only include fields you want to change.

**Request body:**
```json
{
  "title": "Updated title",
  "description": "Updated description",
  "status": "in_review",
  "priority": "high",
  "due_date": "2025-04-15",
  "assignee_id": "uuid",
  "label_ids": ["uuid"]
}
```

**Response `200`:** `{ "task": { ... } }`

**Side effects:** Generates granular activity log entries for each changed field — `status_changed`, `priority_changed`, `updated` (title/description), `due_date_set`, `due_date_cleared`, `assigned`, `unassigned`, `label_added`, `label_removed`.

#### `DELETE /api/v1/tasks/:id`

Delete a task. Cascades to comments, activity logs, task_assignees, task_labels.

**Response `204 No Content`**

#### `PATCH /api/v1/tasks/reorder`

Bulk update task positions after drag-and-drop. Logs a `status_changed` entry for any task whose status changes.

**Request body:**
```json
{
  "updates": [
    { "id": "uuid", "status": "in_progress", "position": 0, "old_status": "todo" },
    { "id": "uuid", "status": "in_progress", "position": 1 }
  ]
}
```

**Response `200`:** `{}`

---

### Team Members

#### `GET /api/v1/team-members`

**Response `200`:**
```json
{
  "team_members": [
    { "id": "uuid", "name": "Alice", "color": "#4F46E5", "user_id": "uuid", "created_at": "..." }
  ]
}
```

#### `POST /api/v1/team-members`

```json
{ "name": "Alice", "color": "#4F46E5" }
```

**Response `201`:** `{ "team_member": { ... } }`

#### `PATCH /api/v1/team-members/:id`

```json
{ "name": "Alice B.", "color": "#10B981" }
```

**Response `200`:** `{ "team_member": { ... } }`

#### `DELETE /api/v1/team-members/:id`

**Response `204 No Content`**

---

### Labels

#### `GET /api/v1/labels`

**Response `200`:**
```json
{
  "labels": [
    { "id": "uuid", "name": "Bug", "color": "#EF4444", "user_id": "uuid", "created_at": "..." }
  ]
}
```

#### `POST /api/v1/labels`

```json
{ "name": "Bug", "color": "#EF4444" }
```

**Response `201`:** `{ "label": { ... } }`

#### `PATCH /api/v1/labels/:id`

```json
{ "name": "Bug fix", "color": "#F87171" }
```

**Response `200`:** `{ "label": { ... } }`

#### `DELETE /api/v1/labels/:id`

**Response `204 No Content`**

---

### Comments

#### `GET /api/v1/tasks/:taskId/comments`

**Response `200`:**
```json
{
  "comments": [
    { "id": "uuid", "task_id": "uuid", "user_id": "uuid", "content": "Looks good!", "created_at": "..." }
  ]
}
```

#### `POST /api/v1/tasks/:taskId/comments`

```json
{ "content": "This needs review" }
```

**Response `201`:** `{ "comment": { ... } }`

**Side effect:** Writes `comment_added` activity log entry.

#### `DELETE /api/v1/tasks/:taskId/comments/:commentId`

**Response `204 No Content`**

**Side effect:** Writes `comment_deleted` activity log entry.

---

### Activity Log

#### `GET /api/v1/tasks/:taskId/activity`

Returns activity entries most-recent first. The `details` JSONB is flattened into `old_value` / `new_value` fields.

**Response `200`:**
```json
{
  "activity": [
    {
      "id": "uuid",
      "task_id": "uuid",
      "user_id": "uuid",
      "action": "status_changed",
      "old_value": "todo",
      "new_value": "in_progress",
      "created_at": "2025-03-14T12:00:00Z"
    }
  ]
}
```

**Action values:** `created`, `updated`, `status_changed`, `priority_changed`, `assigned`, `unassigned`, `due_date_set`, `due_date_cleared`, `label_added`, `label_removed`, `comment_added`, `comment_deleted`

---

### Stats

#### `GET /api/v1/stats`

**Response `200`:**
```json
{
  "stats": {
    "total": 24,
    "by_status": { "todo": 8, "in_progress": 6, "in_review": 4, "done": 6 },
    "by_priority": { "high": 5, "normal": 14, "low": 5 },
    "overdue": 3,
    "due_today": 2
  }
}
```

---

## Error Format

```json
{ "error": "Title is required" }
```

| Status | When |
|--------|------|
| `400` | Invalid or missing input |
| `401` | Missing or invalid JWT |
| `403` | Resource belongs to another user |
| `404` | Resource not found |
| `500` | Unexpected server error |

---

## Environment Variables

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
PORT=8080
FRONTEND_URL=http://localhost:5173
```
