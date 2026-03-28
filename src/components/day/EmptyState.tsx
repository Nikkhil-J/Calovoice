import { memo } from 'react'

interface EmptyStateProps {
  onQuickAdd: (meal: string) => void
}

const QUICK_MEALS = ['Breakfast', 'Lunch', 'Dinner', 'Snack'] as const

function PlateIllustration() {
  return (
    <svg
      width="80"
      height="80"
      viewBox="0 0 80 80"
      fill="none"
      aria-hidden="true"
      className="empty-illustration"
    >
      <circle cx="40" cy="42" r="28" fill="var(--surface-3)" />
      <circle cx="40" cy="42" r="20" fill="var(--surface-2)" />
      <ellipse cx="40" cy="42" rx="12" ry="11" fill="var(--surface)" />
      <rect x="12" y="56" width="6" height="2" rx="1" fill="var(--t3)" opacity="0.4" transform="rotate(-30 12 56)" />
      <rect x="62" y="56" width="6" height="2" rx="1" fill="var(--t3)" opacity="0.4" transform="rotate(30 62 56)" />
      <circle cx="36" cy="39" r="2" fill="var(--green-l)" />
      <circle cx="44" cy="41" r="1.5" fill="var(--green-l)" />
      <circle cx="40" cy="36" r="1.5" fill="var(--amber-l)" />
    </svg>
  )
}

export const EmptyState = memo(function EmptyState({ onQuickAdd }: EmptyStateProps) {
  return (
    <div className="empty-state-v2">
      <PlateIllustration />
      <p className="empty-state-title">Start tracking your day</p>
      <p className="empty-state-sub">
        Log your first meal to see insights and progress
      </p>
      <div className="quick-add-chips">
        {QUICK_MEALS.map((meal) => (
          <button
            key={meal}
            type="button"
            className="quick-add-chip"
            onClick={() => onQuickAdd(meal)}
          >
            {meal}
          </button>
        ))}
      </div>
    </div>
  )
})
