import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import * as teamMembersApi from '@/api/teamMembers'
import type { TeamMember, CreateTeamMemberInput, UpdateTeamMemberInput } from '@/types'

interface TeamMembersContextValue {
  teamMembers: TeamMember[]
  isLoading: boolean
  error: string | null
  lastDeletedMemberId: string | null
  refetch: () => Promise<void>
  createTeamMember: (input: CreateTeamMemberInput) => Promise<TeamMember>
  updateTeamMember: (id: string, input: UpdateTeamMemberInput) => Promise<TeamMember>
  deleteTeamMember: (id: string) => Promise<void>
}

const TeamMembersContext = createContext<TeamMembersContextValue | null>(null)

export function TeamMembersProvider({ children }: { children: React.ReactNode }) {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastDeletedMemberId, setLastDeletedMemberId] = useState<string | null>(null)

  const fetchTeamMembers = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await teamMembersApi.getTeamMembers()
      setTeamMembers(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch team members')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTeamMembers()
  }, [fetchTeamMembers])

  const createTeamMember = useCallback(async (input: CreateTeamMemberInput): Promise<TeamMember> => {
    const member = await teamMembersApi.createTeamMember(input)
    setTeamMembers((prev) => [...prev, member])
    return member
  }, [])

  const updateTeamMember = useCallback(async (id: string, input: UpdateTeamMemberInput): Promise<TeamMember> => {
    const updated = await teamMembersApi.updateTeamMember(id, input)
    setTeamMembers((prev) => prev.map((m) => (m.id === id ? updated : m)))
    return updated
  }, [])

  const deleteTeamMember = useCallback(async (id: string): Promise<void> => {
    setTeamMembers((prev) => prev.filter((m) => m.id !== id))
    try {
      await teamMembersApi.deleteTeamMember(id)
      setLastDeletedMemberId(id)
    } catch (err) {
      await fetchTeamMembers()
      throw err
    }
  }, [fetchTeamMembers])

  return (
    <TeamMembersContext.Provider
      value={{ teamMembers, isLoading, error, lastDeletedMemberId, refetch: fetchTeamMembers, createTeamMember, updateTeamMember, deleteTeamMember }}
    >
      {children}
    </TeamMembersContext.Provider>
  )
}

export function useTeamMembers(): TeamMembersContextValue {
  const ctx = useContext(TeamMembersContext)
  if (!ctx) throw new Error('useTeamMembers must be used within TeamMembersProvider')
  return ctx
}
