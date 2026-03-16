import React from 'react'
import { SlidersHorizontal } from 'lucide-react'
import { Dropdown } from '@/components/ui/Dropdown'
import { FilterChip } from './FilterChip'
import { useTeamMembers } from '@/hooks/useTeamMembers'
import { useLabels } from '@/hooks/useLabels'
import type { TaskFilters, TaskStatus, TaskPriority } from '@/types'
import { cn } from '@/lib/utils'

const STATUS_OPTIONS = [
  { value: 'todo', label: 'To Do', color: '#A1A1AA' },
  { value: 'in_progress', label: 'In Progress', color: '#3B82F6' },
  { value: 'in_review', label: 'In Review', color: '#F59E0B' },
  { value: 'done', label: 'Done', color: '#10B981' },
]

const PRIORITY_OPTIONS = [
  { value: 'high', label: 'High', color: '#EF4444' },
  { value: 'normal', label: 'Normal', color: '#F59E0B' },
  { value: 'low', label: 'Low', color: '#6B7280' },
]

interface FilterBarProps {
  filters: TaskFilters
  onChange: (filters: TaskFilters) => void
  className?: string
}

export function FilterBar({ filters, onChange, className }: FilterBarProps) {
  const { teamMembers } = useTeamMembers()
  const { labels } = useLabels()

  const assigneeOptions = [
    { value: '', label: 'Any assignee' },
    ...teamMembers.map((m) => ({ value: m.id, label: m.name, color: m.color })),
  ]

  const labelOptions = [
    { value: '', label: 'Any label' },
    ...labels.map((l) => ({ value: l.id, label: l.name, color: l.color })),
  ]

  const activeFiltersCount = [
    filters.status?.length,
    filters.priority?.length,
    filters.assignee_id,
    filters.label_id,
  ].filter(Boolean).length

  const clearAll = () => {
    onChange({
      ...filters,
      status: undefined,
      priority: undefined,
      assignee_id: undefined,
      label_id: undefined,
    })
  }

  return (
    <div className={cn('flex items-center gap-2 flex-wrap', className)}>
      <div className="flex items-center gap-1 text-[#71717A]">
        <SlidersHorizontal size={14} />
        <span className="text-xs font-medium">Filter:</span>
      </div>

      <Dropdown
        options={STATUS_OPTIONS}
        value={filters.status?.[0] ?? ''}
        onChange={(v) => onChange({ ...filters, status: v ? [v as TaskStatus] : undefined })}
        placeholder="Status"
        className="w-32"
        triggerClassName="py-1.5 text-xs"
      />

      <Dropdown
        options={PRIORITY_OPTIONS}
        value={filters.priority?.[0] ?? ''}
        onChange={(v) => onChange({ ...filters, priority: v ? [v as TaskPriority] : undefined })}
        placeholder="Priority"
        className="w-28"
        triggerClassName="py-1.5 text-xs"
      />

      <Dropdown
        options={assigneeOptions}
        value={filters.assignee_id ?? ''}
        onChange={(v) => onChange({ ...filters, assignee_id: v || undefined })}
        placeholder="Assignee"
        className="w-32"
        triggerClassName="py-1.5 text-xs"
      />

      <Dropdown
        options={labelOptions}
        value={filters.label_id ?? ''}
        onChange={(v) => onChange({ ...filters, label_id: v || undefined })}
        placeholder="Label"
        className="w-28"
        triggerClassName="py-1.5 text-xs"
      />

      {/* Active filter chips */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {filters.status?.map((s) => (
          <FilterChip
            key={s}
            label={STATUS_OPTIONS.find((o) => o.value === s)?.label ?? s}
            onRemove={() => onChange({ ...filters, status: filters.status?.filter((x) => x !== s) })}
          />
        ))}
        {filters.priority?.map((p) => (
          <FilterChip
            key={p}
            label={PRIORITY_OPTIONS.find((o) => o.value === p)?.label ?? p}
            onRemove={() => onChange({ ...filters, priority: filters.priority?.filter((x) => x !== p) })}
          />
        ))}
        {filters.assignee_id && (
          <FilterChip
            label={teamMembers.find((m) => m.id === filters.assignee_id)?.name ?? 'Assignee'}
            onRemove={() => onChange({ ...filters, assignee_id: undefined })}
          />
        )}
        {filters.label_id && (
          <FilterChip
            label={labels.find((l) => l.id === filters.label_id)?.name ?? 'Label'}
            onRemove={() => onChange({ ...filters, label_id: undefined })}
          />
        )}
      </div>

      {activeFiltersCount > 0 && (
        <button
          onClick={clearAll}
          className="text-xs text-[#71717A] hover:text-[#FAFAFA] transition-colors underline underline-offset-2"
        >
          Clear all
        </button>
      )}
    </div>
  )
}
