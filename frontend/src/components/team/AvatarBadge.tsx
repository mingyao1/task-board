import React from 'react'
import { cn } from '@/lib/utils'
import { getInitials } from '@/lib/utils'

type AvatarSize = 'sm' | 'md' | 'lg'

interface AvatarBadgeProps {
  name: string
  color: string
  size?: AvatarSize
  className?: string
  title?: string
}

const sizeClasses: Record<AvatarSize, string> = {
  sm: 'w-6 h-6 text-[10px]',
  md: 'w-8 h-8 text-xs',
  lg: 'w-10 h-10 text-sm',
}

export function AvatarBadge({ name, color, size = 'md', className, title }: AvatarBadgeProps) {
  return (
    <div
      title={title ?? name}
      className={cn(
        'rounded-full flex items-center justify-center font-semibold flex-shrink-0',
        'ring-2 ring-[#0F0F10]',
        sizeClasses[size],
        className,
      )}
      style={{ backgroundColor: color }}
    >
      <span className="text-white select-none">{getInitials(name)}</span>
    </div>
  )
}
