import React from 'react'
import { Sun, Moon, PanelLeft } from 'lucide-react'
import { SearchBar } from '@/components/filters/SearchBar'
import { FilterBar } from '@/components/filters/FilterBar'
import { useTheme } from '@/context/ThemeContext'
import type { TaskFilters } from '@/types'

interface HeaderProps {
  filters: TaskFilters
  onFiltersChange: (filters: TaskFilters) => void
  sidebarOpen: boolean
  onToggleSidebar: () => void
}

export function Header({ filters, onFiltersChange, sidebarOpen, onToggleSidebar }: HeaderProps) {
  const { theme, toggleTheme } = useTheme()

  const handleSearchChange = (search: string) => {
    onFiltersChange({ ...filters, search: search || undefined })
  }

  return (
    <header className="sticky top-0 z-30 bg-[var(--color-bg-base)] backdrop-blur-sm border-b border-[var(--color-border-subtle)]">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-2">
            {!sidebarOpen && (
              <button
                onClick={onToggleSidebar}
                className="p-1.5 rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-border-subtle)] transition-colors"
                title="Open sidebar"
              >
                <PanelLeft size={16} />
              </button>
            )}
            <h1 className="text-[20px] font-semibold text-[var(--color-text-primary)] tracking-tight">
              My Board
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <SearchBar
              value={filters.search ?? ''}
              onChange={handleSearchChange}
              className="w-64"
            />
            <button
              onClick={toggleTheme}
              className="p-2 rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-border-subtle)] transition-colors"
              title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </div>

        <FilterBar filters={filters} onChange={onFiltersChange} />
      </div>
    </header>
  )
}
