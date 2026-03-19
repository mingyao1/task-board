import React, { useState } from 'react'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NewTaskButtonProps {
  onClick: () => void
  className?: string
}

export function NewTaskButton({ onClick, className }: NewTaskButtonProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        'flex items-center gap-2 w-full px-3 py-2 rounded-lg text-[13px]',
        'border border-dashed border-[var(--color-border-subtle)] hover:border-[var(--color-border-hover)]',
        'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]',
        'transition-all duration-150',
        'hover:bg-[var(--color-border-subtle)]/30',
        className,
      )}
    >
      <Plus
        size={14}
        className={cn('transition-transform duration-150', isHovered && 'scale-110')}
      />
      Add task
    </button>
  )
}
