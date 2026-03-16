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
        'border border-dashed border-[#27272A] hover:border-[#3F3F46]',
        'text-[#71717A] hover:text-[#A1A1AA]',
        'transition-all duration-150',
        'hover:bg-[#27272A]/30',
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
