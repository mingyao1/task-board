import { supabase } from '@/lib/supabase'
import type { ActivityLog } from '@/types'

interface RawActivityLog {
  id: string
  task_id: string
  user_id: string
  action: string
  details: Record<string, string> | null
  created_at: string
}

function mapLog(raw: RawActivityLog): ActivityLog {
  return {
    id: raw.id,
    task_id: raw.task_id,
    user_id: raw.user_id,
    action: raw.action as ActivityLog['action'],
    old_value: raw.details?.old_value ?? null,
    new_value: raw.details?.new_value ?? null,
    created_at: raw.created_at,
  }
}

export async function getActivity(taskId: string): Promise<ActivityLog[]> {
  const { data, error } = await supabase
    .from('activity_logs')
    .select('*')
    .eq('task_id', taskId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data as RawActivityLog[]).map(mapLog)
}

export async function logActivity(
  taskId: string,
  userId: string,
  action: string,
  details: Record<string, string>,
): Promise<void> {
  await supabase
    .from('activity_logs')
    .insert({ task_id: taskId, user_id: userId, action, details })
}
