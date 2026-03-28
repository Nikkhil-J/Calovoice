import { useCallback, useState } from 'react'
import type { ParseResult, ParsedItem } from '../services/parser'

export type ResultEditorState = {
  result: ParseResult | null
}

export type ResultEditorActions = {
  setResult: (r: ParseResult | null) => void
  updateItem: (index: number, patch: Partial<ParsedItem>) => void
  removeItem: (index: number) => void
  addItem: () => void
  clear: () => void
}

/**
 * CRUD state for parsed items before the user confirms and saves.
 * Pure state management — no side effects.
 */
export function useResultEditor(): ResultEditorState & ResultEditorActions {
  const [result, setResult] = useState<ParseResult | null>(null)

  const updateItem = useCallback((index: number, patch: Partial<ParsedItem>) => {
    setResult((prev) => {
      if (!prev) return prev
      const items = prev.items.map((item, i) =>
        i === index ? { ...item, ...patch } : item,
      )
      return { ...prev, items }
    })
  }, [])

  const removeItem = useCallback((index: number) => {
    setResult((prev) => {
      if (!prev) return prev
      return { ...prev, items: prev.items.filter((_, i) => i !== index) }
    })
  }, [])

  const addItem = useCallback(() => {
    setResult((prev) => {
      if (!prev) return prev
      const blank: ParsedItem = { name: '', quantity: null, unit: null, calories: null }
      return { ...prev, items: [...prev.items, blank] }
    })
  }, [])

  const clear = useCallback(() => setResult(null), [])

  return { result, setResult, updateItem, removeItem, addItem, clear }
}
