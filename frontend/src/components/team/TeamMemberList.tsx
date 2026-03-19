import React, { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { AvatarBadge } from './AvatarBadge'
import { TeamMemberForm } from './TeamMemberForm'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { useTeamMembers } from '@/hooks/useTeamMembers'
import { useToast } from '@/components/ui/Toast'
import type { TeamMember } from '@/types'

export function TeamMemberList() {
  const { teamMembers, isLoading, createTeamMember, deleteTeamMember } = useTeamMembers()
  const { showError, showSuccess } = useToast()
  const [isFormOpen, setIsFormOpen] = useState(false)

  const handleCreate = async (name: string, color: string) => {
    try {
      await createTeamMember({ name, color })
      showSuccess(`${name} added to the team`)
      setIsFormOpen(false)
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to add team member')
    }
  }

  const handleDelete = async (member: TeamMember) => {
    try {
      await deleteTeamMember(member.id)
      showSuccess(`${member.name} removed`)
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to remove team member')
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
          Team
        </span>
        <button
          onClick={() => setIsFormOpen(true)}
          className="p-1 rounded text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-border-subtle)] transition-colors"
          title="Add team member"
        >
          <Plus size={14} />
        </button>
      </div>

      {isLoading ? (
        <div className="flex gap-1.5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-8 h-8 rounded-full bg-[var(--color-border-subtle)] animate-pulse" />
          ))}
        </div>
      ) : teamMembers.length === 0 ? (
        <p className="text-xs text-[var(--color-text-muted)]">No team members yet</p>
      ) : (
        <div className="space-y-1.5">
          {teamMembers.map((member) => (
            <div
              key={member.id}
              className="group flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-[var(--color-border-subtle)] transition-colors"
            >
              <AvatarBadge name={member.name} color={member.color} size="sm" />
              <span className="text-[13px] text-[var(--color-text-secondary)] flex-1 truncate">{member.name}</span>
              <button
                onClick={() => handleDelete(member)}
                className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-[var(--color-text-muted)] hover:text-[#EF4444] transition-all"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title="Add Team Member">
        <TeamMemberForm onSubmit={handleCreate} onCancel={() => setIsFormOpen(false)} />
      </Modal>
    </div>
  )
}
