import { memo } from 'react'

interface ErrorBannerProps {
  message: string
  onRetry: () => void
  onDismiss: () => void
}

export const ErrorBanner = memo(function ErrorBanner({
  message,
  onRetry,
  onDismiss,
}: ErrorBannerProps) {
  return (
    <div className="error-banner" role="alert">
      <span className="error-banner-icon">&#9888;&#65039;</span>
      <div className="error-banner-body">
        <p className="error-banner-msg">{message}</p>
        <button type="button" className="btn sm error-banner-retry" onClick={onRetry}>
          &#127908; Try again with voice
        </button>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss error"
        className="error-banner-close"
      >
        &times;
      </button>
    </div>
  )
})
