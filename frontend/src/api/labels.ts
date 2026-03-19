import { supabase } from '@/lib/supabase'
import type { Label, CreateLabelInput, UpdateLabelInput } from '@/types'

interface RawLabel {
  id: string
  user_id: string
  name: string
  color: string
  created_at: string
}

function mapLabel(raw: RawLabel): Label {
  return { ...raw, updated_at: raw.created_at }
}

async function getUserId(): Promise<string> {
  const { data } = await supabase.auth.getUser()
  if (!data.user) throw new Error('Not authenticated')
  return data.user.id
}

export async function getLabels(): Promise<Label[]> {
  const { data, error } = await supabase
    .from('labels')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) throw new Error(error.message)
  return (data as RawLabel[]).map(mapLabel)
}

export async function createLabel(input: CreateLabelInput): Promise<Label> {
  const userId = await getUserId()
  const { data, error } = await supabase
    .from('labels')
    .insert({ name: input.name, color: input.color || '#6366F1', user_id: userId })
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  return mapLabel(data as RawLabel)
}

export async function updateLabel(id: string, input: UpdateLabelInput): Promise<Label> {
  const update: Record<string, unknown> = {}
  if (input.name !== undefined) update.name = input.name
  if (input.color !== undefined) update.color = input.color

  const { data, error } = await supabase
    .from('labels')
    .update(update)
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  return mapLabel(data as RawLabel)
}

export async function deleteLabel(id: string): Promise<void> {
  const { error } = await supabase.from('labels').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
