import { createContext, memo, useCallback, useContext, useRef, useState } from 'react'
import { EXIT_DURATION_MS } from './constants'

const CloseCtx = createContext<(() => void) | null>(null)

export function useBottomSheetClose() {
  return useContext(CloseCtx)
}

interface BottomSheetProps {
  children: React.ReactNode
  onClose?: () => void
}

export const BottomSheet = memo(function BottomSheet({
  children,
  onClose,
}: BottomSheetProps) {
  const [closing, setClosing] = useState(false)
  const pendingRef = useRef(false)

  const requestClose = useCallback(() => {
    if (!onClose || pendingRef.current) return
    pendingRef.current = true
    setClosing(true)
    setTimeout(() => {
      onClose()
    }, EXIT_DURATION_MS)
  }, [onClose])

  const backdropClass = closing ? 'modal-backdrop modal-backdrop-exit' : 'modal-backdrop'
  const modalClass = closing ? 'modal modal-exit' : 'modal'

  return (
    <CloseCtx.Provider value={requestClose}>
      <div
        className={backdropClass}
        role="presentation"
        onClick={(e) => {
          if (e.target === e.currentTarget) requestClose()
        }}
      >
        <div className={modalClass} role="dialog">
          <div className="modal-handle">
            <div className="modal-handle-bar" />
          </div>
          <div className="modal-body">{children}</div>
        </div>
      </div>
    </CloseCtx.Provider>
  )
})
