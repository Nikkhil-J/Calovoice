import { memo } from 'react'

interface FloatingActionsProps {
  onLogFood: () => void
  onLogActivity: () => void
  foodLabel?: string
  foodDisabled?: boolean
  activityDisabled?: boolean
}

export const FloatingActions = memo(function FloatingActions({
  onLogFood,
  onLogActivity,
  foodLabel = 'Log Food',
  foodDisabled,
  activityDisabled,
}: FloatingActionsProps) {
  return (
    <div className="floating-bar">
      <div className="floating-bar-inner">
        <button
          type="button"
          className="floating-btn primary"
          onClick={onLogFood}
          disabled={foodDisabled}
        >
          {foodLabel}
        </button>
        <button
          type="button"
          className="floating-btn secondary"
          onClick={onLogActivity}
          disabled={activityDisabled}
        >
          Log Activity
        </button>
      </div>
    </div>
  )
})
