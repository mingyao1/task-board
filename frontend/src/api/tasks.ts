import { supabase } from '@/lib/supabase'
import { logActivity } from './activity'
import type { Task, TaskFilters, CreateTaskInput, UpdateTaskInput, ReorderTaskInput } from '@/types'

// ─── Raw Supabase row shapes ──────────────────────────────────────────────────

interface RawMember {
  id: string
  user_id: string
  name: string
  color: string
  created_at: string
}

interface RawLabel {
  id: string
  user_id: string
  name: string
  color: string
  created_at: string
}

interface RawTask {
  id: string
  user_id: string
  title: string
  description: string | null
  status: string
  priority: string
  position: number
  due_date: string | null
  created_at: string
  updated_at: string
  task_assignees: Array<{ member_id: string; team_members: RawMember | null }>
  task_labels: Array<{ label_id: string; labels: RawLabel | null }>
}

const TASK_SELECT = `
  *,
  task_assignees(member_id, team_members(*)),
  task_labels(label_id, labels(*))
`

// ─── Mapping ─────────────────────────────────────────────────────────────────

function mapTask(raw: RawTask): Task {
  const rawAssignee = raw.task_assignees?.[0]?.team_members ?? null
  return {
    id: raw.id,
    user_id: raw.user_id,
    title: raw.title,
    description: raw.description,
    status: raw.status as Task['status'],
    priority: raw.priority as Task['priority'],
    position: raw.position,
    due_date: raw.due_date,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
    assignee_id: raw.task_assignees?.[0]?.member_id ?? null,
    assignee: rawAssignee ? { ...rawAssignee, updated_at: rawAssignee.created_at } : null,
    label_ids: raw.task_labels?.map((tl) => tl.label_id) ?? [],
    labels:
      raw.task_labels
        ?.filter((tl) => tl.labels != null)
        .map((tl) => ({ ...tl.labels!, updated_at: tl.labels!.created_at })) ?? [],
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getUserId(): Promise<string> {
  const { data } = await supabase.auth.getUser()
  if (!data.user) throw new Error('Not authenticated')
  return data.user.id
}

async function getTaskById(id: string): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .select(TASK_SELECT)
    .eq('id', id)
    .single()
  if (error) throw new Error(error.message)
  return mapTask(data as RawTask)
}

// ─── Activity helpers ─────────────────────────────────────────────────────────

async function logChanges(
  taskId: string,
  userId: string,
  before: Task,
  after: Task,
  input: UpdateTaskInput,
): Promise<void> {
  const logs: Promise<void>[] = []

  if (input.status !== undefined && before.status !== after.status) {
    logs.push(logActivity(taskId, userId, 'status_changed', {
      old_value: before.status,
      new_value: after.status,
    }))
  }

  if (input.priority !== undefined && before.priority !== after.priority) {
    logs.push(logActivity(taskId, userId, 'priority_changed', {
      old_value: before.priority,
      new_value: after.priority,
    }))
  }

  if (
    (input.title !== undefined && input.title !== before.title) ||
    (input.description !== undefined && input.description !== before.description)
  ) {
    logs.push(logActivity(taskId, userId, 'updated', {}))
  }

  if ('due_date' in input) {
    if (!before.due_date && after.due_date) {
      logs.push(logActivity(taskId, userId, 'due_date_set', { new_value: after.due_date }))
    } else if (before.due_date && !after.due_date) {
      logs.push(logActivity(taskId, userId, 'due_date_cleared', { old_value: before.due_date }))
    } else if (after.due_date && before.due_date !== after.due_date) {
      logs.push(logActivity(taskId, userId, 'due_date_set', { new_value: after.due_date }))
    }
  }

  if ('assignee_id' in input) {
    if (!before.assignee_id && after.assignee_id) {
      logs.push(logActivity(taskId, userId, 'assigned', {
        new_value: after.assignee?.name ?? after.assignee_id!,
      }))
    } else if (before.assignee_id && !after.assignee_id) {
      logs.push(logActivity(taskId, userId, 'unassigned', {
        old_value: before.assignee?.name ?? before.assignee_id,
      }))
    } else if (before.assignee_id !== after.assignee_id && after.assignee_id) {
      logs.push(logActivity(taskId, userId, 'assigned', {
        new_value: after.assignee?.name ?? after.assignee_id,
      }))
    }
  }

  if ('label_ids' in input && input.label_ids !== undefined) {
    const added = after.label_ids.filter((id) => !before.label_ids.includes(id))
    const removed = before.label_ids.filter((id) => !after.label_ids.includes(id))

    for (const labelId of added) {
      const label = after.labels?.find((l) => l.id === labelId)
      logs.push(logActivity(taskId, userId, 'label_added', {
        new_value: label?.name ?? labelId,
      }))
    }
    for (const labelId of removed) {
      const label = before.labels?.find((l) => l.id === labelId)
      logs.push(logActivity(taskId, userId, 'label_removed', {
        old_value: label?.name ?? labelId,
      }))
    }
  }

  await Promise.all(logs)
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function getTasks(filters?: TaskFilters): Promise<Task[]> {
  let query = supabase.from('tasks').select(TASK_SELECT).order('position', { ascending: true })

  if (filters?.status?.length) query = query.in('status', filters.status)
  if (filters?.priority?.length) query = query.in('priority', filters.priority)
  if (filters?.search) {
    const term = filters.search.replace(/[%_]/g, '\\$&')
    query = query.or(`title.ilike.%${term}%,description.ilike.%${term}%`)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)

  let tasks = (data as RawTask[]).map(mapTask)

  // Filter on join-table fields in memory (Supabase simple queries can't filter on them)
  if (filters?.assignee_id) {
    tasks = tasks.filter((t) => t.assignee_id === filters.assignee_id)
  }
  if (filters?.label_id) {
    tasks = tasks.filter((t) => t.label_ids.includes(filters.label_id!))
  }

  return tasks
}

export async function createTask(input: CreateTaskInput): Promise<Task> {
  const userId = await getUserId()
  const targetStatus = input.status ?? 'todo'

  // Position = one after current max in that status column
  const { data: existing } = await supabase
    .from('tasks')
    .select('position')
    .eq('status', targetStatus)
    .order('position', { ascending: false })
    .limit(1)
  const position = existing && existing.length > 0 ? (existing[0].position as number) + 1 : 0

  const { data: taskRow, error } = await supabase
    .from('tasks')
    .insert({
      title: input.title,
      description: input.description ?? null,
      status: targetStatus,
      priority: input.priority ?? 'normal',
      due_date: input.due_date ?? null,
      position,
      user_id: userId,
    })
    .select('id')
    .single()
  if (error) throw new Error(error.message)

  const id = taskRow.id as string

  if (input.assignee_id) {
    const { error: e } = await supabase
      .from('task_assignees')
      .insert({ task_id: id, member_id: input.assignee_id })
    if (e) throw new Error(e.message)
  }

  if (input.label_ids?.length) {
    const { error: e } = await supabase
      .from('task_labels')
      .insert(input.label_ids.map((label_id) => ({ task_id: id, label_id })))
    if (e) throw new Error(e.message)
  }

  await logActivity(id, userId, 'created', {})

  return getTaskById(id)
}

export async function updateTask(id: string, input: UpdateTaskInput): Promise<Task> {
  const userId = await getUserId()
  const before = await getTaskById(id)

  // Update scalar fields
  const scalarUpdate: Record<string, unknown> = {}
  if (input.title !== undefined) scalarUpdate.title = input.title
  if (input.description !== undefined) scalarUpdate.description = input.description
  if (input.status !== undefined) scalarUpdate.status = input.status
  if (input.priority !== undefined) scalarUpdate.priority = input.priority
  if ('due_date' in input) scalarUpdate.due_date = input.due_date

  if (Object.keys(scalarUpdate).length > 0) {
    const { error } = await supabase.from('tasks').update(scalarUpdate).eq('id', id)
    if (error) throw new Error(error.message)
  }

  // Replace assignee
  if ('assignee_id' in input) {
    const { error: de } = await supabase.from('task_assignees').delete().eq('task_id', id)
    if (de) throw new Error(de.message)
    if (input.assignee_id) {
      const { error: ie } = await supabase
        .from('task_assignees')
        .insert({ task_id: id, member_id: input.assignee_id })
      if (ie) throw new Error(ie.message)
    }
  }

  // Replace labels
  if ('label_ids' in input) {
    const { error: de } = await supabase.from('task_labels').delete().eq('task_id', id)
    if (de) throw new Error(de.message)
    if (input.label_ids?.length) {
      const { error: ie } = await supabase
        .from('task_labels')
        .insert(input.label_ids.map((label_id) => ({ task_id: id, label_id })))
      if (ie) throw new Error(ie.message)
    }
  }

  const after = await getTaskById(id)
  await logChanges(id, userId, before, after, input)

  return after
}

export async function deleteTask(id: string): Promise<void> {
  const { error } = await supabase.from('tasks').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function reorderTasks(updates: ReorderTaskInput[]): Promise<void> {
  const userId = await getUserId()

  await Promise.all(
    updates.map(async ({ id, status, position, old_status }) => {
      const { error } = await supabase.from('tasks').update({ status, position }).eq('id', id)
      if (error) throw new Error(error.message)

      if (old_status && old_status !== status) {
        await logActivity(id, userId, 'status_changed', {
          old_value: old_status,
          new_value: status,
        })
      }
    }),
  )
}
