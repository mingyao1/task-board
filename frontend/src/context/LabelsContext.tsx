import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import * as labelsApi from '@/api/labels'
import type { Label, CreateLabelInput, UpdateLabelInput } from '@/types'

interface LabelsContextValue {
  labels: Label[]
  isLoading: boolean
  error: string | null
  lastDeletedLabelId: string | null
  refetch: () => Promise<void>
  createLabel: (input: CreateLabelInput) => Promise<Label>
  updateLabel: (id: string, input: UpdateLabelInput) => Promise<Label>
  deleteLabel: (id: string) => Promise<void>
}

const LabelsContext = createContext<LabelsContextValue | null>(null)

export function LabelsProvider({ children }: { children: React.ReactNode }) {
  const [labels, setLabels] = useState<Label[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastDeletedLabelId, setLastDeletedLabelId] = useState<string | null>(null)

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
      setLastDeletedLabelId(id)
    } catch (err) {
      await fetchLabels()
      throw err
    }
  }, [fetchLabels])

  return (
    <LabelsContext.Provider
      value={{ labels, isLoading, error, lastDeletedLabelId, refetch: fetchLabels, createLabel, updateLabel, deleteLabel }}
    >
      {children}
    </LabelsContext.Provider>
  )
}

export function useLabels(): LabelsContextValue {
  const ctx = useContext(LabelsContext)
  if (!ctx) throw new Error('useLabels must be used within LabelsProvider')
  return ctx
}
