import { sizes } from '../../theme'

const styles = {
  icon: { fontSize: sizes.iconLg },
  text: { maxWidth: sizes.contentWidthSm },
} as const

export function FullPageError({
  message,
  onRetry,
}: {
  message: string
  onRetry: () => void
}) {
  return (
    <div className="page center">
      <span style={styles.icon}>⚠️</span>
      <p className="error" style={styles.text}>{message}</p>
      <button type="button" className="btn primary" onClick={onRetry}>
        Retry
      </button>
    </div>
  )
}
