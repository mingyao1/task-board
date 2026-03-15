# Frontend Architecture — React + TypeScript

## Overview

A single-page Kanban board built with React 18, TypeScript, Vite, and Tailwind CSS. Uses @dnd-kit for drag-and-drop. Communicates with the Go backend API for all data operations.

---

## Dependencies

```json
{
  "dependencies": {
    "react": "^18.3",
    "react-dom": "^18.3",
    "@dnd-kit/core": "^6.1",
    "@dnd-kit/sortable": "^8.0",
    "@dnd-kit/utilities": "^3.2",
    "@supabase/supabase-js": "^2.45",
    "lucide-react": "^0.400",
    "date-fns": "^3.6",
    "clsx": "^2.1",
    "tailwind-merge": "^2.4"
  },
  "devDependencies": {
    "typescript": "^5.5",
    "vite": "^5.4",
    "@vitejs/plugin-react": "^4.3",
    "tailwindcss": "^3.4",
    "autoprefixer": "^10.4",
    "postcss": "^8.4",
    "@types/react": "^18.3",
    "@types/react-dom": "^18.3"
  }
}
```

---

## TypeScript Interfaces

```typescript
// types/index.ts

export type TaskStatus = 'todo' | 'in_progress' | 'in_review' | 'done';
export type TaskPriority = 'low' | 'normal' | 'high';

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  position: number;
  user_id: string;
  created_at: string;
  updated_at: string;
  assignees: TeamMember[];
  labels: Label[];
}

export interface TeamMember {
  id: string;
  name: string;
  color: string;
  avatar_url: string | null;
  created_at: string;
}

export interface Label {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface Comment {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  task_id: string;
  action: string;
  details: Record<string, any>;
  created_at: string;
}

export interface BoardStats {
  total_tasks: number;
  by_status: Record<TaskStatus, number>;
  overdue: number;
  due_today: number;
  completed_this_week: number;
}

export interface Column {
  id: TaskStatus;
  title: string;
  color: string;
  tasks: Task[];
}
```

---

## Component Architecture

### App Shell

```
┌─────────────────────────────────────────────────────┐
│  Sidebar        │  Header (search, filters, stats)  │
│                 │───────────────────────────────────│
│  - Logo         │  Board                            │
│  - Stats        │  ┌──────┬──────┬──────┬──────┐   │
│  - Team Members │  │ To Do│ In   │ In   │ Done │   │
│  - Labels       │  │      │ Prog │Review│      │   │
│  - Filters      │  │ Card │ Card │ Card │ Card │   │
│                 │  │ Card │ Card │      │ Card │   │
│                 │  │ +New │ Card │      │      │   │
│                 │  └──────┴──────┴──────┴──────┘   │
└─────────────────────────────────────────────────────┘
```

### Task Detail Panel (Slide-over)

```
┌───────────────────────────────────────┐
│  ← Back              Edit  |  Delete  │
│───────────────────────────────────────│
│  Task Title (editable)                │
│  Status: [dropdown]  Priority: [badge]│
│  Due: Apr 1, 2025  [overdue badge]    │
│───────────────────────────────────────│
│  Description                          │
│  Lorem ipsum dolor sit amet...        │
│───────────────────────────────────────│
│  Assignees     [+ Add]               │
│  🔵 Alice  🟢 Bob                     │
│───────────────────────────────────────│
│  Labels        [+ Add]               │
│  [Feature] [Design]                   │
│───────────────────────────────────────│
│  Comments                             │
│  ┌─────────────────────────────────┐  │
│  │ "Looks good!" — 2h ago         │  │
│  │ "Needs one more fix" — 1h ago  │  │
│  └─────────────────────────────────┘  │
│  [Write a comment...        ] [Send]  │
│───────────────────────────────────────│
│  Activity                             │
│  • Moved To Do → In Progress · 2h    │
│  • Created · 1d ago                   │
└───────────────────────────────────────┘
```

---

## Task Card Design

Each card should display:

1. **Title** — 14px medium, truncate at 2 lines
2. **Priority indicator** — small colored dot or icon (left edge or top-right)
3. **Labels** — small colored pills below title (max 3 visible, +N overflow)
4. **Due date** — bottom-left, with urgency badge coloring
5. **Assignee avatars** — bottom-right, stacked circles with initials
6. **Description preview** — optional, 1-line muted text if description exists

Card should have:
- `rounded-lg` corners
- Subtle border (`border-zinc-800`)
- Background `bg-zinc-900`
- Hover: slight elevation or border brightening
- Drag state: reduced opacity + shadow

---

## Drag and Drop Implementation

Use `@dnd-kit/core` and `@dnd-kit/sortable`:

```typescript
// Board.tsx - high level structure
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

// Key behaviors:
// 1. Each Column is a droppable container
// 2. Each TaskCard is a sortable item
// 3. DragOverlay renders a ghost card during drag
// 4. On drag end:
//    a. Determine source and destination columns
//    b. Calculate new positions
//    c. Optimistically update local state
//    d. Call PATCH /api/v1/tasks/reorder
//    e. On error: revert state + show toast
```

### Drag event handling:

```typescript
// Pseudocode for onDragEnd
function handleDragEnd(event) {
  const { active, over } = event;
  if (!over) return;

  const activeTask = findTask(active.id);
  const overColumn = findColumn(over.id);

  // Build updates array with new positions
  const updates = recalculatePositions(activeTask, overColumn);

  // Optimistic update
  setTasks(applyUpdates(tasks, updates));

  // API call
  api.reorderTasks(updates).catch(() => {
    setTasks(previousTasks); // revert
    showToast('Failed to update task position', 'error');
  });
}
```

---

## State Management

No global state library needed. Use React hooks and context:

| State | Location | Notes |
|-------|----------|-------|
| Auth session | `AuthContext` | Wraps entire app |
| Tasks list | `useTasks` hook | Fetches on mount, exposes CRUD |
| Team members | `useTeamMembers` hook | Fetches on mount |
| Labels | `useLabels` hook | Fetches on mount |
| Board stats | `useBoardStats` hook | Fetches on mount, refreshes after task mutations |
| Selected task | Local state in `Board.tsx` | Controls task detail panel visibility |
| Filters | Local state in `Header.tsx` | Passed down to Board for filtering |
| Drag state | dnd-kit internal | Managed by DndContext |

---

## API Client

```typescript
// api/client.ts
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const session = await supabase.auth.getSession();
  const token = session.data.session?.access_token;

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Request failed');
  }

  if (response.status === 204) return undefined as T;
  return response.json();
}
```

---

## Environment Variables

```env
# frontend/.env.example
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_API_URL=http://localhost:8080/api/v1
```

---

## Responsive Behavior

- **Desktop (>1024px):** Sidebar visible, 4 columns side by side
- **Tablet (768-1024px):** Sidebar collapsible, columns scroll horizontally
- **Mobile (<768px):** Sidebar as drawer, single column view with tab selector for status

---

## Loading & Error States

### Loading
- Board skeleton: 4 column outlines with 2-3 card-shaped shimmer rectangles each
- Task detail: content area shimmer placeholders
- All fetches should show skeleton, not spinner

### Empty States
- **No tasks at all:** Centered illustration + "Create your first task" CTA
- **Empty column:** Subtle dashed border + "Drop tasks here" or "No tasks" muted text
- **No team members:** "Add team members to assign tasks" in sidebar
- **No labels:** "Create labels to organize tasks" in sidebar

### Errors
- Toast notification (bottom-right) for API errors
- Inline error message in forms for validation errors
- Retry button for failed fetches
