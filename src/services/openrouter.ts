import { z } from 'zod'

/**
 * The LLM model used for all OpenRouter calls.
 * Switch this to a paid model (e.g. 'openai/gpt-4o-mini') for faster,
 * more reliable responses. The :free suffix pins to the free tier of
 * this specific model rather than using the slow openrouter/free queue.
 */
const OPENROUTER_MODEL = 'meta-llama/llama-3.3-70b-instruct:free'

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

const APP_TITLE = 'Voice Health Calorie App'

type ChatMessage = { role: string; content: string }

async function callOpenRouter<T>(
  apiKey: string,
  messages: ChatMessage[],
  schema: z.ZodType<T>,
  errorLabel: string,
  signal?: AbortSignal,
): Promise<T> {
  const body = {
    model: OPENROUTER_MODEL,
    max_tokens: 512,
    response_format: { type: 'json_object' },
    messages,
  }

  const res = await fetch(OPENROUTER_URL, {
    method: 'POST',
    signal,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : '',
      'X-Title': APP_TITLE,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const t = await res.text()
    throw new Error(`OpenRouter ${res.status}: ${t.slice(0, 200)}`)
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[]
  }
  const content = data.choices?.[0]?.message?.content
  if (!content) throw new Error(`OpenRouter: empty response (${errorLabel})`)

  let parsed: unknown
  try {
    parsed = JSON.parse(content)
  } catch {
    throw new Error(`OpenRouter: invalid JSON in message (${errorLabel})`)
  }

  const out = schema.safeParse(parsed)
  if (!out.success) {
    throw new Error(`OpenRouter: JSON shape mismatch (${errorLabel})`)
  }
  return out.data
}

// ─── Meal parsing ──────────────────────────────────────────────────────────────

const MealItemsSchema = z.object({
  items: z.array(
    z.object({
      raw: z.string(),
      query: z.string(),
      /** Human-readable serving when inferable from speech, else "". */
      quantity: z.string().optional(),
    }),
  ),
})

export type MealItem = z.infer<typeof MealItemsSchema>['items'][number]

export async function parseMealTranscript(
  apiKey: string,
  transcript: string,
  signal?: AbortSignal,
): Promise<MealItem[]> {
  const messages: ChatMessage[] = [
    {
      role: 'system',
      content: `You output ONLY valid JSON with shape {"items":[{"raw":"...","query":"...","quantity":"..."}]}. 
Split the user's meal into separate foods. "query" must be a short English phrase optimized for a nutrition API (include amount in the query when said). "quantity" is a short serving description from what the user said (e.g. "1 small bag", "2 cups") or "" if unknown. Max 10 items.`,
    },
    { role: 'user', content: transcript },
  ]

  const data = await callOpenRouter(apiKey, messages, MealItemsSchema, 'meal', signal)
  const items = data.items.slice(0, 10).filter((i) => i.query.trim())
  if (!items.length) throw new Error('OpenRouter: no food items')
  return items
}

// ─── Activity parsing ─────────────────────────────────────────────────────────

const ActivityResponseSchema = z.object({
  /**
   * Non-null when the user explicitly stated a calorie number
   * ("I burned 350 calories", "350 kcal"). Null when they described an activity.
   */
  direct_calories: z.number().nullable(),
  /**
   * Populated when the user described one or more activities and did NOT give
   * a direct calorie count. The LLM estimates kcal for an average adult.
   */
  activities: z.array(
    z.object({
      label: z.string(),    // e.g. "Running"
      duration: z.string(), // e.g. "30 min" or ""
      calories: z.number(), // estimated kcal burned
    }),
  ),
})

export type ActivityResponse = z.infer<typeof ActivityResponseSchema>
export type ActivityItem = ActivityResponse['activities'][number]

export async function parseActivityTranscript(
  apiKey: string,
  transcript: string,
  signal?: AbortSignal,
): Promise<ActivityResponse> {
  const messages: ChatMessage[] = [
    {
      role: 'system',
      content: `You output ONLY valid JSON with shape:
{"direct_calories": <number or null>, "activities": [{"label":"...","duration":"...","calories":<number>}]}

Rules:
- If the user explicitly states a calorie number (e.g. "burned 350 calories", "350 kcal"), set direct_calories to that integer and activities to [].
- Otherwise set direct_calories to null and populate activities. Split into separate activities if multiple are mentioned. For each: "label" is a short name (e.g. "Running"), "duration" is the time mentioned (e.g. "30 min") or "" if unknown, "calories" is your best kcal estimate for an average 70kg adult doing that activity for that duration. If no duration is given, assume a typical single session.
- Max 5 activities.`,
    },
    { role: 'user', content: transcript },
  ]

  const result = await callOpenRouter(apiKey, messages, ActivityResponseSchema, 'activity', signal)

  if (result.direct_calories == null && result.activities.length === 0) {
    throw new Error('OpenRouter: could not parse any activity or calorie from transcript')
  }

  return result
}

/** Lightweight key check: tiny completion. */
export async function validateOpenRouterKey(apiKey: string): Promise<boolean> {
  try {
    const res = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : '',
        'X-Title': APP_TITLE,
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        max_tokens: 8,
        messages: [{ role: 'user', content: 'Reply with OK only.' }],
      }),
    })
    return res.ok
  } catch {
    return false
  }
}
