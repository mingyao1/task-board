import React, { useState, useEffect, useCallback } from 'react'
import * as tasksApi from '@/api/tasks'
import type {
  Task,
  TaskFilters,
  CreateTaskInput,
  UpdateTaskInput,
  ReorderTaskInput,
} from '@/types'

interface UseTasksReturn {
  tasks: Task[]
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
  createTask: (input: CreateTaskInput) => Promise<Task>
  updateTask: (id: string, input: UpdateTaskInput) => Promise<Task>
  deleteTask: (id: string) => Promise<void>
  reorderTasks: (updates: ReorderTaskInput[]) => Promise<void>
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>
}

export function useTasks(filters?: TaskFilters): UseTasksReturn {
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTasks = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await tasksApi.getTasks(filters)
      setTasks(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tasks')
    } finally {
      setIsLoading(false)
    }
  }, [
    filters?.search,
    filters?.status?.join(','),
    filters?.priority?.join(','),
    filters?.assignee_id,
    filters?.label_id,
    filters?.sort_by,
    filters?.sort_dir,
  ])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  const createTask = useCallback(async (input: CreateTaskInput): Promise<Task> => {
    const newTask = await tasksApi.createTask(input)
    setTasks((prev) => [...prev, newTask])
    return newTask
  }, [])

  const updateTask = useCallback(async (id: string, input: UpdateTaskInput): Promise<Task> => {
    const updated = await tasksApi.updateTask(id, input)
    setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)))
    return updated
  }, [])

  const deleteTask = useCallback(async (id: string): Promise<void> => {
    // Optimistic delete
    setTasks((prev) => prev.filter((t) => t.id !== id))
    try {
      await tasksApi.deleteTask(id)
    } catch (err) {
      // Revert on failure — refetch to get consistent state
      await fetchTasks()
      throw err
    }
  }, [fetchTasks])

  const reorderTasks = useCallback(
    async (updates: ReorderTaskInput[]): Promise<void> => {
      // Snapshot for rollback
      const snapshot = tasks.slice()

      // Optimistic update
      setTasks((prev) => {
        const next = prev.map((task) => {
          const update = updates.find((u) => u.task_id === task.id)
          if (!update) return task
          return { ...task, status: update.new_status, position: update.new_position }
        })
        return next.sort((a, b) => {
          if (a.status !== b.status) return 0
          return a.position - b.position
        })
      })

      try {
        await tasksApi.reorderTasks(updates)
      } catch (err) {
        // Revert on failure
        setTasks(snapshot)
        throw err
      }
    },
    [tasks],
  )

  return {
    tasks,
    isLoading,
    error,
    refetch: fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    reorderTasks,
    setTasks,
  }
}
