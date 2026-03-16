import { get, post, patch, del } from './client'
import type { TeamMember, CreateTeamMemberInput, UpdateTeamMemberInput } from '@/types'

export async function getTeamMembers(): Promise<TeamMember[]> {
  const data = await get<{ team_members: TeamMember[] }>('/team-members')
  return data.team_members ?? []
}

export async function createTeamMember(input: CreateTeamMemberInput): Promise<TeamMember> {
  const data = await post<{ team_member: TeamMember }>('/team-members', input)
  return data.team_member
}

export async function updateTeamMember(
  id: string,
  input: UpdateTeamMemberInput,
): Promise<TeamMember> {
  const data = await patch<{ team_member: TeamMember }>(`/team-members/${id}`, input)
  return data.team_member
}

export async function deleteTeamMember(id: string): Promise<void> {
  await del(`/team-members/${id}`)
}
