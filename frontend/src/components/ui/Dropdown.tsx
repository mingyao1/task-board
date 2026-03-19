import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface DropdownOption {
  value: string
  label: string
  icon?: React.ReactNode
  color?: string
}

interface DropdownProps {
  options: DropdownOption[]
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  triggerClassName?: string
  disabled?: boolean
}

export function Dropdown({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  className,
  triggerClassName,
  disabled = false,
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const selected = options.find((o) => o.value === value)

  // Close on outside click
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

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((v) => !v)}
        className={cn(
          'flex items-center gap-2 w-full px-3 py-2 rounded-md',
          'bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] hover:border-[var(--color-border-hover)]',
          'text-sm text-[var(--color-text-primary)] transition-colors duration-150',
          'focus:outline-none focus:ring-2 focus:ring-[#6366F1]/50',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          triggerClassName,
        )}
      >
        {selected?.icon && <span>{selected.icon}</span>}
        {selected?.color && (
          <span
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: selected.color }}
          />
        )}
        <span className={cn('flex-1 text-left truncate', !selected && 'text-[var(--color-text-muted)]')}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown
          size={14}
          className={cn('text-[var(--color-text-muted)] transition-transform', isOpen && 'rotate-180')}
        />
      </button>

      {isOpen && (
        <div
          className={cn(
            'absolute z-50 top-full left-0 mt-1 w-full min-w-[160px]',
            'rounded-md bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)]',
            'shadow-xl shadow-black/40 py-1',
          )}
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value)
                setIsOpen(false)
              }}
              className={cn(
                'flex items-center gap-2 w-full px-3 py-2 text-sm text-left',
                'transition-colors duration-150',
                value === option.value
                  ? 'bg-[#6366F1]/10 text-[#6366F1]'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-border-subtle)] hover:text-[var(--color-text-primary)]',
              )}
            >
              {option.icon && <span>{option.icon}</span>}
              {option.color && (
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: option.color }}
                />
              )}
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
