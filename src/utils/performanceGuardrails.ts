const CLS_WARN_THRESHOLD = 0.1
const LONG_TASK_WARN_MS = 120

type LayoutShiftEntry = PerformanceEntry & {
  value?: number
  hadRecentInput?: boolean
}

declare global {
  interface Window {
    __voiceHealthPerfGuardrailsActive?: boolean
  }
}

/**
 * Dev-only runtime observers that surface smoothness regressions quickly.
 */
export function startPerformanceGuardrails(): void {
  if (typeof window === 'undefined') return
  if (window.__voiceHealthPerfGuardrailsActive) return
  window.__voiceHealthPerfGuardrailsActive = true

  const supportsObserver = typeof PerformanceObserver !== 'undefined'
  if (!supportsObserver) return

  const supportedTypes = PerformanceObserver.supportedEntryTypes ?? []
  let cls = 0

  if (supportedTypes.includes('layout-shift')) {
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as LayoutShiftEntry[]) {
        if (!entry.hadRecentInput) cls += entry.value ?? 0
      }
      if (cls >= CLS_WARN_THRESHOLD) {
        console.warn(
          `[perf] CLS is ${cls.toFixed(3)} (target < ${CLS_WARN_THRESHOLD}). ` +
            'Check recent layout/state transitions.',
        )
      }
    })
    clsObserver.observe({ type: 'layout-shift', buffered: true })
  }

  if (supportedTypes.includes('longtask')) {
    const longTaskObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration >= LONG_TASK_WARN_MS) {
          console.warn(
            `[perf] Long task detected: ${Math.round(entry.duration)}ms. ` +
              'Look for heavy render/layout work around this interaction.',
          )
        }
      }
    })
    longTaskObserver.observe({ type: 'longtask', buffered: true })
  }
}

