import React from 'react'
import {
  LayoutDashboard,
  CheckSquare,
  BarChart3,
  TrendingUp,
  AlertCircle,
  Clock,
  ChevronLeft,
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
          <div key={i} className="h-8 rounded-lg bg-[var(--color-border-subtle)] animate-pulse" />
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
          className="flex items-center justify-between px-3 py-2 rounded-lg bg-[var(--color-bg-base)]"
        >
          <div className="flex items-center gap-2">
            <Icon size={13} style={{ color }} />
            <span className="text-[12px] text-[var(--color-text-secondary)]">{label}</span>
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
            <span className="text-[11px] text-[var(--color-text-muted)]">Completion</span>
            <span className="text-[11px] font-medium text-[#10B981]">{completionRate}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-[var(--color-border-subtle)] overflow-hidden">
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

interface SidebarProps {
  width: number
  isOpen: boolean
  onToggle: () => void
  onResizeStart: (e: React.MouseEvent) => void
}

export function Sidebar({ width, isOpen, onToggle, onResizeStart }: SidebarProps) {
  return (
    <aside
      className="fixed left-0 top-0 bottom-0 bg-[var(--color-bg-card)] border-r border-[var(--color-border-subtle)] flex flex-col z-20 overflow-hidden transition-[width] duration-200 ease-out"
      style={{ width: isOpen ? width : 0 }}
    >
      {/* Resize handle */}
      <div
        onMouseDown={onResizeStart}
        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-[#6366F1]/40 transition-colors z-10 group"
        title="Drag to resize"
      />

      {/* Scrollable content */}
      <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden" style={{ minWidth: 160 }}>
        {/* Logo + collapse button */}
        <div className="px-4 py-5 border-b border-[var(--color-border-subtle)] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-[#6366F1] flex items-center justify-center flex-shrink-0">
              <LayoutDashboard size={14} className="text-white" />
            </div>
            <span className="text-[15px] font-semibold text-[var(--color-text-primary)] truncate">Task Board</span>
          </div>
          <button
            onClick={onToggle}
            className="p-1 rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-border-subtle)] transition-colors flex-shrink-0 ml-2"
            title="Collapse sidebar"
          >
            <ChevronLeft size={15} />
          </button>
        </div>

        {/* Nav */}
        <nav className="px-3 py-3 border-b border-[var(--color-border-subtle)] flex-shrink-0">
          <button className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg bg-[#6366F1]/10 text-[#6366F1] text-[13px] font-medium whitespace-nowrap">
            <LayoutDashboard size={15} />
            Board
          </button>
        </nav>

        {/* Stats */}
        <div className="px-4 py-4 border-b border-[var(--color-border-subtle)] flex-shrink-0">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 size={13} className="text-[var(--color-text-muted)]" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] whitespace-nowrap">
              Overview
            </span>
          </div>
          <StatsWidget />
        </div>

        {/* Team members */}
        <div className="px-4 py-4 border-b border-[var(--color-border-subtle)] flex-shrink-0">
          <TeamMemberList />
        </div>

        {/* Labels */}
        <div className="px-4 py-4 flex-shrink-0">
          <LabelManager />
        </div>
      </div>
    </aside>
  )
}
