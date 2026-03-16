import React, { useEffect, useState } from 'react'
import {
  Plus,
  ArrowRight,
  Flag,
  User,
  UserMinus,
  Calendar,
  CalendarX,
  Tag,
  MessageSquare,
  Trash2,
  Edit3,
} from 'lucide-react'
import { get } from '@/api/client'
import { formatRelativeDate } from '@/lib/utils'
import type { ActivityLog, ActivityAction } from '@/types'

const actionConfig: Record<
  ActivityAction,
  { icon: React.ElementType; label: string; color: string }
> = {
  created: { icon: Plus, label: 'created this task', color: '#10B981' },
  updated: { icon: Edit3, label: 'updated the task', color: '#6366F1' },
  status_changed: { icon: ArrowRight, label: 'changed status', color: '#3B82F6' },
  priority_changed: { icon: Flag, label: 'changed priority', color: '#F59E0B' },
  assigned: { icon: User, label: 'assigned to', color: '#8B5CF6' },
  unassigned: { icon: UserMinus, label: 'unassigned from', color: '#71717A' },
  due_date_set: { icon: Calendar, label: 'set due date to', color: '#3B82F6' },
  due_date_cleared: { icon: CalendarX, label: 'cleared due date', color: '#71717A' },
  label_added: { icon: Tag, label: 'added label', color: '#6366F1' },
  label_removed: { icon: Tag, label: 'removed label', color: '#71717A' },
  comment_added: { icon: MessageSquare, label: 'added a comment', color: '#10B981' },
  comment_deleted: { icon: Trash2, label: 'deleted a comment', color: '#EF4444' },
}

interface TaskActivityLogProps {
  taskId: string
}

export function TaskActivityLog({ taskId }: TaskActivityLogProps) {
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    get<{ activity: ActivityLog[] }>(`/tasks/${taskId}/activity`)
      .then((data) => {
        if (!cancelled) setLogs(data.activity ?? [])
      })
      .catch(() => {
        if (!cancelled) setLogs([])
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => { cancelled = true }
  }, [taskId])

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3 animate-pulse">
            <div className="w-6 h-6 rounded-full bg-[#27272A] flex-shrink-0" />
            <div className="flex-1 space-y-1">
              <div className="h-3 bg-[#27272A] rounded w-2/3" />
              <div className="h-2.5 bg-[#27272A] rounded w-1/3" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (logs.length === 0) {
    return <p className="text-xs text-[#71717A] py-2">No activity yet</p>
  }

  return (
    <div className="relative space-y-4">
      {/* Vertical line */}
      <div className="absolute left-[11px] top-2 bottom-2 w-px bg-[#27272A]" />

      {logs.map((log) => {
        const config = actionConfig[log.action] ?? {
          icon: Edit3,
          label: log.action,
          color: '#71717A',
        }
        const Icon = config.icon

        return (
          <div key={log.id} className="flex gap-3 relative">
            {/* Icon dot */}
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 z-10"
              style={{ backgroundColor: `${config.color}20` }}
            >
              <Icon size={12} style={{ color: config.color }} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pt-0.5">
              <p className="text-xs text-[#A1A1AA]">
                <span className="font-medium text-[#FAFAFA]">You</span>{' '}
                {config.label}
                {log.new_value && (
                  <span className="font-medium text-[#FAFAFA]"> {log.new_value}</span>
                )}
              </p>
              <p className="text-[11px] text-[#71717A] mt-0.5">
                {formatRelativeDate(log.created_at)}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
