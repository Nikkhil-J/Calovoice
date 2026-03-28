import { useMemo } from 'react'
import type { CalorieSummary } from './useCalorieSummary'

const EATING_START = 7
const EATING_END = 23
const EATING_WINDOW = EATING_END - EATING_START

/**
 * Forward-looking projection based on current eating pace.
 * Returns null when there isn't enough data to be meaningful
 * (fewer than 2 entries or past 9 pm).
 */
export function usePredictiveInsight(
  summary: CalorieSummary,
  mealCount: number,
): string | null {
  return useMemo(() => {
    const { goal, eaten, burned, isOver } = summary
    if (goal <= 0 || mealCount < 2 || isOver) return null

    const now = new Date()
    const h = now.getHours() + now.getMinutes() / 60
    if (h >= 21 || h < EATING_START) return null

    const elapsed = Math.max(h - EATING_START, 0.5)
    const net = Math.max(0, eaten - burned)
    const projected = Math.round((net / elapsed) * EATING_WINDOW)
    const diff = projected - goal

    if (Math.abs(diff) < goal * 0.05) return 'You\u2019re on track to hit your goal.'
    if (diff > 0) return `At this pace, you\u2019ll exceed your goal by ~${diff} kcal.`
    return `You\u2019re trending under \u2014 make sure to eat enough.`
  }, [summary, mealCount])
}
