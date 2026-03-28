import { memo, useEffect, useMemo, useState } from 'react'
import { useAppNavigation } from '../navigation/AppNavigationContext'
import { getDoc } from 'firebase/firestore'
import { dayDocRef } from '../firestore/dayLog'
import { useProfile } from '../hooks/useProfile'
import {
  getLastNDateKeys,
  getTodayDateKey,
} from '../utils/dateKey'
import { PageHeader } from '../components/layout/PageHeader'
import { opacity, spacing } from '../theme'
import type { DayDocument } from '../types/dayLog'

async function fetchDay(uid: string, dateKey: string): Promise<DayDocument> {
  const snap = await getDoc(dayDocRef(uid, dateKey))
  if (!snap.exists()) return { eatenEntries: [], burnedEntries: [] }
  const d = snap.data()
  return {
    eatenEntries: d.eatenEntries ?? [],
    burnedEntries: d.burnedEntries ?? [],
  }
}

function sumFood(day: DayDocument) {
  return day.eatenEntries.reduce((s, e) => s + e.calories, 0)
}
function sumBurn(day: DayDocument) {
  return day.burnedEntries.reduce((s, e) => s + e.calories, 0)
}

/** Parse "Mon 23" into day-of-week and day-of-month parts. */
function parseDateParts(dateKey: string): { dow: string; day: string } {
  try {
    const [y, m, d] = dateKey.split('-').map(Number)
    const dt = new Date(y, m - 1, d)
    return {
      dow: dt.toLocaleDateString('en-US', { weekday: 'short' }),
      day: String(d),
    }
  } catch {
    return { dow: '?', day: '?' }
  }
}

// ─── History Row ──────────────────────────────────────────────────────────────

const HistoryItem = memo(function HistoryItem({
  dateKey,
  eaten,
  burned,
  remaining,
  goal,
  onClick,
}: {
  dateKey: string
  eaten: number
  burned: number
  remaining: number
  goal: number
  onClick: () => void
}) {
  const { dow, day } = parseDateParts(dateKey)
  const isOver = remaining < 0
  const barPct = goal > 0 ? Math.min((eaten / goal) * 100, 100) : 0

  return (
    <button
      type="button"
      className="history-row"
      onClick={onClick}
    >
      <div className="history-date-badge">
        <span className="history-date-day">{day}</span>
        <span className="history-date-dow">{dow}</span>
      </div>

      <div className="history-divider" />

      <div className="history-body">
        <div className="history-bar-row">
          <div className="history-bar-track">
            <div
              className={`history-bar-fill${isOver ? ' over' : ''}`}
              style={{ width: `${barPct}%` }}
            />
          </div>
          <span className="history-bar-num">{eaten} kcal</span>
        </div>
        <div className="history-meta">
          <span>{burned > 0 ? `🔥 ${burned} burned` : 'No activity'}</span>
          <span
            className={`history-remaining${isOver ? ' over' : ''}`}
          >
            {isOver
              ? `${Math.abs(remaining)} over`
              : `${remaining} left`}
          </span>
        </div>
      </div>

      <span className="history-chevron" aria-hidden>›</span>
    </button>
  )
})

// ─── Page ─────────────────────────────────────────────────────────────────────

export function HistoryPage({ uid }: { uid: string }) {
  const nav = useAppNavigation()
  const { profile } = useProfile(uid)
  const keys = useMemo(() => getLastNDateKeys(7), [])

  type HistoryRow = { dateKey: string; eaten: number; burned: number; remaining: number }
  const [rows, setRows] = useState<HistoryRow[] | null>(null)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const [picker, setPicker] = useState('')

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const out = await Promise.all(
          keys.map(async (dateKey) => {
            const day = await fetchDay(uid, dateKey)
            const eaten = sumFood(day)
            const burned = sumBurn(day)
            const m = profile?.maintenanceCalories ?? 0
            const remaining = m - eaten + burned
            return { dateKey, eaten, burned, remaining }
          }),
        )
        if (!cancelled) {
          setRows(out)
          setFetchError(null)
        }
      } catch (e) {
        if (!cancelled) {
          setFetchError(e instanceof Error ? e.message : 'Failed to load history')
        }
      }
    })()
    return () => { cancelled = true }
  }, [uid, keys, profile?.maintenanceCalories])

  const goPicker = () => {
    if (!picker) return
    if (picker > getTodayDateKey()) return
    nav.openDay(picker)
  }

  const goal = profile?.maintenanceCalories ?? 0

  const sectionStyles = {
    listSection: { marginBottom: `${spacing.md}px` },
    listSkeleton: (i: number) => ({
      marginBottom: `${spacing.sm}px`,
      opacity: 1 - i * opacity.skeletonStep,
    }),
    datePickerRow: {
      display: 'flex' as const,
      gap: `${spacing.sm}px`,
      alignItems: 'center' as const,
    },
    dateInput: { flex: 1 },
    dateButton: { flexShrink: 0 },
  }

  return (
    <div className="page history">

      {/* Header */}
      <PageHeader
        title="History"
        subtitle="Last 7 days"
        onBack={() => nav.pop()}
        reserveRightSlot
      />

      {/* 7-day list */}
      <section style={sectionStyles.listSection}>
        {fetchError ? (
          <div className="card" role="alert">
            <p>Could not load history. {fetchError}</p>
            <button type="button" className="btn primary sm" onClick={() => setFetchError(null)}>Retry</button>
          </div>
        ) : !rows ? (
          <div className="history-list-shell" aria-hidden>
            {Array.from({ length: 7 }).map((_, i) => (
              <div
                key={i}
                className="skeleton skeleton-card"
                style={sectionStyles.listSkeleton(i)}
              />
            ))}
          </div>
        ) : (
          <ul className="history-list">
            {rows.map((r) => (
              <li key={r.dateKey}>
                <HistoryItem
                  dateKey={r.dateKey}
                  eaten={r.eaten}
                  burned={r.burned}
                  remaining={r.remaining}
                  goal={goal}
                  onClick={() => nav.openDay(r.dateKey)}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Date picker */}
      <section className="card">
        <h2>Jump to date</h2>
        <div style={sectionStyles.datePickerRow}>
          <input
            type="date"
            max={getTodayDateKey()}
            value={picker}
            onChange={(e) => setPicker(e.target.value)}
            className="field-input"
            style={sectionStyles.dateInput}
          />
          <button
            type="button"
            className="btn primary sm"
            onClick={goPicker}
            disabled={!picker}
            style={sectionStyles.dateButton}
          >
            Go →
          </button>
        </div>
      </section>

    </div>
  )
}
