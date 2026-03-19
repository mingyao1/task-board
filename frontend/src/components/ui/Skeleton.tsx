import React from 'react'
import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'rounded skeleton-shimmer',
        className,
      )}
    />
  )
}

export function TaskCardSkeleton() {
  return (
    <div className="bg-[var(--color-bg-card)] rounded-lg border border-[var(--color-border-subtle)] p-3 space-y-3">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-6 w-6 rounded-full" />
      </div>
    </div>
  )
}

export function ColumnSkeleton() {
  return (
    <div className="flex flex-col gap-2 min-w-[280px]">
      <div className="flex items-center gap-2 mb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-5 w-8 rounded-full" />
      </div>
      <TaskCardSkeleton />
      <TaskCardSkeleton />
      <TaskCardSkeleton />
    </div>
  )
}

export function BoardSkeleton() {
  return (
    <div className="flex gap-4 p-6 overflow-x-auto">
      <ColumnSkeleton />
      <ColumnSkeleton />
      <ColumnSkeleton />
      <ColumnSkeleton />
    </div>
  )
}
