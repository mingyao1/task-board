import React, { useState } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

const PRESET_COLORS = [
  '#6366F1', '#8B5CF6', '#EC4899', '#EF4444',
  '#F59E0B', '#10B981', '#3B82F6', '#06B6D4',
  '#84CC16', '#F97316',
]

interface TeamMemberFormProps {
  onSubmit: (name: string, color: string) => Promise<void>
  onCancel: () => void
  initialName?: string
  initialColor?: string
}

export function TeamMemberForm({
  onSubmit,
  onCancel,
  initialName = '',
  initialColor = PRESET_COLORS[0],
}: TeamMemberFormProps) {
  const [name, setName] = useState(initialName)
  const [color, setColor] = useState(initialColor)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Name is required')
      return
    }
    setIsSubmitting(true)
    try {
      await onSubmit(name.trim(), color)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Name"
        value={name}
        onChange={(e) => {
          setName(e.target.value)
          setError('')
        }}
        placeholder="e.g. Jane Smith"
        error={error}
        autoFocus
      />

      <div className="space-y-1.5">
        <label className="text-[13px] font-medium text-[#A1A1AA]">Color</label>
        <div className="flex flex-wrap gap-2">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={cn(
                'w-7 h-7 rounded-full transition-transform',
                color === c && 'ring-2 ring-offset-2 ring-offset-[#18181B] ring-white scale-110',
              )}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="submit" isLoading={isSubmitting} className="flex-1">
          Save
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
