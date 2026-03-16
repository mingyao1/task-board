import React from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { cn } from '@/lib/utils'
import { TaskCard } from './TaskCard'
import { NewTaskButton } from './NewTaskButton'
import type { Task, TaskStatus } from '@/types'

interface ColumnConfig {
  label: string
  color: string
  bgColor: string
}

const COLUMN_CONFIG: Record<TaskStatus, ColumnConfig> = {
  todo: {
    label: 'To Do',
    color: '#A1A1AA',
    bgColor: '#A1A1AA20',
  },
  in_progress: {
    label: 'In Progress',
    color: '#3B82F6',
    bgColor: '#3B82F620',
  },
  in_review: {
    label: 'In Review',
    color: '#F59E0B',
    bgColor: '#F59E0B20',
  },
  done: {
    label: 'Done',
    color: '#10B981',
    bgColor: '#10B98120',
  },
}

interface ColumnProps {
  status: TaskStatus
  tasks: Task[]
  onTaskClick: (task: Task) => void
  onAddTask: (status: TaskStatus) => void
}

export function Column({ status, tasks, onTaskClick, onAddTask }: ColumnProps) {
  const config = COLUMN_CONFIG[status]

  const { setNodeRef, isOver } = useDroppable({ id: status })

  const taskIds = tasks.map((t) => t.id)

  return (
    <div className="flex flex-col min-w-[280px] max-w-[320px] w-[300px]">
      {/* Column header */}
      <div className="flex items-center gap-2.5 px-1 pb-3 mb-1">
        <div
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: config.color }}
        />
        <span
          className="text-[13px] font-semibold uppercase tracking-wide"
          style={{ color: config.color }}
        >
          {config.label}
        </span>
        <span
          className="ml-auto text-[11px] font-semibold px-2 py-0.5 rounded-full"
          style={{
            backgroundColor: config.bgColor,
            color: config.color,
          }}
        >
          {tasks.length}
        </span>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 flex flex-col gap-2 p-2 rounded-xl min-h-[120px]',
          'border-2 border-transparent',
          'transition-colors duration-150',
          isOver && 'border-[#6366F1]/40 bg-[#6366F1]/5',
        )}
      >
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.length === 0 ? (
            <div
              className={cn(
                'flex-1 flex items-center justify-center rounded-lg min-h-[80px]',
                'border border-dashed border-[#27272A]',
                isOver && 'border-[#6366F1]/40',
                'transition-colors duration-150',
              )}
            >
              <p className="text-xs text-[#71717A]">
                {isOver ? 'Drop here' : 'No tasks'}
              </p>
            </div>
          ) : (
            tasks.map((task) => (
              <TaskCard key={task.id} task={task} onClick={onTaskClick} />
            ))
          )}
        </SortableContext>
      </div>

      {/* Add task button */}
      <div className="pt-2 px-2">
        <NewTaskButton onClick={() => onAddTask(status)} />
      </div>
    </div>
  )
}
