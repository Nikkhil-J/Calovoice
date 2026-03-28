import { useCallback, useEffect, useRef, useState } from 'react'
import { useVoiceCapture } from './useVoiceCapture'
import { useParsePipeline } from './useParsePipeline'
import { useResultEditor } from './useResultEditor'
import { appendFoodEntries, appendBurnEntries } from '../firestore/dayLog'
import { canUseFoodVoice, canUseBurnVoiceLLM } from '../utils/keys'
import type { FoodEntry, BurnEntry } from '../types/dayLog'

export type VoiceLoggingPhase = 'idle' | 'recording' | 'processing' | 'result'

/**
 * Orchestrates voice capture → auto-submit → parse pipeline → result editing → Firestore save.
 *
 * Recording auto-stops on silence (3.5 s after last speech) or max duration,
 * then auto-submits the transcript for processing — no intermediate editing step.
 * The user can also manually stop+send or send during recording.
 */
export function useVoiceLogging(
  uid: string,
  dateKey: string,
  onFallbackManual: (kind: 'food' | 'burn') => void,
) {
  const capture = useVoiceCapture()
  const pipeline = useParsePipeline()
  const editor = useResultEditor()

  const [phase, setPhase] = useState<VoiceLoggingPhase>('idle')
  const [kind, setKind] = useState<'food' | 'burn' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [submittedText, setSubmittedText] = useState('')

  const kindRef = useRef<'food' | 'burn' | null>(null)
  const fallbackRef = useRef(onFallbackManual)
  useEffect(() => { fallbackRef.current = onFallbackManual })

  const reset = useCallback(() => {
    capture.cancel()
    pipeline.abort()
    editor.clear()
    setPhase('idle')
    setKind(null)
    setError(null)
    setSaving(false)
    setSubmittedText('')
    kindRef.current = null
  }, [capture, pipeline, editor])

  const triggerFallback = useCallback((entryKind: 'food' | 'burn') => {
    reset()
    fallbackRef.current(entryKind)
  }, [reset])

  const processText = useCallback(async (text: string) => {
    const ek = kindRef.current
    if (!ek) return

    setSubmittedText(text)
    setPhase('processing')

    const result = await pipeline.parse(text, ek)
    if (result) {
      editor.setResult(result)
      setPhase('result')
    } else {
      triggerFallback(ek)
    }
  }, [pipeline, editor, triggerFallback])

  const start = useCallback(async (entryKind: 'food' | 'burn') => {
    if (!capture.speechSupported) {
      onFallbackManual(entryKind)
      return
    }

    if (entryKind === 'food' && !canUseFoodVoice()) {
      onFallbackManual(entryKind)
      return
    }

    if (entryKind === 'burn' && !canUseBurnVoiceLLM()) {
      onFallbackManual(entryKind)
      return
    }

    reset()
    kindRef.current = entryKind
    setKind(entryKind)
    setPhase('recording')

    await capture.start(
      (transcript) => {
        if (!transcript.trim()) {
          const ek = kindRef.current
          if (ek) triggerFallback(ek)
          return
        }
        void processText(transcript)
      },
      () => {
        const ek = kindRef.current
        if (ek) triggerFallback(ek)
      },
    )
  }, [capture, reset, triggerFallback, onFallbackManual, processText])

  const submit = useCallback(async (text: string) => {
    setSubmittedText(text)
    capture.cancel()
    await processText(text)
  }, [capture, processText])

  const stop = useCallback(() => {
    capture.stop()
  }, [capture])

  const save = useCallback(async () => {
    if (!editor.result || !kind) return
    const now = Date.now()
    setSaving(true)
    setError(null)

    try {
      if (kind === 'food') {
        const entries: FoodEntry[] = editor.result.items
          .filter((i) => i.name.trim() && i.calories != null && i.calories > 0)
          .map((i) => ({
            id: crypto.randomUUID(),
            label: i.name.trim(),
            quantity: i.unit ?? undefined,
            calories: i.calories!,
            source: 'voice' as const,
            createdAt: now,
            rawTranscript: editor.result!.raw || undefined,
          }))
        if (!entries.length) {
          setError('Add calories for at least one item.')
          setSaving(false)
          return
        }
        await appendFoodEntries(uid, dateKey, entries)
      } else {
        const entries: BurnEntry[] = editor.result.items
          .filter((i) => i.calories != null && i.calories > 0)
          .map((i) => ({
            id: crypto.randomUUID(),
            label: i.name.trim() || undefined,
            calories: i.calories!,
            source: 'voice' as const,
            createdAt: now,
            rawTranscript: editor.result!.raw || undefined,
          }))
        if (!entries.length) {
          setError('Add calories for at least one activity.')
          setSaving(false)
          return
        }
        await appendBurnEntries(uid, dateKey, entries)
      }
      reset()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save.')
      setSaving(false)
    }
  }, [editor.result, kind, uid, dateKey, reset])

  return {
    phase,
    kind,
    transcript: capture.transcript,
    submittedText,
    result: editor.result,
    error,
    amplitude: capture.amplitude,
    saving,
    speechOk: capture.speechSupported,
    start,
    submit,
    stop,
    cancel: reset,
    updateItem: editor.updateItem,
    removeItem: editor.removeItem,
    addItem: editor.addItem,
    save,
  }
}
