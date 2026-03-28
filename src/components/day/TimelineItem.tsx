import { memo } from 'react'
import type { TimelineEntry } from '../../types/timeline'
import type { FoodEntry } from '../../types/dayLog'
import { formatTime, resolveIcon } from '../../hooks/useTimeline'
import { uiTokens } from '../../theme'

interface TimelineItemProps {
  item: TimelineEntry
  index: number
  onEdit: () => void
}

export const TimelineItem = memo(function TimelineItem({
  item,
  index,
  onEdit,
}: TimelineItemProps) {
  const { kind, entry } = item
  const isFood = kind === 'food'
  const label = isFood
    ? entry.label
    : (entry as { label?: string }).label || 'Activity'
  const subtitle = isFood ? (entry as FoodEntry).quantity : undefined
  const icon = resolveIcon(kind, label)

  return (
    <button
      type="button"
      className="timeline-item"
      onClick={onEdit}
      style={{ animationDelay: `${index * uiTokens.animation.itemDelayMs}ms` }}
    >
      <span className="timeline-time">{formatTime(entry.createdAt)}</span>
      <span className="timeline-emoji" aria-hidden>{icon}</span>
      <span className="timeline-content">
        <span className="timeline-title">{label}</span>
        {subtitle && <span className="timeline-subtitle">{subtitle}</span>}
      </span>
      <span className={`timeline-cal ${kind}`}>
        {isFood ? '+' : '\u2212'}{entry.calories}
      </span>
    </button>
  )
})
