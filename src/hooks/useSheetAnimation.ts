import { useCallback, useRef, useState } from 'react'
import { EXIT_DURATION_MS } from '../components/day/constants'

export function useSheetAnimation(onClose: () => void) {
  const [closing, setClosing] = useState(false)
  const pendingRef = useRef(false)

  const animateOut = useCallback(() => {
    if (pendingRef.current) return
    pendingRef.current = true
    setClosing(true)
    setTimeout(onClose, EXIT_DURATION_MS)
  }, [onClose])

  return { closing, animateOut }
}
