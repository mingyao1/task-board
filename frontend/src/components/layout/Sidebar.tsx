import React from 'react'
import {
  LayoutDashboard,
  CheckSquare,
  BarChart3,
  TrendingUp,
  AlertCircle,
  Clock,
} from 'lucide-react'
import { TeamMemberList } from '@/components/team/TeamMemberList'
import { LabelManager } from '@/components/labels/LabelManager'
import { useBoardStats } from '@/hooks/useBoardStats'

function StatsWidget() {
  const { stats, isLoading } = useBoardStats()

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-8 rounded-lg bg-[#27272A] animate-pulse" />
        ))}
      </div>
    )
  }

  if (!stats) return null

  const completionRate =
    stats.total > 0 ? Math.round((stats.by_status.done / stats.total) * 100) : 0

  const items = [
    {
      label: 'Total Tasks',
      value: stats.total,
      icon: CheckSquare,
      color: '#6366F1',
    },
    {
      label: 'In Progress',
      value: stats.by_status.in_progress,
      icon: TrendingUp,
      color: '#3B82F6',
    },
    {
      label: 'Overdue',
      value: stats.overdue,
      icon: AlertCircle,
      color: stats.overdue > 0 ? '#EF4444' : '#71717A',
    },
    {
      label: 'Due Today',
      value: stats.due_today,
      icon: Clock,
      color: stats.due_today > 0 ? '#F59E0B' : '#71717A',
    },
  ]

  return (
    <div className="space-y-2">
      {items.map(({ label, value, icon: Icon, color }) => (
        <div
          key={label}
          className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#0F0F10]"
        >
          <div className="flex items-center gap-2">
            <Icon size={13} style={{ color }} />
            <span className="text-[12px] text-[#A1A1AA]">{label}</span>
          </div>
          <span className="text-[13px] font-semibold" style={{ color }}>
            {value}
          </span>
        </div>
      ))}

      {/* Progress bar */}
      {stats.total > 0 && (
        <div className="px-1 pt-1 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[#71717A]">Completion</span>
            <span className="text-[11px] font-medium text-[#10B981]">{completionRate}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-[#27272A] overflow-hidden">
            <div
              className="h-full rounded-full bg-[#10B981] transition-all duration-500"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[240px] bg-[#18181B] border-r border-[#27272A] flex flex-col overflow-y-auto z-20">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-[#27272A]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#6366F1] flex items-center justify-center flex-shrink-0">
            <LayoutDashboard size={14} className="text-white" />
          </div>
          <span className="text-[15px] font-semibold text-[#FAFAFA]">Task Board</span>
        </div>
      </div>

      {/* Nav links placeholder */}
      <nav className="px-3 py-3 border-b border-[#27272A]">
        <button className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg bg-[#6366F1]/10 text-[#6366F1] text-[13px] font-medium">
          <LayoutDashboard size={15} />
          Board
        </button>
      </nav>

      {/* Stats */}
      <div className="px-4 py-4 border-b border-[#27272A]">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 size={13} className="text-[#71717A]" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#71717A]">
            Overview
          </span>
        </div>
        <StatsWidget />
      </div>

      {/* Team members */}
      <div className="px-4 py-4 border-b border-[#27272A]">
        <TeamMemberList />
      </div>

      {/* Labels */}
      <div className="px-4 py-4">
        <LabelManager />
      </div>
    </aside>
  )
}
