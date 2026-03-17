// ─── Status & Priority ───────────────────────────────────────────────────────

export type TaskStatus = 'todo' | 'in_progress' | 'in_review' | 'done'

export type TaskPriority = 'high' | 'normal' | 'low'

// ─── Core Entities ───────────────────────────────────────────────────────────

export interface TeamMember {
  id: string
  user_id: string
  name: string
  color: string
  created_at: string
  updated_at: string
}

export interface Label {
  id: string
  user_id: string
  name: string
  color: string
  created_at: string
  updated_at: string
}

export interface Task {
  id: string
  user_id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  position: number
  due_date: string | null
  assignee_id: string | null
  assignee?: TeamMember | null
  label_ids: string[]
  labels?: Label[]
  created_at: string
  updated_at: string
}

export interface Comment {
  id: string
  task_id: string
  user_id: string
  content: string
  created_at: string
  updated_at: string
}

export type ActivityAction =
  | 'created'
  | 'updated'
  | 'status_changed'
  | 'priority_changed'
  | 'assigned'
  | 'unassigned'
  | 'due_date_set'
  | 'due_date_cleared'
  | 'label_added'
  | 'label_removed'
  | 'comment_added'
  | 'comment_deleted'

export interface ActivityLog {
  id: string
  task_id: string
  user_id: string
  action: ActivityAction
  old_value: string | null
  new_value: string | null
  created_at: string
}

// ─── Board Stats ─────────────────────────────────────────────────────────────

export interface BoardStats {
  total: number
  by_status: {
    todo: number
    in_progress: number
    in_review: number
    done: number
  }
  by_priority: {
    high: number
    normal: number
    low: number
  }
  overdue: number
  due_today: number
}

// ─── Filters & Sorting ───────────────────────────────────────────────────────

export type SortField = 'created_at' | 'updated_at' | 'due_date' | 'priority' | 'position'

export type SortDirection = 'asc' | 'desc'

export interface TaskFilters {
  search?: string
  status?: TaskStatus[]
  priority?: TaskPriority[]
  assignee_id?: string
  label_id?: string
  sort_by?: SortField
  sort_dir?: SortDirection
}

// ─── API Request/Response shapes ────────────────────────────────────────────

export interface CreateTaskInput {
  title: string
  description?: string
  status?: TaskStatus
  priority?: TaskPriority
  due_date?: string | null
  assignee_id?: string | null
  label_ids?: string[]
}

export interface UpdateTaskInput {
  title?: string
  description?: string | null
  status?: TaskStatus
  priority?: TaskPriority
  due_date?: string | null
  assignee_id?: string | null
  label_ids?: string[]
}

export interface ReorderTaskInput {
  id: string
  status: TaskStatus
  position: number
}

export interface CreateTeamMemberInput {
  name: string
  color: string
}

export interface UpdateTeamMemberInput {
  name?: string
  color?: string
}

export interface CreateLabelInput {
  name: string
  color: string
}

export interface UpdateLabelInput {
  name?: string
  color?: string
}

export interface CreateCommentInput {
  content: string
}

// ─── UI State ────────────────────────────────────────────────────────────────

export interface ToastMessage {
  id: string
  type: 'success' | 'error' | 'info'
  message: string
}
