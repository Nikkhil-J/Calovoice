/**
 * AudioContext-based microphone monitor for waveform visualization only.
 * Does NOT record audio blobs or detect silence — react-speech-recognition
 * handles transcription and session lifecycle separately.
 */

export type AudioMonitorHandle = {
  stop: () => void
}

const AMPLITUDE_POLL_MS = 80
const AMPLITUDE_SMOOTHING = 0.72
const AMPLITUDE_EMIT_DELTA = 0.025

export async function startAudioMonitor(
  onAmplitude: (amplitude: number) => void,
): Promise<AudioMonitorHandle> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
  const ctx = new AudioContext()
  const source = ctx.createMediaStreamSource(stream)
  const analyser = ctx.createAnalyser()
  analyser.fftSize = 256
  source.connect(analyser)

  const dataArray = new Uint8Array(analyser.fftSize)
  let stopped = false
  let lastAmplitude = 0
  let lastEmitted = 0

  function computeRMS(): number {
    analyser.getByteTimeDomainData(dataArray)
    let sum = 0
    for (let i = 0; i < dataArray.length; i++) {
      const normalized = (dataArray[i] - 128) / 128
      sum += normalized * normalized
    }
    return Math.sqrt(sum / dataArray.length)
  }

  const pollInterval = setInterval(() => {
    if (stopped) return
    const rms = computeRMS()
    const next = Math.min(rms * 4, 1)
    const smoothed = lastAmplitude * AMPLITUDE_SMOOTHING + next * (1 - AMPLITUDE_SMOOTHING)
    lastAmplitude = smoothed
    if (Math.abs(smoothed - lastEmitted) >= AMPLITUDE_EMIT_DELTA) {
      lastEmitted = smoothed
      onAmplitude(smoothed)
    }
  }, AMPLITUDE_POLL_MS)

  function cleanup() {
    if (stopped) return
    stopped = true
    clearInterval(pollInterval)
    source.disconnect()
    stream.getTracks().forEach((t) => t.stop())
    void ctx.close()
  }

  return { stop: cleanup }
}
