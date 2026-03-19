import React, { useState } from 'react'
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react'
import { useLabels } from '@/hooks/useLabels'
import { useToast } from '@/components/ui/Toast'
import type { Label } from '@/types'
import { cn } from '@/lib/utils'

const PRESET_COLORS = [
  '#6366F1', '#8B5CF6', '#EC4899', '#EF4444',
  '#F59E0B', '#10B981', '#3B82F6', '#06B6D4',
]

export function LabelManager() {
  const { labels, isLoading, createLabel, updateLabel, deleteLabel } = useLabels()
  const { showError, showSuccess } = useToast()
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(PRESET_COLORS[0])
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('')

  const handleAdd = async () => {
    if (!newName.trim()) return
    try {
      await createLabel({ name: newName.trim(), color: newColor })
      showSuccess('Label created')
      setNewName('')
      setNewColor(PRESET_COLORS[0])
      setIsAdding(false)
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to create label')
    }
  }

  const startEdit = (label: Label) => {
    setEditingId(label.id)
    setEditName(label.name)
    setEditColor(label.color)
  }

  const handleUpdate = async (id: string) => {
    if (!editName.trim()) return
    try {
      await updateLabel(id, { name: editName.trim(), color: editColor })
      showSuccess('Label updated')
      setEditingId(null)
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to update label')
    }
  }

  const handleDelete = async (label: Label) => {
    try {
      await deleteLabel(label.id)
      showSuccess('Label deleted')
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to delete label')
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
          Labels
        </span>
        <button
          onClick={() => setIsAdding(true)}
          className="p-1 rounded text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-border-subtle)] transition-colors"
        >
          <Plus size={14} />
        </button>
      </div>

      {isAdding && (
        <div className="space-y-2 p-2 rounded-lg bg-[var(--color-border-subtle)]">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Label name"
            className="w-full px-2 py-1.5 text-sm bg-[var(--color-bg-card)] border border-[var(--color-border-hover)] rounded-md text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-1 focus:ring-[#6366F1]"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAdd()
              if (e.key === 'Escape') setIsAdding(false)
            }}
          />
          <div className="flex flex-wrap gap-1.5">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setNewColor(c)}
                className={cn(
                  'w-5 h-5 rounded-full',
                  newColor === c && 'ring-2 ring-offset-1 ring-offset-[var(--color-border-subtle)] ring-white',
                )}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <div className="flex gap-1">
            <button onClick={handleAdd} className="p-1 rounded text-[#10B981] hover:bg-[#10B981]/10">
              <Check size={14} />
            </button>
            <button onClick={() => setIsAdding(false)} className="p-1 rounded text-[var(--color-text-muted)] hover:bg-[var(--color-border-hover)]">
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-1.5">
          {[1, 2].map((i) => (
            <div key={i} className="h-7 rounded-md bg-[var(--color-border-subtle)] animate-pulse" />
          ))}
        </div>
      ) : labels.length === 0 && !isAdding ? (
        <p className="text-xs text-[var(--color-text-muted)]">No labels yet</p>
      ) : (
        <div className="space-y-1">
          {labels.map((label: Label) => (
            <div key={label.id} className="group flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-[var(--color-border-subtle)] transition-colors">
              {editingId === label.id ? (
                <>
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: editColor }} />
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1 text-xs bg-transparent text-[var(--color-text-primary)] focus:outline-none border-b border-[#6366F1]"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleUpdate(label.id)
                      if (e.key === 'Escape') setEditingId(null)
                    }}
                  />
                  <button onClick={() => handleUpdate(label.id)} className="p-0.5 text-[#10B981]">
                    <Check size={12} />
                  </button>
                  <button onClick={() => setEditingId(null)} className="p-0.5 text-[var(--color-text-muted)]">
                    <X size={12} />
                  </button>
                </>
              ) : (
                <>
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: label.color }}
                  />
                  <span className="flex-1 text-[13px] text-[var(--color-text-secondary)] truncate">{label.name}</span>
                  <div className="opacity-0 group-hover:opacity-100 flex gap-0.5 transition-opacity">
                    <button onClick={() => startEdit(label)} className="p-0.5 rounded text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
                      <Pencil size={12} />
                    </button>
                    <button onClick={() => handleDelete(label)} className="p-0.5 rounded text-[var(--color-text-muted)] hover:text-[#EF4444]">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
