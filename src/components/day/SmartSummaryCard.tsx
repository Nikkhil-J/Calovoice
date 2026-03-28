import { memo } from 'react'
import type { CalorieSummary } from '../../hooks/useCalorieSummary'
import { useAnimatedNumber } from '../../hooks/useAnimatedNumber'
import { CalorieRing } from './CalorieRing'

interface SmartSummaryProps {
  summary: CalorieSummary
  insightText: string
  predictiveInsight?: string | null
}

function StatusChip({ label, status }: { label: string; status: string }) {
  return <span className={`status-chip ${status}`}>{label}</span>
}

function StatItem({ value, label }: { value: number; label: string }) {
  const display = useAnimatedNumber(value)
  return (
    <div className="stat-item">
      <span className="stat-value">{display}</span>
      <span className="stat-label">{label}</span>
    </div>
  )
}

export const SmartSummaryCard = memo(function SmartSummaryCard({
  summary,
  insightText,
  predictiveInsight,
}: SmartSummaryProps) {
  return (
    <div className="smart-summary">
      <StatusChip label={summary.statusLabel} status={summary.status} />

      <CalorieRing
        eaten={summary.eaten}
        goal={summary.goal}
        burned={summary.burned}
      />

      <p className="insight-text">{insightText}</p>
      {predictiveInsight && (
        <p className="predictive-text">{predictiveInsight}</p>
      )}

      <div className="stats-row">
        <StatItem value={summary.goal} label="Goal" />
        <div className="stats-divider" />
        <StatItem value={summary.eaten} label="Eaten" />
        <div className="stats-divider" />
        <StatItem value={summary.burned} label="Burned" />
      </div>
    </div>
  )
})
