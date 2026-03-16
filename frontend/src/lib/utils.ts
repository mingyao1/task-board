import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import {
  format,
  formatDistanceToNow,
  isToday,
  isTomorrow,
  isYesterday,
  parseISO,
} from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return ''
  try {
    const date = parseISO(dateString)
    return format(date, 'MMM d, yyyy')
  } catch {
    return ''
  }
}

export function formatRelativeDate(dateString: string | null | undefined): string {
  if (!dateString) return ''
  try {
    const date = parseISO(dateString)
    if (isToday(date)) return 'Today'
    if (isTomorrow(date)) return 'Tomorrow'
    if (isYesterday(date)) return 'Yesterday'
    return formatDistanceToNow(date, { addSuffix: true })
  } catch {
    return ''
  }
}

export function formatShortDate(dateString: string | null | undefined): string {
  if (!dateString) return ''
  try {
    const date = parseISO(dateString)
    if (isToday(date)) return 'Today'
    if (isTomorrow(date)) return 'Tomorrow'
    return format(date, 'MMM d')
  } catch {
    return ''
  }
}

export type DueDateUrgency = 'overdue' | 'today' | 'soon' | 'normal' | null

export function getDueDateUrgency(dateString: string | null | undefined): DueDateUrgency {
  if (!dateString) return null
  try {
    const date = parseISO(dateString)
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const target = new Date(date)
    target.setHours(0, 0, 0, 0)
    const diffDays = Math.floor((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return 'overdue'
    if (diffDays === 0) return 'today'
    if (diffDays <= 3) return 'soon'
    return 'normal'
  } catch {
    return null
  }
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}
