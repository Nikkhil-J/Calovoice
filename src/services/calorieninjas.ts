import { z } from 'zod'
import { isMockCalorieApi } from '../utils/keys'

const NutritionResponseSchema = z.object({
  items: z
    .array(
      z.object({
        name: z.string().optional(),
        calories: z.number().optional(),
      }),
    )
    .optional(),
})

const BASE = 'https://api.calorieninjas.com/v1/nutrition'

/** Deterministic fake calories for demos (80–500 kcal). */
function mockCaloriesForQuery(query: string): number {
  let h = 0
  for (let i = 0; i < query.length; i++) {
    h = (Math.imul(31, h) + query.charCodeAt(i)) | 0
  }
  return 80 + (Math.abs(h) % 421)
}

export async function lookupCalories(
  apiKey: string,
  query: string,
  signal?: AbortSignal,
): Promise<{ label: string; calories: number | null }> {
  if (isMockCalorieApi()) {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')
    const label = query.trim() || query
    return { label, calories: mockCaloriesForQuery(query) }
  }

  const url = `${BASE}?query=${encodeURIComponent(query)}`
  const res = await fetch(url, {
    signal,
    headers: { 'X-Api-Key': apiKey },
  })
  if (!res.ok) {
    if (res.status === 429) throw new Error('CalorieNinjas rate limited')
    throw new Error(`CalorieNinjas ${res.status}`)
  }
  const json: unknown = await res.json()
  const parsed = NutritionResponseSchema.safeParse(json)
  if (!parsed.success) {
    return { label: query, calories: null }
  }
  const first = parsed.data.items?.[0]
  const calories =
    first?.calories != null && Number.isFinite(first.calories)
      ? Math.round(first.calories)
      : null
  const label = first?.name?.trim() || query
  return { label, calories }
}

export async function validateCalorieNinjasKey(apiKey: string): Promise<boolean> {
  if (isMockCalorieApi()) return true
  try {
    const r = await lookupCalories(apiKey, 'apple')
    return r.calories != null
  } catch {
    return false
  }
}
