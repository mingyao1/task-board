import React, { useState } from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { Board } from '@/components/board/Board'
import type { TaskFilters } from '@/types'

export function AppShell() {
  const [filters, setFilters] = useState<TaskFilters>({})

  return (
    <div className="min-h-screen bg-[#0F0F10]">
      <Sidebar />

      {/* Main content — offset by sidebar width */}
      <div className="ml-[240px] flex flex-col min-h-screen">
        <Header filters={filters} onFiltersChange={setFilters} />

        <main className="flex-1 overflow-hidden">
          <Board filters={filters} />
        </main>
      </div>
    </div>
  )
}
