import React, { useEffect, useState, useRef } from 'react'
import { Send, Trash2 } from 'lucide-react'
import * as commentsApi from '@/api/comments'
import { formatRelativeDate } from '@/lib/utils'
import { useToast } from '@/components/ui/Toast'
import { cn } from '@/lib/utils'
import type { Comment } from '@/types'

interface TaskCommentsProps {
  taskId: string
}

export function TaskComments({ taskId }: TaskCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [draft, setDraft] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { showError } = useToast()

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    commentsApi.getComments(taskId)
      .then((data) => { if (!cancelled) setComments(data) })
      .catch(() => { if (!cancelled) setComments([]) })
      .finally(() => { if (!cancelled) setIsLoading(false) })
    return () => { cancelled = true }
  }, [taskId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!draft.trim()) return

    setIsSubmitting(true)
    try {
      const comment = await commentsApi.createComment(taskId, { content: draft.trim() })
      setComments((prev) => [...prev, comment])
      setDraft('')
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to post comment')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (commentId: string) => {
    setComments((prev) => prev.filter((c) => c.id !== commentId))
    try {
      await commentsApi.deleteComment(taskId, commentId)
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to delete comment')
      // Refetch to restore state
      const data = await commentsApi.getComments(taskId)
      setComments(data)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit(e as unknown as React.FormEvent)
    }
  }

  return (
    <div className="space-y-4">
      {/* Comment list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="space-y-1.5 animate-pulse">
              <div className="h-3 bg-[var(--color-border-subtle)] rounded w-1/4" />
              <div className="h-12 bg-[var(--color-border-subtle)] rounded" />
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <p className="text-xs text-[var(--color-text-muted)] py-1">No comments yet. Be the first to comment.</p>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <div key={comment.id} className="group space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--color-text-muted)]">
                  {formatRelativeDate(comment.created_at)}
                </span>
                <button
                  onClick={() => handleDelete(comment.id)}
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-[var(--color-text-muted)] hover:text-[#EF4444] transition-all"
                >
                  <Trash2 size={12} />
                </button>
              </div>
              <div className="px-3 py-2.5 rounded-lg bg-[var(--color-border-subtle)] text-sm text-[var(--color-text-secondary)] leading-relaxed">
                {comment.content}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="space-y-2">
        <textarea
          ref={textareaRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Write a comment... (Cmd+Enter to submit)"
          rows={3}
          className={cn(
            'w-full px-3 py-2.5 rounded-lg text-sm resize-none',
            'bg-[var(--color-border-subtle)] border border-[var(--color-border-hover)]',
            'text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]',
            'focus:outline-none focus:ring-2 focus:ring-[#6366F1]/50 focus:border-[#6366F1]',
            'transition-colors duration-150',
          )}
        />
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!draft.trim() || isSubmitting}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium',
              'bg-[#6366F1] text-white',
              'hover:bg-[#4F46E5] disabled:opacity-40 disabled:cursor-not-allowed',
              'transition-colors duration-150',
            )}
          >
            {isSubmitting ? (
              <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send size={12} />
            )}
            Comment
          </button>
        </div>
      </form>
    </div>
  )
}
