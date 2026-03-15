# Task Board Assessment - Requirements

## Overview

Build a polished, fully-featured Kanban-style task board where users can create tasks, drag them across board sections, and manage work visually. Inspired by Asana, Linear, and Notion.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + TypeScript |
| Backend API | Go (Gin or Chi router) |
| Database | Supabase (PostgreSQL + Auth) |
| Hosting | Vercel (frontend) |
| Version Control | GitHub |

---

## Core Requirements (Must Have)

### 1. Kanban Board

- Four default columns: **To Do**, **In Progress**, **In Review**, **Done**
- Drag-and-drop tasks between columns to update status
- Board updates in real time (or on drop)
- Responsive/mobile-friendly layout

### 2. Task Management

- Create a new task with title (required)
- Optional fields: description, priority, due date
- View all tasks organized by column/status
- Edit and delete tasks

### 3. Guest Accounts (Supabase Auth)

- Anonymous sign-in via Supabase Auth (no email/password)
- Guest session created automatically on first app launch
- Each task stored with `user_id` tied to guest user
- Row Level Security (RLS) enforced: users only see their own data

### 4. Database Schema (Supabase)

#### `tasks` table (required fields)

| Field | Type | Notes |
|-------|------|-------|
| id | uuid | primary key, default `gen_random_uuid()` |
| title | text | required, not null |
| status | text | enum: `todo`, `in_progress`, `in_review`, `done` |
| user_id | uuid | references `auth.users(id)` |
| created_at | timestamptz | default `now()` |

#### `tasks` table (bonus fields)

| Field | Type | Notes |
|-------|------|-------|
| description | text | nullable |
| priority | text | enum: `low`, `normal`, `high` |
| due_date | date | nullable |
| assignee_id | uuid | references `team_members(id)`, nullable |
| position | integer | for ordering within a column |

### 5. UI/UX Quality (Heavily Evaluated)

- Cohesive color palette and typography system
- Clear visual hierarchy between columns and task cards
- Smooth drag-and-drop interactions
- Thoughtful empty states, loading states, and error handling
- Mobile-friendly / responsive layout

### 6. Security

- RLS enabled on all tables
- Only public anon key used in frontend (never service role key)
- No secrets committed to GitHub
- Environment variables for all keys

---

## Advanced Features (Strongly Recommended)

### 7. Team Members & Assignees

- Create a small "team" by adding members (name + optional avatar/color)
- Show team members in board UI
- Assign one or more team members to a task
- Display assignee avatars on task cards

**Database: `team_members` table**

| Field | Type | Notes |
|-------|------|-------|
| id | uuid | primary key |
| user_id | uuid | references `auth.users(id)` |
| name | text | required |
| color | text | hex color for avatar |
| avatar_url | text | nullable |
| created_at | timestamptz | default `now()` |

**Database: `task_assignees` join table**

| Field | Type | Notes |
|-------|------|-------|
| task_id | uuid | references `tasks(id)` on delete cascade |
| member_id | uuid | references `team_members(id)` on delete cascade |
| primary key | composite | (task_id, member_id) |

### 8. Task Comments

- Open a task detail panel and write comments
- Comments displayed in chronological order with timestamp
- Stored in a separate `comments` table

**Database: `comments` table**

| Field | Type | Notes |
|-------|------|-------|
| id | uuid | primary key |
| task_id | uuid | references `tasks(id)` on delete cascade |
| user_id | uuid | references `auth.users(id)` |
| content | text | required |
| created_at | timestamptz | default `now()` |

### 9. Task Activity Log

- Track history of changes (status changes, edits, assignments)
- Show timeline of activity inside task detail view
- Example: "Moved from To Do → In Progress · 2 hours ago"

**Database: `activity_logs` table**

| Field | Type | Notes |
|-------|------|-------|
| id | uuid | primary key |
| task_id | uuid | references `tasks(id)` on delete cascade |
| user_id | uuid | references `auth.users(id)` |
| action | text | e.g., `status_change`, `edit`, `assign`, `comment` |
| details | jsonb | e.g., `{"from": "todo", "to": "in_progress"}` |
| created_at | timestamptz | default `now()` |

### 10. Labels / Tags

- Create custom labels (e.g., "Bug", "Feature", "Design")
- Assign multiple labels to a task
- Filter the board by label

**Database: `labels` table**

| Field | Type | Notes |
|-------|------|-------|
| id | uuid | primary key |
| user_id | uuid | references `auth.users(id)` |
| name | text | required |
| color | text | hex color |
| created_at | timestamptz | default `now()` |

**Database: `task_labels` join table**

| Field | Type | Notes |
|-------|------|-------|
| task_id | uuid | references `tasks(id)` on delete cascade |
| label_id | uuid | references `labels(id)` on delete cascade |
| primary key | composite | (task_id, label_id) |

### 11. Due Date Indicators

- Highlight tasks due soon or overdue on the card
- Visual indicator (colored badge, icon) based on urgency
- Logic: overdue (red), due today (orange), due within 3 days (yellow)

### 12. Search & Filtering

- Search bar to filter tasks by title
- Filters for priority, assignee, and/or label

### 13. Board Summary / Stats

- Show total tasks, tasks completed, tasks overdue
- Display in sidebar or header area

---

## Hosting & Deployment

- Frontend hosted on **Vercel** (free tier)
- Live URL included in final deliverable
- GitHub repo: public or shared private link

## Final Deliverable

Submit a PDF or DOCX named `firstname_lastname_task_manager_assessment.pdf` containing:

1. Short overview of solution and design decisions
2. Link to live frontend app
3. Link to GitHub repository
4. Full database schema (SQL or description)
5. Local setup instructions
6. Which advanced features were built and how they work
7. Tradeoffs and what you'd improve with more time

## Evaluation Criteria

1. **Design quality** — polished, intentional look and feel
2. **Board functionality** — drag-and-drop, columns, task management
3. **Frontend usability** — state handling, UX
4. **Database schema** — persistence, structure
5. **Security** — RLS, no exposed keys
6. **Advanced features** — optional but differentiating
7. **Code quality** — structure, readability
8. **Live app** — working deployment
9. **Final document** — clarity, completeness
