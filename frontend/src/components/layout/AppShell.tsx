import React, { useState, useCallback, useRef } from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { Board } from '@/components/board/Board'
import { TeamMembersProvider } from '@/context/TeamMembersContext'
import { LabelsProvider } from '@/context/LabelsContext'
import { BoardStatsProvider } from '@/context/BoardStatsContext'
import { ThemeProvider } from '@/context/ThemeContext'
import type { TaskFilters } from '@/types'

const SIDEBAR_MIN = 160
const SIDEBAR_MAX = 480
const SIDEBAR_DEFAULT = 240

export function AppShell() {
  const [filters, setFilters] = useState<TaskFilters>({})
  const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_DEFAULT)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const isResizing = useRef(false)

  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      isResizing.current = true
      const startX = e.clientX
      const startWidth = sidebarWidth

      const onMouseMove = (e: MouseEvent) => {
        if (!isResizing.current) return
        const newWidth = Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, startWidth + e.clientX - startX))
        setSidebarWidth(newWidth)
      }

      const onMouseUp = () => {
        isResizing.current = false
        document.removeEventListener('mousemove', onMouseMove)
        document.removeEventListener('mouseup', onMouseUp)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }

      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
      document.addEventListener('mousemove', onMouseMove)
      document.addEventListener('mouseup', onMouseUp)
    },
    [sidebarWidth],
  )

  const effectiveMargin = sidebarOpen ? sidebarWidth : 0

  return (
    <ThemeProvider>
      <TeamMembersProvider>
        <LabelsProvider>
          <BoardStatsProvider>
            <div className="min-h-screen bg-[var(--color-bg-base)]">
              <Sidebar
                width={sidebarWidth}
                isOpen={sidebarOpen}
                onToggle={() => setSidebarOpen((v) => !v)}
                onResizeStart={handleResizeStart}
              />

              {/* Main content — offset by sidebar width */}
              <div
                className="flex flex-col min-h-screen transition-[margin] duration-200 ease-out"
                style={{ marginLeft: effectiveMargin }}
              >
                <Header
                  filters={filters}
                  onFiltersChange={setFilters}
                  sidebarOpen={sidebarOpen}
                  onToggleSidebar={() => setSidebarOpen((v) => !v)}
                />

                <main className="flex-1 overflow-hidden">
                  <Board filters={filters} />
                </main>
              </div>
            </div>
          </BoardStatsProvider>
        </LabelsProvider>
      </TeamMembersProvider>
    </ThemeProvider>
  )
}
