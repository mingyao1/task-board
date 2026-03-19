import React, { useState, useRef, useEffect } from 'react'
import { Tag, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLabels } from '@/hooks/useLabels'
import type { Label } from '@/types'

interface LabelPickerProps {
  selectedIds: string[]
  onChange: (ids: string[]) => void
  className?: string
}

export function LabelPicker({ selectedIds, onChange, className }: LabelPickerProps) {
  const { labels } = useLabels()
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [isOpen])

  const toggle = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((x) => x !== id))
    } else {
      onChange([...selectedIds, id])
    }
  }

  const selectedLabels = labels.filter((l) => selectedIds.includes(l.id))

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className={cn(
          'flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm',
          'bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] hover:border-[var(--color-border-hover)]',
          'text-left transition-colors duration-150',
          'focus:outline-none focus:ring-2 focus:ring-[#6366F1]/50',
        )}
      >
        <Tag size={14} className="text-[var(--color-text-muted)] flex-shrink-0" />
        {selectedLabels.length === 0 ? (
          <span className="text-[var(--color-text-muted)]">Add labels...</span>
        ) : (
          <div className="flex flex-wrap gap-1">
            {selectedLabels.map((label) => (
              <span
                key={label.id}
                className="px-1.5 py-0.5 rounded-full text-[11px] font-medium"
                style={{
                  backgroundColor: `${label.color}20`,
                  color: label.color,
                }}
              >
                {label.name}
              </span>
            ))}
          </div>
        )}
      </button>

      {isOpen && (
        <div className="absolute z-50 top-full left-0 mt-1 w-full min-w-[200px] rounded-md bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] shadow-xl shadow-black/40 py-1">
          {labels.length === 0 ? (
            <p className="px-3 py-2 text-xs text-[var(--color-text-muted)]">No labels created yet</p>
          ) : (
            labels.map((label: Label) => (
              <button
                key={label.id}
                type="button"
                onClick={() => toggle(label.id)}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-[var(--color-border-subtle)] transition-colors"
              >
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: label.color }}
                />
                <span className="flex-1 text-[var(--color-text-secondary)]">{label.name}</span>
                {selectedIds.includes(label.id) && (
                  <Check size={12} className="text-[#6366F1]" />
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
