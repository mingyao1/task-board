# CLAUDE.md — AI Agent Instructions

## Project Overview

This is a Kanban-style task board web application for an assessment challenge. The goal is a polished, production-quality app inspired by Asana, Linear, and Notion.

**Read these files before starting any work:**
- `docs/REQUIREMENTS.md` — Full requirements and evaluation criteria
- `docs/API.md` — Go backend API specification
- `docs/DATABASE.md` — Complete SQL schema and RLS policies
- `docs/FRONTEND.md` — Frontend architecture, components, and design system

---

## Tech Stack

| Layer | Technology | Key Libraries |
|-------|-----------|---------------|
| Frontend | React 18 + TypeScript + Vite | @dnd-kit/core, @dnd-kit/sortable, @supabase/supabase-js, tailwindcss, lucide-react, date-fns |
| Backend | Go 1.22+ | chi (router), supabase-go or net/http, golang-jwt |
| Database | Supabase (PostgreSQL) | RLS, anonymous auth |
| Hosting | Vercel (frontend) | — |

---

## Project Structure

```
task-board/
├── CLAUDE.md                    # This file — agent instructions
├── README.md                    # Project readme with setup instructions
├── docs/
│   ├── REQUIREMENTS.md          # Assessment requirements
│   ├── API.md                   # Go API specification
│   ├── DATABASE.md              # SQL schema
│   └── FRONTEND.md              # Frontend architecture
├── frontend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   ├── index.html
│   ├── .env.example
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── api/                 # API client functions
│       │   ├── client.ts        # Axios/fetch wrapper with auth headers
│       │   ├── tasks.ts
│       │   ├── teamMembers.ts
│       │   ├── labels.ts
│       │   ├── comments.ts
│       │   └── stats.ts
│       ├── components/
│       │   ├── layout/
│       │   │   ├── AppShell.tsx      # Main layout (sidebar + board)
│       │   │   ├── Sidebar.tsx       # Navigation, stats, team members
│       │   │   └── Header.tsx        # Search bar, filters, board title
│       │   ├── board/
│       │   │   ├── Board.tsx         # Main board container with DnD context
│       │   │   ├── Column.tsx        # Single column (droppable)
│       │   │   ├── TaskCard.tsx      # Draggable task card
│       │   │   └── NewTaskButton.tsx # Inline task creation
│       │   ├── task/
│       │   │   ├── TaskDetailPanel.tsx    # Slide-over detail panel
│       │   │   ├── TaskForm.tsx           # Create/edit form
│       │   │   ├── TaskComments.tsx       # Comments section
│       │   │   └── TaskActivityLog.tsx    # Activity timeline
│       │   ├── team/
│       │   │   ├── TeamMemberList.tsx
│       │   │   ├── TeamMemberForm.tsx
│       │   │   └── AvatarBadge.tsx       # Colored initial avatar
│       │   ├── labels/
│       │   │   ├── LabelBadge.tsx
│       │   │   ├── LabelPicker.tsx
│       │   │   └── LabelManager.tsx
│       │   ├── filters/
│       │   │   ├── SearchBar.tsx
│       │   │   ├── FilterBar.tsx
│       │   │   └── FilterChip.tsx
│       │   └── ui/               # Shared UI primitives
│       │       ├── Button.tsx
│       │       ├── Input.tsx
│       │       ├── Modal.tsx
│       │       ├── Dropdown.tsx
│       │       ├── Skeleton.tsx       # Loading skeletons
│       │       ├── EmptyState.tsx
│       │       └── Toast.tsx          # Error/success notifications
│       ├── hooks/
│       │   ├── useAuth.ts            # Supabase anonymous auth
│       │   ├── useTasks.ts           # Task CRUD + optimistic updates
│       │   ├── useTeamMembers.ts
│       │   ├── useLabels.ts
│       │   └── useBoardStats.ts
│       ├── context/
│       │   └── AuthContext.tsx        # Auth provider
│       ├── types/
│       │   └── index.ts              # TypeScript interfaces
│       ├── lib/
│       │   ├── supabase.ts           # Supabase client init
│       │   └── utils.ts              # Helpers (date formatting, etc.)
│       └── styles/
│           └── globals.css           # Tailwind base + custom properties
└── backend/
    ├── go.mod
    ├── go.sum
    ├── .env.example
    ├── cmd/
    │   └── server/
    │       └── main.go
    └── internal/
        ├── config/
        ├── middleware/
        ├── handlers/
        ├── models/
        ├── services/
        └── database/
```

---

## Coding Standards

### General
- Use clear, descriptive variable and function names
- Keep files focused — one component or handler per file
- No `any` types in TypeScript; define proper interfaces
- Handle all error states explicitly
- Write comments only for non-obvious logic

### TypeScript / React
- Functional components only, no class components
- Use hooks for state management (no Redux needed for this scope)
- Prefer `const` over `let`; never use `var`
- Use named exports for components, default exports for pages
- Tailwind for all styling — no CSS modules or styled-components
- Use `date-fns` for date formatting, not raw Date methods

### Go
- Follow standard Go project layout
- Use `context.Context` for request-scoped values (user_id)
- Return structured errors, not raw strings
- Validate all input at the handler level
- Keep handlers thin — business logic goes in services
- Use environment variables, never hardcode secrets

---

## Design System

**The assessment heavily evaluates design quality. Follow these guidelines:**

### Color Palette (use CSS custom properties via Tailwind)
- **Background:** `#0F0F10` (near-black), `#18181B` (cards/surfaces)
- **Borders:** `#27272A` (subtle), `#3F3F46` (hover)
- **Text:** `#FAFAFA` (primary), `#A1A1AA` (secondary), `#71717A` (muted)
- **Accent:** `#6366F1` (indigo-500 for primary actions)
- **Status colors:**
  - To Do: `#A1A1AA` (zinc)
  - In Progress: `#3B82F6` (blue)
  - In Review: `#F59E0B` (amber)
  - Done: `#10B981` (emerald)
- **Priority colors:**
  - High: `#EF4444` (red)
  - Normal: `#F59E0B` (amber)
  - Low: `#6B7280` (gray)
- **Due date urgency:**
  - Overdue: `#EF4444` bg-opacity-10 with red text
  - Due today: `#F59E0B` bg-opacity-10 with amber text
  - Due within 3 days: `#3B82F6` bg-opacity-10 with blue text

### Typography
- Font: Inter (via Google Fonts)
- Board title: 20px semibold
- Column headers: 13px semibold uppercase tracking-wide
- Card title: 14px medium
- Card meta: 12px regular, muted color
- Buttons: 13px medium

### Component Guidelines
- Cards: rounded-lg, subtle border, hover elevation
- Columns: min-width 280px, scrollable, subtle header divider
- Buttons: rounded-md, clear active/hover states
- Inputs: dark background, subtle ring on focus
- Modals/Panels: slide-over from right, backdrop blur
- Empty states: centered icon + message + CTA button
- Loading: skeleton shimmer matching card dimensions
- Transitions: 150ms ease for hover, 200ms for panels

---

## Key Implementation Notes

### Drag and Drop
- Use `@dnd-kit/core` + `@dnd-kit/sortable` (NOT react-beautiful-dnd, which is deprecated)
- Support both reordering within a column and moving across columns
- On drop: optimistically update UI, then PATCH `/api/v1/tasks/reorder`
- Show a translucent drag overlay matching the card appearance

### Anonymous Auth Flow
1. On app load, check for existing Supabase session in localStorage
2. If no session, call `supabase.auth.signInAnonymously()`
3. Store session — Supabase client handles refresh automatically
4. Pass access token to Go backend in `Authorization` header for all API calls

### Optimistic Updates
- When dragging a task, update local state immediately
- Send API request in background
- On failure, revert to previous state and show error toast

### Activity Logging
- The Go backend handles all activity log creation as a side effect of task mutations
- Frontend just fetches and displays the log in the task detail panel
- Never create activity logs from the frontend

---

## Development Workflow

### Local Setup
1. Clone repo
2. Copy `.env.example` to `.env` in both `frontend/` and `backend/`
3. Set up Supabase project and run SQL from `docs/DATABASE.md`
4. Start backend: `cd backend && go run cmd/server/main.go`
5. Start frontend: `cd frontend && npm install && npm run dev`

### Order of Implementation
1. **Supabase setup** — Create project, run schema SQL, enable anonymous auth
2. **Go backend skeleton** — Router, middleware, health check endpoint
3. **Frontend skeleton** — Vite + React + Tailwind, auth flow, basic layout
4. **Tasks CRUD** — Backend handlers + frontend task creation/display
5. **Kanban board** — Column layout + drag-and-drop with dnd-kit
6. **Task detail panel** — Slide-over with edit form
7. **Team members** — CRUD + assignee picker on tasks
8. **Labels** — CRUD + label picker + filter
9. **Comments** — In task detail panel
10. **Activity log** — In task detail panel
11. **Search & filters** — Header search bar + filter dropdowns
12. **Board stats** — Sidebar summary widget
13. **Due date indicators** — Badge logic on task cards
14. **Polish** — Empty states, loading skeletons, error handling, responsive
15. **Deploy** — Vercel for frontend, document setup

---

## Common Pitfalls to Avoid

- **Don't skip RLS.** Every table must have policies. Test by trying to access another user's data.
- **Don't use `service_role` key in frontend.** Only the `anon` key should ever be in frontend env.
- **Don't use react-beautiful-dnd.** It's unmaintained. Use @dnd-kit.
- **Don't ignore empty states.** A board with zero tasks should look intentional, not broken.
- **Don't forget position ordering.** Tasks within a column need a `position` field for consistent ordering after drag-and-drop.
- **Don't over-engineer.** No Redux, no GraphQL, no microservices. Keep it simple and polished.
- **Don't hardcode colors.** Use Tailwind classes or CSS variables for the design system.
- **Don't commit `.env` files.** Use `.env.example` with placeholder values.
