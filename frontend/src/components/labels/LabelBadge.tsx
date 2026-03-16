import React from 'react'
import { cn } from '@/lib/utils'
import type { Label } from '@/types'

interface LabelBadgeProps {
  label: Label
  onRemove?: () => void
  className?: string
}

export function LabelBadge({ label, onRemove, className }: LabelBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium',
        className,
      )}
      style={{
        backgroundColor: `${label.color}20`,
        color: label.color,
        borderColor: `${label.color}40`,
        border: '1px solid',
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: label.color }}
      />
      {label.name}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          className="ml-0.5 opacity-70 hover:opacity-100 transition-opacity"
          style={{ color: label.color }}
        >
          ×
        </button>
      )}
    </span>
  )
}
