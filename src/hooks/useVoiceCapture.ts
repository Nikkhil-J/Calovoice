import { useCallback, useEffect, useRef, useState } from 'react'
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition'
import { startAudioMonitor, type AudioMonitorHandle } from '../services/audioRecorder'
import { uiTokens } from '../theme'

export type VoiceCaptureState = {
  isRecording: boolean
  transcript: string
  amplitude: number
  speechSupported: boolean
}

export type VoiceCaptureActions = {
  start: (onReady: (transcript: string) => void, onError: () => void) => Promise<void>
  stop: () => void
  cancel: () => void
}

/**
 * Manages speech recognition via react-speech-recognition + AudioContext
 * amplitude monitor for waveform visualization.
 *
 * Session lifecycle (silence timer + max duration) lives here as the
 * single source of truth — AudioContext is purely visual.
 */
export function useVoiceCapture(): VoiceCaptureState & VoiceCaptureActions {
  const {
    transcript,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition()

  const [amplitude, setAmplitude] = useState(0)
  const [isRecording, setIsRecording] = useState(false)

  const audioRef = useRef<AudioMonitorHandle | null>(null)
  const onReadyRef = useRef<((t: string) => void) | null>(null)
  const onErrorRef = useRef<(() => void) | null>(null)
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const maxTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const finalizedRef = useRef(false)
  const transcriptRef = useRef('')
  const hasSpokenRef = useRef(false)

  useEffect(() => {
    transcriptRef.current = transcript
    if (transcript) hasSpokenRef.current = true
  }, [transcript])

  const clearTimers = useCallback(() => {
    if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null }
    if (maxTimerRef.current) { clearTimeout(maxTimerRef.current); maxTimerRef.current = null }
  }, [])

  const stopAll = useCallback(() => {
    audioRef.current?.stop()
    audioRef.current = null
    setAmplitude(0)
    void SpeechRecognition.stopListening()
  }, [])

  const finalize = useCallback(() => {
    if (finalizedRef.current) return
    finalizedRef.current = true
    clearTimers()
    stopAll()
    setIsRecording(false)
    onReadyRef.current?.(transcriptRef.current)
  }, [clearTimers, stopAll])

  // Silence timer: only starts after the user has spoken at least once.
  // Resets on each new transcript update; fires finalize after the configured silence gap.
  useEffect(() => {
    if (!isRecording || finalizedRef.current || !hasSpokenRef.current) return

    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
    silenceTimerRef.current = setTimeout(finalize, uiTokens.voiceSilenceTimeoutMs)

    return () => {
      if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null }
    }
  }, [transcript, isRecording, finalize])

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      clearTimers()
      audioRef.current?.stop()
      void SpeechRecognition.abortListening()
    }
  }, [clearTimers])

  const cancel = useCallback(() => {
    finalizedRef.current = true
    hasSpokenRef.current = false
    clearTimers()
    stopAll()
    setIsRecording(false)
    resetTranscript()
    onReadyRef.current = null
    onErrorRef.current = null
  }, [clearTimers, stopAll, resetTranscript])

  const start = useCallback(async (
    onReady: (transcript: string) => void,
    onError: () => void,
  ) => {
    clearTimers()
    stopAll()
    resetTranscript()

    finalizedRef.current = false
    hasSpokenRef.current = false
    onReadyRef.current = onReady
    onErrorRef.current = onError
    setIsRecording(true)

    try {
      await SpeechRecognition.startListening({
        continuous: true,
        interimResults: true,
        language: 'en-US',
      })
    } catch {
      setIsRecording(false)
      onError()
      return
    }

    maxTimerRef.current = setTimeout(finalize, uiTokens.voiceMaxDurationMs)

    try {
      audioRef.current = await startAudioMonitor(setAmplitude)
    } catch {
      // Mic permission denied — speech recognition can still work
    }
  }, [clearTimers, stopAll, resetTranscript, finalize])

  return {
    isRecording,
    transcript,
    amplitude,
    speechSupported: browserSupportsSpeechRecognition,
    start,
    stop: finalize,
    cancel,
  }
}
