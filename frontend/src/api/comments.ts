import { get, post, del } from './client'
import type { Comment, CreateCommentInput } from '@/types'

export async function getComments(taskId: string): Promise<Comment[]> {
  const data = await get<{ comments: Comment[] }>(`/tasks/${taskId}/comments`)
  return data.comments ?? []
}

export async function createComment(
  taskId: string,
  input: CreateCommentInput,
): Promise<Comment> {
  const data = await post<{ comment: Comment }>(`/tasks/${taskId}/comments`, input)
  return data.comment
}

export async function deleteComment(taskId: string, commentId: string): Promise<void> {
  await del(`/tasks/${taskId}/comments/${commentId}`)
}
