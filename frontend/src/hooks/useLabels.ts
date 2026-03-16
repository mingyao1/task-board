import { useState, useEffect, useCallback } from 'react'
import * as labelsApi from '@/api/labels'
import type { Label, CreateLabelInput, UpdateLabelInput } from '@/types'

interface UseLabelsReturn {
  labels: Label[]
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
  createLabel: (input: CreateLabelInput) => Promise<Label>
  updateLabel: (id: string, input: UpdateLabelInput) => Promise<Label>
  deleteLabel: (id: string) => Promise<void>
}

export function useLabels(): UseLabelsReturn {
  const [labels, setLabels] = useState<Label[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLabels = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await labelsApi.getLabels()
      setLabels(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch labels')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLabels()
  }, [fetchLabels])

  const createLabel = useCallback(async (input: CreateLabelInput): Promise<Label> => {
    const label = await labelsApi.createLabel(input)
    setLabels((prev) => [...prev, label])
    return label
  }, [])

  const updateLabel = useCallback(async (id: string, input: UpdateLabelInput): Promise<Label> => {
    const updated = await labelsApi.updateLabel(id, input)
    setLabels((prev) => prev.map((l) => (l.id === id ? updated : l)))
    return updated
  }, [])

  const deleteLabel = useCallback(async (id: string): Promise<void> => {
    setLabels((prev) => prev.filter((l) => l.id !== id))
    try {
      await labelsApi.deleteLabel(id)
    } catch (err) {
      await fetchLabels()
      throw err
    }
  }, [fetchLabels])

  return {
    labels,
    isLoading,
    error,
    refetch: fetchLabels,
    createLabel,
    updateLabel,
    deleteLabel,
  }
}
