import React from 'react'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function SearchBar({
  value,
  onChange,
  placeholder = 'Search tasks...',
  className,
}: SearchBarProps) {
  return (
    <div className={cn('relative', className)}>
      <Search
        size={14}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-[#71717A] pointer-events-none"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          'w-full pl-9 pr-8 py-2 rounded-md text-sm',
          'bg-[#18181B] border border-[#27272A] hover:border-[#3F3F46]',
          'text-[#FAFAFA] placeholder:text-[#71717A]',
          'transition-colors duration-150',
          'focus:outline-none focus:ring-2 focus:ring-[#6366F1]/50 focus:border-[#6366F1]',
        )}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#71717A] hover:text-[#FAFAFA] transition-colors"
        >
          <X size={14} />
        </button>
      )}
    </div>
  )
}
