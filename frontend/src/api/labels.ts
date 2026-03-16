import { get, post, patch, del } from './client'
import type { Label, CreateLabelInput, UpdateLabelInput } from '@/types'

export async function getLabels(): Promise<Label[]> {
  const data = await get<{ labels: Label[] }>('/labels')
  return data.labels ?? []
}

export async function createLabel(input: CreateLabelInput): Promise<Label> {
  const data = await post<{ label: Label }>('/labels', input)
  return data.label
}

export async function updateLabel(id: string, input: UpdateLabelInput): Promise<Label> {
  const data = await patch<{ label: Label }>(`/labels/${id}`, input)
  return data.label
}

export async function deleteLabel(id: string): Promise<void> {
  await del(`/labels/${id}`)
}
