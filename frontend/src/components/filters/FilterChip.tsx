import React from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FilterChipProps {
  label: string
  onRemove: () => void
  className?: string
}

export function FilterChip({ label, onRemove, className }: FilterChipProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium',
        'bg-[#6366F1]/10 text-[#6366F1] border border-[#6366F1]/20',
        className,
      )}
    >
      {label}
      <button
        onClick={onRemove}
        className="flex-shrink-0 hover:text-white transition-colors ml-0.5"
      >
        <X size={11} />
      </button>
    </span>
  )
}
