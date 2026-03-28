import { useCallback, useRef, useState } from 'react'
import { llmParse } from '../services/llm'
import { parseTranscript, type ParseResult } from '../services/parser'
import { canUseFoodVoice, canUseBurnVoiceLLM } from '../utils/keys'

export type ParsePipelineState = {
  isProcessing: boolean
}

export type ParsePipelineActions = {
  /** Returns ParseResult on success, null on failure (caller should open manual form). */
  parse: (transcript: string, kind: 'food' | 'burn') => Promise<ParseResult | null>
  abort: () => void
}

/**
 * Food: LLM-only. Extracts items via OpenRouter, resolves calories from
 * local dict then CalorieNinjas. Returns null on any failure.
 *
 * Activity: LLM when available, local parser fallback.
 */
export function useParsePipeline(): ParsePipelineState & ParsePipelineActions {
  const [isProcessing, setIsProcessing] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const abort = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    setIsProcessing(false)
  }, [])

  const parse = useCallback(async (
    transcript: string,
    kind: 'food' | 'burn',
  ): Promise<ParseResult | null> => {
    const trimmed = transcript.trim()
    if (!trimmed) return null

    setIsProcessing(true)
    abortRef.current?.abort()
    const ac = new AbortController()
    abortRef.current = ac

    try {
      if (kind === 'food') {
        if (!canUseFoodVoice()) return null
        const result = await llmParse(trimmed, 'food', ac.signal)
        if (ac.signal.aborted) return null
        return result.items.length > 0 ? result : null
      }

      // Activity: try LLM first, fall back to local parser
      if (canUseBurnVoiceLLM()) {
        const result = await llmParse(trimmed, 'activity', ac.signal)
        if (ac.signal.aborted) return null
        if (result.items.length > 0) return result
      }

      const local = parseTranscript(trimmed)
      if (local.type === 'activity' && local.items.length > 0) return local

      return null
    } catch (e) {
      if ((e as Error).name === 'AbortError') return null

      // Activity: try local parser as last resort
      if (kind === 'burn') {
        const local = parseTranscript(trimmed)
        if (local.type === 'activity' && local.items.length > 0) return local
      }

      return null
    } finally {
      if (!ac.signal.aborted) setIsProcessing(false)
    }
  }, [])

  return { isProcessing, parse, abort }
}
