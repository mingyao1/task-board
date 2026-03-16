import React, { useState, useEffect } from 'react'
import {
  X,
  Pencil,
  Trash2,
  MessageSquare,
  Activity,
  Flag,
  Calendar,
  User,
  Tag,
} from 'lucide-react'
import { cn, formatDate, getDueDateUrgency } from '@/lib/utils'
import { TaskForm } from './TaskForm'
import { TaskComments } from './TaskComments'
import { TaskActivityLog } from './TaskActivityLog'
import { AvatarBadge } from '@/components/team/AvatarBadge'
import { LabelBadge } from '@/components/labels/LabelBadge'
import { useToast } from '@/components/ui/Toast'
import type { Task, UpdateTaskInput } from '@/types'

type ActiveTab = 'comments' | 'activity'

const STATUS_LABELS: Record<string, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  in_review: 'In Review',
  done: 'Done',
}

const STATUS_COLORS: Record<string, string> = {
  todo: '#A1A1AA',
  in_progress: '#3B82F6',
  in_review: '#F59E0B',
  done: '#10B981',
}

const PRIORITY_LABELS: Record<string, string> = {
  high: 'High',
  normal: 'Normal',
  low: 'Low',
}

const PRIORITY_COLORS: Record<string, string> = {
  high: '#EF4444',
  normal: '#F59E0B',
  low: '#6B7280',
}

interface TaskDetailPanelProps {
  task: Task | null
  onClose: () => void
  onUpdate: (id: string, input: UpdateTaskInput) => Promise<Task>
  onDelete: (id: string) => Promise<void>
}

export function TaskDetailPanel({ task, onClose, onUpdate, onDelete }: TaskDetailPanelProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [activeTab, setActiveTab] = useState<ActiveTab>('comments')
  const [isDeleting, setIsDeleting] = useState(false)
  const { showError, showSuccess } = useToast()

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  // Reset edit state when task changes
  useEffect(() => {
    setIsEditing(false)
    setActiveTab('comments')
  }, [task?.id])

  const handleUpdate = async (data: UpdateTaskInput) => {
    if (!task) return
    try {
      await onUpdate(task.id, data)
      showSuccess('Task updated')
      setIsEditing(false)
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to update task')
    }
  }

  const handleDelete = async () => {
    if (!task) return
    setIsDeleting(true)
    try {
      await onDelete(task.id)
      showSuccess('Task deleted')
      onClose()
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to delete task')
      setIsDeleting(false)
    }
  }

  const dueDateUrgency = getDueDateUrgency(task?.due_date)

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-200',
          task ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        )}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={cn(
          'fixed top-0 right-0 bottom-0 z-50 w-[480px] bg-[#18181B] border-l border-[#27272A]',
          'flex flex-col shadow-2xl shadow-black/50',
          'transition-transform duration-200 ease-out',
          task ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        {task && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#27272A] flex-shrink-0">
              <div className="flex items-center gap-2">
                <span
                  className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: `${STATUS_COLORS[task.status]}20`,
                    color: STATUS_COLORS[task.status],
                  }}
                >
                  {STATUS_LABELS[task.status]}
                </span>
              </div>
              <div className="flex items-center gap-1">
                {!isEditing && (
                  <>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="p-1.5 rounded-md text-[#71717A] hover:text-[#FAFAFA] hover:bg-[#27272A] transition-colors"
                      title="Edit task"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="p-1.5 rounded-md text-[#71717A] hover:text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors disabled:opacity-40"
                      title="Delete task"
                    >
                      <Trash2 size={15} />
                    </button>
                  </>
                )}
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-md text-[#71717A] hover:text-[#FAFAFA] hover:bg-[#27272A] transition-colors"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {isEditing ? (
                <div className="p-5">
                  <TaskForm
                    task={task}
                    onSubmit={handleUpdate}
                    onCancel={() => setIsEditing(false)}
                  />
                </div>
              ) : (
                <div className="p-5 space-y-6">
                  {/* Title */}
                  <div>
                    <h1 className="text-lg font-semibold text-[#FAFAFA] leading-snug">
                      {task.title}
                    </h1>
                    {task.description && (
                      <p className="mt-2 text-sm text-[#A1A1AA] leading-relaxed whitespace-pre-wrap">
                        {task.description}
                      </p>
                    )}
                  </div>

                  {/* Meta grid */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Priority */}
                    <div className="space-y-1">
                      <p className="text-[11px] uppercase tracking-wider text-[#71717A] font-semibold flex items-center gap-1">
                        <Flag size={11} />
                        Priority
                      </p>
                      <span
                        className="text-sm font-medium"
                        style={{ color: PRIORITY_COLORS[task.priority] }}
                      >
                        {PRIORITY_LABELS[task.priority]}
                      </span>
                    </div>

                    {/* Due date */}
                    <div className="space-y-1">
                      <p className="text-[11px] uppercase tracking-wider text-[#71717A] font-semibold flex items-center gap-1">
                        <Calendar size={11} />
                        Due Date
                      </p>
                      {task.due_date ? (
                        <span
                          className={cn('text-sm font-medium', {
                            'text-[#EF4444]': dueDateUrgency === 'overdue',
                            'text-[#F59E0B]': dueDateUrgency === 'today',
                            'text-[#3B82F6]': dueDateUrgency === 'soon',
                            'text-[#A1A1AA]': dueDateUrgency === 'normal',
                          })}
                        >
                          {formatDate(task.due_date)}
                        </span>
                      ) : (
                        <span className="text-sm text-[#71717A]">—</span>
                      )}
                    </div>

                    {/* Assignee */}
                    <div className="space-y-1">
                      <p className="text-[11px] uppercase tracking-wider text-[#71717A] font-semibold flex items-center gap-1">
                        <User size={11} />
                        Assignee
                      </p>
                      {task.assignee ? (
                        <div className="flex items-center gap-2">
                          <AvatarBadge
                            name={task.assignee.name}
                            color={task.assignee.color}
                            size="sm"
                          />
                          <span className="text-sm text-[#A1A1AA]">{task.assignee.name}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-[#71717A]">Unassigned</span>
                      )}
                    </div>

                    {/* Labels */}
                    <div className="space-y-1">
                      <p className="text-[11px] uppercase tracking-wider text-[#71717A] font-semibold flex items-center gap-1">
                        <Tag size={11} />
                        Labels
                      </p>
                      {task.labels && task.labels.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {task.labels.map((label) => (
                            <LabelBadge key={label.id} label={label} />
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm text-[#71717A]">None</span>
                      )}
                    </div>
                  </div>

                  {/* Tabs */}
                  <div className="border-t border-[#27272A] pt-5">
                    <div className="flex gap-1 mb-4 p-1 bg-[#0F0F10] rounded-lg">
                      <button
                        onClick={() => setActiveTab('comments')}
                        className={cn(
                          'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex-1 justify-center',
                          activeTab === 'comments'
                            ? 'bg-[#27272A] text-[#FAFAFA]'
                            : 'text-[#71717A] hover:text-[#A1A1AA]',
                        )}
                      >
                        <MessageSquare size={12} />
                        Comments
                      </button>
                      <button
                        onClick={() => setActiveTab('activity')}
                        className={cn(
                          'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex-1 justify-center',
                          activeTab === 'activity'
                            ? 'bg-[#27272A] text-[#FAFAFA]'
                            : 'text-[#71717A] hover:text-[#A1A1AA]',
                        )}
                      >
                        <Activity size={12} />
                        Activity
                      </button>
                    </div>

                    {activeTab === 'comments' ? (
                      <TaskComments taskId={task.id} />
                    ) : (
                      <TaskActivityLog taskId={task.id} />
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  )
}
