import { memo, useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { EXIT_DURATION_MS } from './constants'

interface VoiceInputSheetProps {
  phase: 'recording' | 'processing'
  transcript: string
  submittedText: string
  amplitude: number
  onCancel: () => void
  onSubmit: (text: string) => void
  onStop: () => void
  onManualEntry: () => void
}

function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

const WAVEFORM_BARS = 24
const TIMER_TICK_MS = 1000
const WAVE_MIN = 0.08
const WAVE_PHASE_SCALE = 2.6
const WAVE_INDEX_STEP = 0.52
const WAVE_AMPLITUDE = 0.35
const WAVE_BASE = 0.45
const NOISE_PHASE_SCALE = 1.7
const NOISE_INDEX_STEP = 2.1
const NOISE_AMPLITUDE = 0.2
const WAVEFORM_RERENDER_DELTA = 0.02

const WaveformBars = memo(function WaveformBars({ amplitude }: { amplitude: number }) {
  const clamped = Math.max(0, Math.min(1, amplitude))
  const bars = Array.from({ length: WAVEFORM_BARS }, (_, i) => {
    const phase = clamped * WAVE_PHASE_SCALE
    const wave = Math.sin(phase + i * WAVE_INDEX_STEP) * WAVE_AMPLITUDE + WAVE_BASE
    const noise = Math.sin(phase * NOISE_PHASE_SCALE + i * NOISE_INDEX_STEP) * NOISE_AMPLITUDE
    const base = wave + noise
    const scaled = WAVE_MIN + clamped * base
    return Math.max(WAVE_MIN, Math.min(1, scaled))
  })

  return (
    <div className="voice-waveform" aria-hidden>
      {bars.map((h, i) => (
        <div
          key={i}
          className="voice-waveform-bar"
          style={{ '--wave': h } as CSSProperties}
        />
      ))}
    </div>
  )
}, (prev, next) => Math.abs(prev.amplitude - next.amplitude) < WAVEFORM_RERENDER_DELTA)

export const VoiceInputSheet = memo(function VoiceInputSheet({
  phase,
  transcript,
  amplitude,
  onCancel,
  onSubmit,
  onStop,
  onManualEntry,
}: VoiceInputSheetProps) {
  const [elapsed, setElapsed] = useState(0)
  const [closing, setClosing] = useState(false)
  const pendingRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    if (phase !== 'recording') return
    const id = setInterval(() => setElapsed((s) => s + 1), TIMER_TICK_MS)
    return () => clearInterval(id)
  }, [phase])

  const animateOut = useCallback((cb: () => void) => {
    if (closing) return
    setClosing(true)
    pendingRef.current = cb
    setTimeout(() => {
      pendingRef.current?.()
      pendingRef.current = null
    }, EXIT_DURATION_MS)
  }, [closing])

  const handleCancel = useCallback(() => animateOut(onCancel), [animateOut, onCancel])
  const handleManual = useCallback(() => animateOut(onManualEntry), [animateOut, onManualEntry])

  const isRecording = phase === 'recording'
  const canSubmit = transcript.trim().length > 0

  const handleSend = () => {
    if (canSubmit) onSubmit(transcript.trim())
  }

  const sheetClass = closing ? 'voice-sheet voice-sheet-exit' : 'voice-sheet'
  const backdropClass = closing ? 'voice-sheet-backdrop voice-sheet-backdrop-exit' : 'voice-sheet-backdrop'

  return (
    <>
      <div
        className={backdropClass}
        role="presentation"
        onClick={(e) => {
          if (e.target === e.currentTarget) handleCancel()
        }}
      />
      <div className={sheetClass} role="dialog" aria-modal>
        <div className="modal-handle">
          <div className="modal-handle-bar" />
        </div>

        {isRecording ? (
          <div className="voice-sheet-body">
            <div className="voice-sheet-header">
              <MicIcon />
              <span className="voice-sheet-rec-label">Recording</span>
              <span className="voice-sheet-timer">{formatTimer(elapsed)}</span>
            </div>

            <div className="voice-sheet-wave-row">
              <WaveformBars amplitude={amplitude} />
              <button
                type="button"
                className="voice-icon-btn voice-icon-btn-stop"
                onClick={onStop}
                aria-label="Stop recording"
                title="Stop"
              >
                <StopIcon />
              </button>
              <button
                type="button"
                className="voice-icon-btn voice-icon-btn-send"
                onClick={handleSend}
                disabled={!canSubmit}
                aria-label="Send"
                title="Send"
              >
                <SendIcon />
              </button>
            </div>

            <div className="voice-sheet-pill-row">
              <button
                type="button"
                className="voice-pill voice-pill-cancel"
                onClick={handleCancel}
              >
                <span className="voice-pill-x" aria-hidden>&times;</span> Cancel
              </button>
              <button
                type="button"
                className="voice-pill voice-pill-manual"
                onClick={handleManual}
              >
                Enter manually
              </button>
            </div>
          </div>
        ) : (
          <div className="voice-sheet-eval">
            <div className="voice-sheet-eval-row">
              <span className="spinner voice-eval-spinner" />
              <span className="voice-sheet-eval-label">Evaluating</span>
            </div>
            <span className="voice-sheet-eval-hint">Working on it, hang tight&hellip;</span>
          </div>
        )}
      </div>
    </>
  )
})

function MicIcon() {
  return (
    <svg className="voice-sheet-mic-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="9" y="2" width="6" height="12" rx="3" fill="currentColor" />
      <path d="M5 11a7 7 0 0014 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 18v4M8 22h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function StopIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="3" y="3" width="10" height="10" rx="2" fill="currentColor" />
    </svg>
  )
}

function SendIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M8 14V3M8 3L3 8M8 3l5 5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
