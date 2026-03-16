import React from 'react'
import { SearchBar } from '@/components/filters/SearchBar'
import { FilterBar } from '@/components/filters/FilterBar'
import type { TaskFilters } from '@/types'

interface HeaderProps {
  filters: TaskFilters
  onFiltersChange: (filters: TaskFilters) => void
}

export function Header({ filters, onFiltersChange }: HeaderProps) {
  const handleSearchChange = (search: string) => {
    onFiltersChange({ ...filters, search: search || undefined })
  }

  return (
    <header className="sticky top-0 z-30 bg-[#0F0F10]/95 backdrop-blur-sm border-b border-[#27272A]">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between gap-4 mb-3">
          <h1 className="text-[20px] font-semibold text-[#FAFAFA] tracking-tight">
            My Board
          </h1>

          <SearchBar
            value={filters.search ?? ''}
            onChange={handleSearchChange}
            className="w-64"
          />
        </div>

        <FilterBar filters={filters} onChange={onFiltersChange} />
      </div>
    </header>
  )
}
