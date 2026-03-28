import type { VoiceLoggingPhase } from '../../hooks/useVoiceLogging'
import type { ParseResult, ParsedItem } from '../../services/parser'
import { ResultForm } from './ResultForm'
import { VoiceInputSheet } from './VoiceInputSheet'

interface VoiceRecorderProps {
  phase: VoiceLoggingPhase
  kind: 'food' | 'burn'
  transcript: string
  submittedText: string
  amplitude: number
  result: ParseResult | null
  error: string | null
  saving: boolean
  onSubmit: (text: string) => void
  onStop: () => void
  onCancel: () => void
  onUpdateItem: (index: number, patch: Partial<ParsedItem>) => void
  onRemoveItem: (index: number) => void
  onAddItem: () => void
  onSave: () => void
  onFallbackManual: () => void
}

export function VoiceRecorder(props: VoiceRecorderProps) {
  const { phase, kind, result, error, saving } = props

  if (phase === 'result' && result) {
    return (
      <ResultForm
        kind={kind}
        result={result}
        error={error}
        saving={saving}
        onUpdateItem={props.onUpdateItem}
        onRemoveItem={props.onRemoveItem}
        onAddItem={props.onAddItem}
        onSave={props.onSave}
        onCancel={props.onCancel}
      />
    )
  }

  if (phase === 'recording' || phase === 'processing') {
    return (
      <VoiceInputSheet
        phase={phase}
        transcript={props.transcript}
        submittedText={props.submittedText}
        amplitude={props.amplitude}
        onCancel={props.onCancel}
        onSubmit={props.onSubmit}
        onStop={props.onStop}
        onManualEntry={props.onFallbackManual}
      />
    )
  }

  return null
}
