import { supabase } from '@/lib/supabase'
import { logActivity } from './activity'
import type { Comment, CreateCommentInput } from '@/types'

async function getUserId(): Promise<string> {
  const { data } = await supabase.auth.getUser()
  if (!data.user) throw new Error('Not authenticated')
  return data.user.id
}

export async function getComments(taskId: string): Promise<Comment[]> {
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('task_id', taskId)
    .order('created_at', { ascending: true })
  if (error) throw new Error(error.message)
  return (data as Comment[]).map((c) => ({ ...c, updated_at: c.updated_at ?? c.created_at }))
}

export async function createComment(
  taskId: string,
  input: CreateCommentInput,
): Promise<Comment> {
  const userId = await getUserId()

  const { data, error } = await supabase
    .from('comments')
    .insert({ task_id: taskId, user_id: userId, content: input.content })
    .select('*')
    .single()
  if (error) throw new Error(error.message)

  await logActivity(taskId, userId, 'comment_added', {})

  return data as Comment
}

export async function deleteComment(taskId: string, commentId: string): Promise<void> {
  const userId = await getUserId()

  const { error } = await supabase.from('comments').delete().eq('id', commentId)
  if (error) throw new Error(error.message)

  await logActivity(taskId, userId, 'comment_deleted', {})
}
