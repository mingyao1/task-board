import { get, post, patch, del } from './client'
import type {
  Task,
  TaskFilters,
  CreateTaskInput,
  UpdateTaskInput,
  ReorderTaskInput,
} from '@/types'

export async function getTasks(filters?: TaskFilters): Promise<Task[]> {
  const params: Record<string, string | number | boolean | undefined> = {}

  if (filters?.search) params.search = filters.search
  if (filters?.priority?.length) params.priority = filters.priority.join(',')
  if (filters?.status?.length) params.status = filters.status.join(',')
  if (filters?.assignee_id) params.assignee_id = filters.assignee_id
  if (filters?.label_id) params.label_id = filters.label_id
  if (filters?.sort_by) params.sort_by = filters.sort_by
  if (filters?.sort_dir) params.sort_dir = filters.sort_dir

  const data = await get<{ tasks: Task[] }>('/tasks', params)
  return data.tasks ?? []
}

export async function createTask(input: CreateTaskInput): Promise<Task> {
  const data = await post<{ task: Task }>('/tasks', input)
  return data.task
}

export async function updateTask(id: string, input: UpdateTaskInput): Promise<Task> {
  const data = await patch<{ task: Task }>(`/tasks/${id}`, input)
  return data.task
}

export async function deleteTask(id: string): Promise<void> {
  await del(`/tasks/${id}`)
}

export async function reorderTasks(updates: ReorderTaskInput[]): Promise<void> {
  await patch('/tasks/reorder', { updates })
}
