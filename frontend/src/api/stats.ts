import { supabase } from '@/lib/supabase'
import type { BoardStats } from '@/types'

export async function getStats(): Promise<BoardStats> {
  const { data, error } = await supabase
    .from('tasks')
    .select('status, priority, due_date')

  if (error) throw new Error(error.message)

  const tasks = data as Array<{ status: string; priority: string; due_date: string | null }>
  const todayStr = new Date().toISOString().slice(0, 10)

  const stats: BoardStats = {
    total: tasks.length,
    by_status: { todo: 0, in_progress: 0, in_review: 0, done: 0 },
    by_priority: { high: 0, normal: 0, low: 0 },
    overdue: 0,
    due_today: 0,
  }

  for (const t of tasks) {
    if (t.status in stats.by_status) {
      stats.by_status[t.status as keyof typeof stats.by_status]++
    }
    if (t.priority in stats.by_priority) {
      stats.by_priority[t.priority as keyof typeof stats.by_priority]++
    }
    if (t.due_date) {
      if (t.due_date < todayStr && t.status !== 'done') stats.overdue++
      if (t.due_date === todayStr) stats.due_today++
    }
  }

  return stats
}
