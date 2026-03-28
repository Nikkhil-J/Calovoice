import { memo, type ReactElement } from 'react'
import type { TimelineEntry } from '../../types/timeline'
import type { BurnEntry, FoodEntry } from '../../types/dayLog'
import type { GroupedTimeline, TimePeriod } from '../../hooks/useTimeline'
import { uiTokens } from '../../theme'
import { TimelineItem } from './TimelineItem'

interface TimelineProps {
  grouped: GroupedTimeline
  loading: boolean
  onEditFood: (entry: FoodEntry) => void
  onEditBurn: (entry: BurnEntry) => void
}

const PERIOD_LABELS: Record<TimePeriod, string> = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening',
}

const PERIODS: TimePeriod[] = ['morning', 'afternoon', 'evening']

function PeriodGroup({
  period,
  entries,
  startIndex,
  onEditFood,
  onEditBurn,
}: {
  period: TimePeriod
  entries: TimelineEntry[]
  startIndex: number
  onEditFood: (e: FoodEntry) => void
  onEditBurn: (e: BurnEntry) => void
}) {
  if (entries.length === 0) return null
  return (
    <div className="timeline-card">
      <div className="timeline-card-header">
        <span className="timeline-card-label">{PERIOD_LABELS[period]}</span>
      </div>
      <div className="timeline-list">
        {entries.map((item, i) => (
          <TimelineItem
            key={item.entry.id}
            item={item}
            index={startIndex + i}
            onEdit={() =>
              item.kind === 'food'
                ? onEditFood(item.entry as FoodEntry)
                : onEditBurn(item.entry as BurnEntry)
            }
          />
        ))}
      </div>
    </div>
  )
}

export const Timeline = memo(function Timeline({
  grouped,
  loading,
  onEditFood,
  onEditBurn,
}: TimelineProps) {
  if (loading) {
    return (
      <div className="timeline-skeleton">
        <div className="skeleton skeleton-card" />
        <div className="skeleton skeleton-card" style={{ opacity: uiTokens.opacity.skeletonMedium }} />
        <div className="skeleton skeleton-card" style={{ opacity: uiTokens.opacity.timelineSkeletonTail }} />
      </div>
    )
  }

  const totalEntries = grouped.morning.length + grouped.afternoon.length + grouped.evening.length
  if (totalEntries === 0) return null

  const groupedPeriods = PERIODS.reduce(
    (acc, period) => {
      const entries = grouped[period]
      const idx = acc.runningIndex
      acc.runningIndex += entries.length
      acc.nodes.push(
        <PeriodGroup
          key={period}
          period={period}
          entries={entries}
          startIndex={idx}
          onEditFood={onEditFood}
          onEditBurn={onEditBurn}
        />,
      )
      return acc
    },
    { runningIndex: 0, nodes: [] as ReactElement[] },
  )

  return (
    <section className="timeline">
      {groupedPeriods.nodes}
    </section>
  )
})
