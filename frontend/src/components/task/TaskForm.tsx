import React, { useState } from 'react'
import { Input, Textarea } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Dropdown } from '@/components/ui/Dropdown'
import { LabelPicker } from '@/components/labels/LabelPicker'
import { useTeamMembers } from '@/hooks/useTeamMembers'
import type { Task, TaskStatus, TaskPriority, CreateTaskInput, UpdateTaskInput } from '@/types'

const STATUS_OPTIONS = [
  { value: 'todo', label: 'To Do', color: '#A1A1AA' },
  { value: 'in_progress', label: 'In Progress', color: '#3B82F6' },
  { value: 'in_review', label: 'In Review', color: '#F59E0B' },
  { value: 'done', label: 'Done', color: '#10B981' },
]

const PRIORITY_OPTIONS = [
  { value: 'high', label: 'High', color: '#EF4444' },
  { value: 'normal', label: 'Normal', color: '#F59E0B' },
  { value: 'low', label: 'Low', color: '#6B7280' },
]

interface TaskFormProps {
  task?: Task
  defaultStatus?: TaskStatus
  onSubmit: (data: CreateTaskInput | UpdateTaskInput) => Promise<void>
  onCancel: () => void
}

export function TaskForm({ task, defaultStatus = 'todo', onSubmit, onCancel }: TaskFormProps) {
  const { teamMembers } = useTeamMembers()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [title, setTitle] = useState(task?.title ?? '')
  const [description, setDescription] = useState(task?.description ?? '')
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? defaultStatus)
  const [priority, setPriority] = useState<TaskPriority>(task?.priority ?? 'normal')
  const [dueDate, setDueDate] = useState(task?.due_date?.split('T')[0] ?? '')
  const [assigneeId, setAssigneeId] = useState(task?.assignee_id ?? '')
  const [labelIds, setLabelIds] = useState<string[]>(task?.label_ids ?? [])
  const [errors, setErrors] = useState<Record<string, string>>({})

  const assigneeOptions = [
    { value: '', label: 'Unassigned' },
    ...teamMembers.map((m) => ({ value: m.id, label: m.name, color: m.color })),
  ]

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!title.trim()) newErrors.title = 'Title is required'
    if (title.trim().length > 255) newErrors.title = 'Title must be under 255 characters'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setIsSubmitting(true)
    try {
      const data: CreateTaskInput | UpdateTaskInput = {
        title: title.trim(),
        description: description.trim() || (task ? null : undefined),
        status,
        priority,
        due_date: dueDate || null,
        assignee_id: assigneeId || null,
        label_ids: labelIds,
      }
      await onSubmit(data)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Title"
        value={title}
        onChange={(e) => {
          setTitle(e.target.value)
          if (errors.title) setErrors((prev) => ({ ...prev, title: '' }))
        }}
        placeholder="Task title"
        error={errors.title}
        autoFocus
      />

      <Textarea
        label="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Optional description..."
        rows={3}
      />

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-[13px] font-medium text-[#A1A1AA]">Status</label>
          <Dropdown
            options={STATUS_OPTIONS}
            value={status}
            onChange={(v) => setStatus(v as TaskStatus)}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[13px] font-medium text-[#A1A1AA]">Priority</label>
          <Dropdown
            options={PRIORITY_OPTIONS}
            value={priority}
            onChange={(v) => setPriority(v as TaskPriority)}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-[13px] font-medium text-[#A1A1AA]">Due Date</label>
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="w-full px-3 py-2 rounded-md text-sm bg-[#18181B] border border-[#27272A] text-[#FAFAFA] focus:outline-none focus:ring-2 focus:ring-[#6366F1]/50 focus:border-[#6366F1] transition-colors [color-scheme:dark]"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-[13px] font-medium text-[#A1A1AA]">Assignee</label>
        <Dropdown
          options={assigneeOptions}
          value={assigneeId}
          onChange={setAssigneeId}
          placeholder="Unassigned"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-[13px] font-medium text-[#A1A1AA]">Labels</label>
        <LabelPicker selectedIds={labelIds} onChange={setLabelIds} />
      </div>

      <div className="flex gap-2 pt-2 border-t border-[#27272A]">
        <Button type="submit" isLoading={isSubmitting} className="flex-1">
          {task ? 'Save Changes' : 'Create Task'}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
