import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { getStats } from '@/api/stats'
import type { BoardStats } from '@/types'

interface BoardStatsContextValue {
  stats: BoardStats | null
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

const BoardStatsContext = createContext<BoardStatsContextValue | null>(null)

export function BoardStatsProvider({ children }: { children: React.ReactNode }) {
  const [stats, setStats] = useState<BoardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await getStats()
      setStats(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch stats')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return (
    <BoardStatsContext.Provider value={{ stats, isLoading, error, refetch: fetchStats }}>
      {children}
    </BoardStatsContext.Provider>
  )
}

export function useBoardStats(): BoardStatsContextValue {
  const ctx = useContext(BoardStatsContext)
  if (!ctx) throw new Error('useBoardStats must be used within BoardStatsProvider')
  return ctx
}
