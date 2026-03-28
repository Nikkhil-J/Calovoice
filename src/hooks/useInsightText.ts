import { useMemo } from 'react'
import type { CalorieSummary } from './useCalorieSummary'

function nextMealName(): string {
  const h = new Date().getHours()
  if (h < 11) return 'breakfast'
  if (h < 15) return 'lunch'
  if (h < 17) return 'a snack'
  return 'dinner'
}

function mealsLeft(): number {
  const h = new Date().getHours()
  if (h < 11) return 3
  if (h < 15) return 2
  return 1
}

export function useInsightText(summary: CalorieSummary, mealCount: number): string {
  return useMemo(() => {
    const { remaining, isOver, eaten, burned, goal, ratio } = summary
    const left = mealsLeft()
    const meal = nextMealName()

    if (isOver) {
      const over = Math.abs(remaining)
      return `You're ${over} kcal over \u2014 keep ${meal} under 300 kcal.`
    }

    if (eaten === 0 && burned === 0) {
      return `${goal.toLocaleString()} kcal to spend today \u2014 start with ${meal}.`
    }

    if (burned > eaten && eaten > 0) {
      return `Burned ${burned - eaten} more than eaten \u2014 refuel with ${meal}.`
    }

    if (ratio >= 0.92) {
      return `Nearly there \u2014 a light snack to finish the day.`
    }

    if (ratio >= 0.85) {
      return `Only ${remaining} kcal left \u2014 keep ${meal} light.`
    }

    if (mealCount >= 3 && ratio < 0.75) {
      const avg = Math.round(eaten / mealCount)
      return `${mealCount} meals averaging ${avg} kcal \u2014 solid distribution so far.`
    }

    if (left >= 2 && remaining > 300) {
      const perMeal = Math.round(remaining / left)
      return `Eat ~${perMeal} kcal per meal across your next ${left} meals.`
    }

    if (left === 1 && remaining > 200) {
      return `${remaining} kcal left \u2014 enough for a full ${meal}.`
    }

    const perMeal = left > 0 ? Math.round(remaining / left) : remaining
    return `${remaining} kcal remaining \u2014 aim for ~${perMeal} kcal at ${meal}.`
  }, [summary, mealCount])
}
