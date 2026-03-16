import { get } from './client'
import type { BoardStats } from '@/types'

export async function getStats(): Promise<BoardStats> {
  const data = await get<{ stats: BoardStats }>('/stats')
  return data.stats
}
