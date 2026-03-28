/**
 * LLM-first parsing pipeline.
 * Food: OpenRouter extracts items → local dict for calories → CalorieNinjas API fallback.
 * Activity: OpenRouter estimates calories directly.
 * Any failure throws — the caller should open the manual entry form.
 */

import type { ParseResult, ParsedItem } from './parser'
import { lookupFoodInDict } from './parser'
import {
  parseMealTranscript,
  parseActivityTranscript,
} from './openrouter'
import { lookupCalories } from './calorieninjas'
import { getOpenRouterKey, getCalorieNinjasKey, canUseFoodVoice, canUseBurnVoiceLLM } from '../utils/keys'

export async function llmParse(
  transcript: string,
  kind: 'food' | 'activity',
  signal?: AbortSignal,
): Promise<ParseResult> {
  if (kind === 'food') return llmParseFood(transcript, signal)
  return llmParseActivity(transcript, signal)
}

async function llmParseFood(
  transcript: string,
  signal?: AbortSignal,
): Promise<ParseResult> {
  const orKey = getOpenRouterKey()
  if (!orKey || !canUseFoodVoice()) {
    throw new Error('LLM food parsing not available (missing API keys)')
  }

  const mealItems = await parseMealTranscript(orKey, transcript, signal)
  const cnKey = getCalorieNinjasKey()

  const items: ParsedItem[] = await Promise.all(
    mealItems.map(async (mi): Promise<ParsedItem> => {
      if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')

      const dictHit = lookupFoodInDict(mi.query)
      if (dictHit) {
        return {
          name: dictHit.name,
          quantity: null,
          unit: mi.quantity?.trim() || dictHit.unit,
          calories: dictHit.calories,
        }
      }

      if (!cnKey) {
        return { name: mi.query, quantity: null, unit: mi.quantity?.trim() || null, calories: null }
      }

      const { label, calories } = await lookupCalories(cnKey, mi.query, signal)
      return {
        name: label || mi.query,
        quantity: null,
        unit: mi.quantity?.trim() || null,
        calories,
      }
    }),
  )

  return {
    type: 'food',
    items,
    confidence: items.length > 0 ? 'high' : 'low',
    raw: transcript,
  }
}

async function llmParseActivity(
  transcript: string,
  signal?: AbortSignal,
): Promise<ParseResult> {
  const orKey = getOpenRouterKey()
  if (!orKey || !canUseBurnVoiceLLM()) {
    throw new Error('LLM activity parsing not available (missing API key)')
  }

  const result = await parseActivityTranscript(orKey, transcript, signal)

  if (result.direct_calories != null) {
    return {
      type: 'activity',
      items: [{
        name: 'Activity',
        quantity: result.direct_calories,
        unit: 'kcal',
        calories: result.direct_calories,
      }],
      confidence: 'high',
      raw: transcript,
    }
  }

  const items: ParsedItem[] = result.activities.map((a) => ({
    name: a.label,
    quantity: null,
    unit: a.duration || null,
    calories: a.calories,
  }))

  return {
    type: 'activity',
    items,
    confidence: items.length > 0 ? 'high' : 'low',
    raw: transcript,
  }
}
