import { useEffect, useRef, useState } from 'react'

const DURATION_MS = 500

export function useAnimatedNumber(target: number): number {
  const [display, setDisplay] = useState(target)
  const displayRef = useRef(target)
  const frameRef = useRef(0)

  useEffect(() => {
    cancelAnimationFrame(frameRef.current)
    const from = displayRef.current
    const delta = target - from
    if (delta === 0) {
      displayRef.current = target
      return
    }

    const start = performance.now()

    function tick(now: number) {
      const elapsed = now - start
      const progress = Math.min(elapsed / DURATION_MS, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      const next = Math.round(from + delta * eased)
      if (next !== displayRef.current) {
        displayRef.current = next
        setDisplay(next)
      }

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick)
      } else {
        displayRef.current = target
      }
    }

    frameRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameRef.current)
  }, [target])

  return display
}
