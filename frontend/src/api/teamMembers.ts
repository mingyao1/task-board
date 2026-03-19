import { supabase } from '@/lib/supabase'
import type { TeamMember, CreateTeamMemberInput, UpdateTeamMemberInput } from '@/types'

interface RawMember {
  id: string
  user_id: string
  name: string
  color: string
  created_at: string
}

function mapMember(raw: RawMember): TeamMember {
  return { ...raw, updated_at: raw.created_at }
}

async function getUserId(): Promise<string> {
  const { data } = await supabase.auth.getUser()
  if (!data.user) throw new Error('Not authenticated')
  return data.user.id
}

export async function getTeamMembers(): Promise<TeamMember[]> {
  const { data, error } = await supabase
    .from('team_members')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) throw new Error(error.message)
  return (data as RawMember[]).map(mapMember)
}

export async function createTeamMember(input: CreateTeamMemberInput): Promise<TeamMember> {
  const userId = await getUserId()
  const { data, error } = await supabase
    .from('team_members')
    .insert({ name: input.name, color: input.color || '#6366F1', user_id: userId })
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  return mapMember(data as RawMember)
}

export async function updateTeamMember(
  id: string,
  input: UpdateTeamMemberInput,
): Promise<TeamMember> {
  const update: Record<string, unknown> = {}
  if (input.name !== undefined) update.name = input.name
  if (input.color !== undefined) update.color = input.color

  const { data, error } = await supabase
    .from('team_members')
    .update(update)
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  return mapMember(data as RawMember)
}

export async function deleteTeamMember(id: string): Promise<void> {
  const { error } = await supabase.from('team_members').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
