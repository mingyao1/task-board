import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Calendar, Flag } from 'lucide-react'
import { cn, getDueDateUrgency, formatShortDate } from '@/lib/utils'
import { AvatarBadge } from '@/components/team/AvatarBadge'
import { LabelBadge } from '@/components/labels/LabelBadge'
import type { Task } from '@/types'

const PRIORITY_COLORS: Record<string, string> = {
  high: '#EF4444',
  normal: '#F59E0B',
  low: '#6B7280',
}

interface TaskCardProps {
  task: Task
  onClick: (task: Task) => void
  isDragOverlay?: boolean
}

export function TaskCard({ task, onClick, isDragOverlay = false }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const dueDateUrgency = getDueDateUrgency(task.due_date)

  const dueDateClasses = {
    overdue: 'bg-[#EF4444]/10 text-[#EF4444]',
    today: 'bg-[#F59E0B]/10 text-[#F59E0B]',
    soon: 'bg-[#3B82F6]/10 text-[#3B82F6]',
    normal: 'bg-[#27272A] text-[#71717A]',
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onClick(task)}
      className={cn(
        'group relative bg-[#18181B] rounded-lg border border-[#27272A]',
        'p-3 space-y-2.5 cursor-pointer',
        'hover:border-[#3F3F46] hover:shadow-lg hover:shadow-black/20',
        'transition-all duration-150',
        isDragging && 'opacity-40 border-[#6366F1]/50',
        isDragOverlay && 'shadow-2xl shadow-black/60 rotate-1 scale-105 border-[#6366F1]/30',
      )}
    >
      {/* Priority indicator bar */}
      <div
        className="absolute left-0 top-3 bottom-3 w-0.5 rounded-full"
        style={{ backgroundColor: PRIORITY_COLORS[task.priority] }}
      />

      {/* Title */}
      <p className="text-[14px] font-medium text-[#FAFAFA] leading-snug pl-2 line-clamp-2">
        {task.title}
      </p>

      {/* Labels */}
      {task.labels && task.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 pl-2">
          {task.labels.slice(0, 3).map((label) => (
            <LabelBadge key={label.id} label={label} />
          ))}
          {task.labels.length > 3 && (
            <span className="text-[11px] text-[#71717A] px-1.5 py-0.5 rounded-full bg-[#27272A]">
              +{task.labels.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Meta row */}
      <div className="flex items-center justify-between pl-2">
        <div className="flex items-center gap-2">
          {/* Due date */}
          {task.due_date && dueDateUrgency && (
            <span
              className={cn(
                'flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[11px] font-medium',
                dueDateClasses[dueDateUrgency],
              )}
            >
              <Calendar size={10} />
              {formatShortDate(task.due_date)}
            </span>
          )}

          {/* Priority badge — only for high */}
          {task.priority === 'high' && (
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[11px] font-medium bg-[#EF4444]/10 text-[#EF4444]">
              <Flag size={10} />
              High
            </span>
          )}
        </div>

        {/* Assignee */}
        {task.assignee && (
          <AvatarBadge
            name={task.assignee.name}
            color={task.assignee.color}
            size="sm"
            className="ring-1 ring-[#18181B]"
          />
        )}
      </div>
    </div>
  )
}
