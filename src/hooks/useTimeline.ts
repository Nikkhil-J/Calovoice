import { useMemo } from 'react'
import type { DayDocument } from '../types/dayLog'
import type { TimelineEntry } from '../types/timeline'

export type TimePeriod = 'morning' | 'afternoon' | 'evening'

export interface GroupedTimeline {
  morning: TimelineEntry[]
  afternoon: TimelineEntry[]
  evening: TimelineEntry[]
}

function getPeriod(timestamp: number): TimePeriod {
  const h = new Date(timestamp).getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}

export function useTimeline(day: DayDocument): GroupedTimeline {
  return useMemo(() => {
    const foods: TimelineEntry[] = day.eatenEntries.map((entry) => ({ kind: 'food', entry }))
    const burns: TimelineEntry[] = day.burnedEntries.map((entry) => ({ kind: 'burn', entry }))
    const all = [...foods, ...burns].sort((a, b) => b.entry.createdAt - a.entry.createdAt)

    const grouped: GroupedTimeline = { morning: [], afternoon: [], evening: [] }
    for (const item of all) {
      grouped[getPeriod(item.entry.createdAt)].push(item)
    }
    return grouped
  }, [day])
}

export function flatEntries(grouped: GroupedTimeline): TimelineEntry[] {
  return [...grouped.morning, ...grouped.afternoon, ...grouped.evening]
}

export function formatTime(timestamp: number): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(timestamp))
}

const FOOD_ICONS: [RegExp, string][] = [
  [/breakfast|egg|pancake|cereal|oat|toast/i, '\uD83C\uDF73'],
  [/lunch|sandwich|wrap|burger|pizza|taco/i, '\uD83C\uDF54'],
  [/dinner|steak|pasta|rice|curry|soup/i, '\uD83C\uDF5D'],
  [/salad|veggie|vegetable|greens/i, '\uD83E\uDD57'],
  [/fruit|apple|banana|berry|orange/i, '\uD83C\uDF4E'],
  [/coffee|tea|latte|cappuccino/i, '\u2615'],
  [/snack|chips|cookie|bar|nuts/i, '\uD83C\uDF6A'],
  [/drink|juice|smoothie|shake|water/i, '\uD83E\uDD64'],
]

const ACTIVITY_ICONS: [RegExp, string][] = [
  [/run|jog/i, '\uD83C\uDFC3'],
  [/walk|hike/i, '\uD83D\uDEB6'],
  [/cycl|bike|biking/i, '\uD83D\uDEB4'],
  [/swim/i, '\uD83C\uDFCA'],
  [/gym|weight|lift/i, '\uD83C\uDFCB\uFE0F'],
  [/yoga|stretch/i, '\uD83E\uDDD8'],
  [/sport|ball|tennis|basketball/i, '\u26BD'],
]

export function resolveIcon(kind: 'food' | 'burn', label: string): string {
  const table = kind === 'food' ? FOOD_ICONS : ACTIVITY_ICONS
  for (const [pattern, icon] of table) {
    if (pattern.test(label)) return icon
  }
  return kind === 'food' ? '\uD83C\uDF7D\uFE0F' : '\uD83D\uDD25'
}
