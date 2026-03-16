import { useState, useEffect, useCallback } from 'react'
import { getStats } from '@/api/stats'
import type { BoardStats } from '@/types'

interface UseBoardStatsReturn {
  stats: BoardStats | null
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useBoardStats(): UseBoardStatsReturn {
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

  return { stats, isLoading, error, refetch: fetchStats }
}
