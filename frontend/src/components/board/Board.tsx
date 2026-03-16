import React, { useState, useMemo, useCallback } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
  closestCorners,
} from '@dnd-kit/core'
import { Column } from './Column'
import { TaskCard } from './TaskCard'
import { TaskDetailPanel } from '@/components/task/TaskDetailPanel'
import { TaskForm } from '@/components/task/TaskForm'
import { Modal } from '@/components/ui/Modal'
import { BoardSkeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/components/ui/Toast'
import { useTasks } from '@/hooks/useTasks'
import type { Task, TaskStatus, TaskFilters, CreateTaskInput, UpdateTaskInput, ReorderTaskInput } from '@/types'

const STATUSES: TaskStatus[] = ['todo', 'in_progress', 'in_review', 'done']

interface BoardProps {
  filters: TaskFilters
}

export function Board({ filters }: BoardProps) {
  const { tasks, isLoading, error, createTask, updateTask, deleteTask, reorderTasks, setTasks } =
    useTasks(filters)
  const { showError, showSuccess } = useToast()

  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [createStatus, setCreateStatus] = useState<TaskStatus | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  )

  // Group tasks by status, sorted by position
  const tasksByStatus = useMemo(() => {
    const grouped: Record<TaskStatus, Task[]> = {
      todo: [],
      in_progress: [],
      in_review: [],
      done: [],
    }
    for (const task of tasks) {
      if (grouped[task.status]) {
        grouped[task.status].push(task)
      }
    }
    for (const status of STATUSES) {
      grouped[status].sort((a, b) => a.position - b.position)
    }
    return grouped
  }, [tasks])

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const task = tasks.find((t) => t.id === event.active.id)
      setActiveTask(task ?? null)
    },
    [tasks],
  )

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event
      if (!over) return

      const activeId = active.id as string
      const overId = over.id as string

      const activeTask = tasks.find((t) => t.id === activeId)
      if (!activeTask) return

      // Determine if dropping over a column or a card
      const overIsColumn = STATUSES.includes(overId as TaskStatus)
      const overTask = tasks.find((t) => t.id === overId)

      const newStatus: TaskStatus = overIsColumn
        ? (overId as TaskStatus)
        : (overTask?.status ?? activeTask.status)

      if (newStatus !== activeTask.status) {
        // Move across columns
        setTasks((prev) => {
          const updated = prev.map((t) =>
            t.id === activeId ? { ...t, status: newStatus } : t,
          )
          return updated
        })
      }
    },
    [tasks, setTasks],
  )

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      setActiveTask(null)
      const { active, over } = event
      if (!over) return

      const activeId = active.id as string
      const overId = over.id as string

      if (activeId === overId) return

      const activeTask = tasks.find((t) => t.id === activeId)
      if (!activeTask) return

      const overIsColumn = STATUSES.includes(overId as TaskStatus)
      const overTask = tasks.find((t) => t.id === overId)

      const newStatus: TaskStatus = overIsColumn
        ? (overId as TaskStatus)
        : (overTask?.status ?? activeTask.status)

      const columnTasks = tasks
        .filter((t) => t.status === newStatus)
        .sort((a, b) => a.position - b.position)

      let newPosition: number

      if (overIsColumn) {
        // Drop onto column — put at end
        newPosition = columnTasks.length
      } else if (overTask) {
        // Drop onto a card
        const overIndex = columnTasks.findIndex((t) => t.id === overId)
        newPosition = overIndex
      } else {
        newPosition = columnTasks.length
      }

      // Build reorder update
      const updates: ReorderTaskInput[] = [
        {
          task_id: activeId,
          new_status: newStatus,
          new_position: newPosition,
        },
      ]

      try {
        await reorderTasks(updates)
      } catch (err) {
        showError(err instanceof Error ? err.message : 'Failed to reorder tasks')
      }
    },
    [tasks, reorderTasks, showError],
  )

  const handleCreateTask = useCallback(
    async (data: CreateTaskInput | UpdateTaskInput) => {
      if (!createStatus) return
      try {
        await createTask({ ...(data as CreateTaskInput), status: createStatus })
        showSuccess('Task created')
        setCreateStatus(null)
      } catch (err) {
        showError(err instanceof Error ? err.message : 'Failed to create task')
      }
    },
    [createStatus, createTask, showSuccess, showError],
  )

  const handleUpdateTask = useCallback(
    async (id: string, data: UpdateTaskInput): Promise<Task> => {
      const updated = await updateTask(id, data)
      // Sync selected task state
      setSelectedTask((prev) => (prev?.id === id ? updated : prev))
      return updated
    },
    [updateTask],
  )

  const handleDeleteTask = useCallback(
    async (id: string): Promise<void> => {
      await deleteTask(id)
      setSelectedTask(null)
    },
    [deleteTask],
  )

  if (isLoading) return <BoardSkeleton />

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-[#EF4444]">{error}</p>
      </div>
    )
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-5 p-6 overflow-x-auto min-h-full">
          {STATUSES.map((status) => (
            <Column
              key={status}
              status={status}
              tasks={tasksByStatus[status]}
              onTaskClick={setSelectedTask}
              onAddTask={setCreateStatus}
            />
          ))}
        </div>

        {/* Drag overlay */}
        <DragOverlay>
          {activeTask ? (
            <TaskCard task={activeTask} onClick={() => {}} isDragOverlay />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Task detail panel */}
      <TaskDetailPanel
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
        onUpdate={handleUpdateTask}
        onDelete={handleDeleteTask}
      />

      {/* Create task modal */}
      <Modal
        isOpen={createStatus !== null}
        onClose={() => setCreateStatus(null)}
        title="Create Task"
        size="md"
      >
        {createStatus && (
          <TaskForm
            defaultStatus={createStatus}
            onSubmit={handleCreateTask}
            onCancel={() => setCreateStatus(null)}
          />
        )}
      </Modal>
    </>
  )
}
