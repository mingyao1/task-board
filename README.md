# Task Board

A Kanban-style task management app built with React, Go, and Supabase. Drag tasks across columns, track progress, manage team members and labels, and view a live activity feed — all behind anonymous auth with per-user data isolation.

**Live demo:** [task-board-two-sigma.vercel.app](https://task-board-two-sigma.vercel.app/)

---

## Features

- **Kanban board** — four columns (To Do, In Progress, In Review, Done) with drag-and-drop reordering within and across columns
- **Task detail panel** — slide-over panel with full edit form, comments, and activity timeline
- **Team members** — create members with a name and color, assign them to tasks, see avatar badges on cards
- **Labels** — create custom labels, assign multiple per task, filter the board by label
- **Activity log** — every status change, edit, assignment, and comment is tracked and shown in a timeline per task
- **Due date indicators** — color-coded urgency badges on cards (overdue, due today, due within 3 days)
- **Search & filters** — search by title/description, filter by status, priority, assignee, and label
- **Board stats** — live sidebar widget showing totals, overdue count, and a completion progress bar
- **Dark / light theme** — toggle in the header, persisted to localStorage
- **Collapsible + resizable sidebar** — drag to resize or collapse entirely

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS + CSS custom properties |
| Drag and drop | @dnd-kit/core + @dnd-kit/sortable |
| Backend | Go 1.22 + chi router |
| Database | Supabase (PostgreSQL + RLS) |
| Auth | Supabase anonymous auth |
| Hosting | Vercel (frontend) |

---

## Project Structure

```
task-board/
├── frontend/          # React + TypeScript app
│   └── src/
│       ├── api/       # Supabase / HTTP client functions
│       ├── components/
│       ├── context/   # Shared state (team members, labels, stats)
│       ├── hooks/
│       └── types/
├── backend/           # Go API server
│   └── internal/
│       ├── handlers/
│       ├── services/
│       └── models/
└── docs/
    ├── API.md         # Go backend API reference
    └── DATABASE.md    # Full SQL schema + RLS policies
```

---

## Local Setup

### Prerequisites

- Node 18+
- Go 1.22+
- A [Supabase](https://supabase.com) project with **Anonymous Sign-Ins** enabled (Authentication → Providers)

### 1. Database

Run the SQL in `docs/DATABASE.md` in the Supabase SQL Editor. This creates all tables, indexes, RLS policies, and the `updated_at` trigger.

### 2. Backend

```bash
cd backend
cp .env.example .env
# Edit .env — set SUPABASE_URL and SUPABASE_SERVICE_KEY
go run cmd/server/main.go
# API available at http://localhost:8080
```

### 3. Frontend

```bash
cd frontend
cp .env.example .env
# Edit .env — set VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY, VITE_API_BASE_URL
npm install
npm run dev
# App available at http://localhost:5173
```

---

## Deployment (Vercel, no backend)

The `prod` branch ships a version of the frontend that calls Supabase directly — no Go server needed. To deploy:

1. Connect the `prod` branch to a Vercel project
2. Set two environment variables in Vercel:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
3. Deploy — done

---

## Database

Full schema and RLS policies are in [`docs/DATABASE.md`](docs/DATABASE.md).

Tables: `tasks`, `team_members`, `labels`, `task_assignees`, `task_labels`, `comments`, `activity_logs`

All tables have RLS enabled. Users can only read and write their own data. Anonymous auth means every new browser session gets its own isolated workspace automatically.

---

## API

The Go backend API is documented in [`docs/API.md`](docs/API.md).
