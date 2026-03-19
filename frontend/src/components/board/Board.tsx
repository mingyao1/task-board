import React, { useState, useMemo, useCallback } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
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
import { useTeamMembers } from '@/hooks/useTeamMembers'
import type { Task, TaskStatus, TaskFilters, CreateTaskInput, UpdateTaskInput, ReorderTaskInput } from '@/types'

const STATUSES: TaskStatus[] = ['todo', 'in_progress', 'in_review', 'done']

interface BoardProps {
  filters: TaskFilters
}

export function Board({ filters }: BoardProps) {
  const { tasks, isLoading, error, createTask, updateTask, deleteTask, reorderTasks, setTasks } =
    useTasks(filters)
  const { showError, showSuccess } = useToast()
  const { lastDeletedMemberId } = useTeamMembers()

  // When a team member is deleted, clear their assignee data from local task state
  // without refetching — keeps the board in sync immediately.
  React.useEffect(() => {
    if (!lastDeletedMemberId) return
    setTasks((prev) =>
      prev.map((t) =>
        t.assignee_id === lastDeletedMemberId
          ? { ...t, assignee_id: null, assignee: null }
          : t,
      ),
    )
  }, [lastDeletedMemberId, setTasks])

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

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      setActiveTask(null)
      const { active, over } = event
      if (!over) return

      const activeId = active.id as string
      const overId = over.id as string

      const draggedTask = tasks.find((t) => t.id === activeId)
      if (!draggedTask) return

      const overIsColumn = STATUSES.includes(overId as TaskStatus)
      const overTask = !overIsColumn ? tasks.find((t) => t.id === overId) : null

      const newStatus: TaskStatus = overIsColumn
        ? (overId as TaskStatus)
        : (overTask?.status ?? draggedTask.status)

      // Compute position: sort the target column excluding the dragged task,
      // then find where to insert.
      const columnTasksWithout = tasks
        .filter((t) => t.id !== activeId && t.status === newStatus)
        .sort((a, b) => a.position - b.position)

      let newPosition: number
      if (overIsColumn || !overTask) {
        newPosition = columnTasksWithout.length
      } else {
        const overIndex = columnTasksWithout.findIndex((t) => t.id === overId)
        newPosition = overIndex >= 0 ? overIndex : columnTasksWithout.length
      }

      // Skip API call if nothing actually changed
      if (newStatus === draggedTask.status && newPosition === draggedTask.position) return

      const updates: ReorderTaskInput[] = [{ id: activeId, status: newStatus, old_status: draggedTask.status, position: newPosition }]

      try {
        await reorderTasks(updates)
      } catch (err) {
        showError(err instanceof Error ? err.message : 'Failed to move task')
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

        <DragOverlay>
          {activeTask ? (
            <TaskCard task={activeTask} onClick={() => {}} isDragOverlay />
          ) : null}
        </DragOverlay>
      </DndContext>

      <TaskDetailPanel
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
        onUpdate={handleUpdateTask}
        onDelete={handleDeleteTask}
      />

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
