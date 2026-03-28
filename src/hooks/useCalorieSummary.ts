import { useMemo } from 'react'
import type { DayDocument } from '../types/dayLog'
import type { CalorieStatus } from '../types/timeline'

export interface CalorieSummary {
  goal: number
  eaten: number
  burned: number
  net: number
  remaining: number
  ratio: number
  isOver: boolean
  status: CalorieStatus
  statusLabel: string
}

export function useCalorieSummary(
  day: DayDocument,
  maintenanceCalories: number,
): CalorieSummary {
  return useMemo(() => {
    const goal = maintenanceCalories
    const eaten = day.eatenEntries.reduce((s, e) => s + e.calories, 0)
    const burned = day.burnedEntries.reduce((s, e) => s + e.calories, 0)
    const net = Math.max(0, eaten - burned)
    const remaining = goal - eaten + burned
    const ratio = goal > 0 ? Math.min(net / goal, 1) : 0
    const isOver = remaining < 0

    let status: CalorieStatus = 'on-track'
    let statusLabel = 'On track'
    if (isOver) {
      status = 'over'
      statusLabel = 'Over budget'
    } else if (ratio < 0.25 && eaten === 0) {
      status = 'under'
      statusLabel = 'Not started'
    }

    return { goal, eaten, burned, net, remaining, ratio, isOver, status, statusLabel }
  }, [day, maintenanceCalories])
}
