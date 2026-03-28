/**
 * Local deterministic parser for food and activity transcripts.
 * Also exposes a single-item dictionary lookup used by the LLM pipeline
 * to avoid API calls for common items.
 */

// ── Public types ────────────────────────────────────────────────────────────

export type ParsedItem = {
  name: string
  quantity: number | null
  unit: string | null
  calories: number | null
}

export type ParseResult = {
  type: 'food' | 'activity'
  items: ParsedItem[]
  confidence: 'high' | 'low'
  raw: string
}

// ── Food dictionary ─────────────────────────────────────────────────────────

type FoodDef = {
  caloriesPer: number
  defaultUnit: string
  aliases?: string[]
}

const FOOD_DB: Record<string, FoodDef> = {
  egg:        { caloriesPer: 70,  defaultUnit: 'piece', aliases: ['eggs'] },
  toast:      { caloriesPer: 80,  defaultUnit: 'slice', aliases: ['toasts'] },
  bread:      { caloriesPer: 80,  defaultUnit: 'slice', aliases: ['breads'] },
  rice:       { caloriesPer: 200, defaultUnit: 'cup' },
  chicken:    { caloriesPer: 165, defaultUnit: '100g', aliases: ['chicken breast'] },
  banana:     { caloriesPer: 105, defaultUnit: 'piece', aliases: ['bananas'] },
  apple:      { caloriesPer: 95,  defaultUnit: 'piece', aliases: ['apples'] },
  orange:     { caloriesPer: 62,  defaultUnit: 'piece', aliases: ['oranges'] },
  milk:       { caloriesPer: 150, defaultUnit: 'cup', aliases: ['glass of milk'] },
  coffee:     { caloriesPer: 5,   defaultUnit: 'cup' },
  tea:        { caloriesPer: 2,   defaultUnit: 'cup' },
  oatmeal:    { caloriesPer: 150, defaultUnit: 'cup', aliases: ['oats', 'porridge'] },
  yogurt:     { caloriesPer: 100, defaultUnit: 'cup', aliases: ['yoghurt', 'curd'] },
  cheese:     { caloriesPer: 110, defaultUnit: 'slice', aliases: ['cheddar'] },
  butter:     { caloriesPer: 100, defaultUnit: 'tbsp' },
  pasta:      { caloriesPer: 220, defaultUnit: 'cup', aliases: ['spaghetti', 'noodles', 'noodle'] },
  pizza:      { caloriesPer: 285, defaultUnit: 'slice', aliases: ['pizzas'] },
  burger:     { caloriesPer: 350, defaultUnit: 'piece', aliases: ['hamburger', 'burgers'] },
  sandwich:   { caloriesPer: 300, defaultUnit: 'piece', aliases: ['sandwiches'] },
  salad:      { caloriesPer: 120, defaultUnit: 'bowl', aliases: ['salads'] },
  soup:       { caloriesPer: 150, defaultUnit: 'bowl', aliases: ['soups'] },
  steak:      { caloriesPer: 270, defaultUnit: 'piece', aliases: ['steaks', 'beef'] },
  fish:       { caloriesPer: 200, defaultUnit: 'piece', aliases: ['salmon', 'tuna'] },
  shrimp:     { caloriesPer: 85,  defaultUnit: '100g', aliases: ['prawns', 'shrimps'] },
  avocado:    { caloriesPer: 240, defaultUnit: 'piece', aliases: ['avocados'] },
  potato:     { caloriesPer: 160, defaultUnit: 'piece', aliases: ['potatoes'] },
  fries:      { caloriesPer: 365, defaultUnit: 'serving', aliases: ['french fries', 'chips'] },
  pancake:    { caloriesPer: 90,  defaultUnit: 'piece', aliases: ['pancakes'] },
  waffle:     { caloriesPer: 220, defaultUnit: 'piece', aliases: ['waffles'] },
  cereal:     { caloriesPer: 150, defaultUnit: 'cup' },
  donut:      { caloriesPer: 250, defaultUnit: 'piece', aliases: ['donuts', 'doughnut', 'doughnuts'] },
  cookie:     { caloriesPer: 70,  defaultUnit: 'piece', aliases: ['cookies', 'biscuit', 'biscuits'] },
  cake:       { caloriesPer: 350, defaultUnit: 'slice', aliases: ['cakes'] },
  ice_cream:  { caloriesPer: 200, defaultUnit: 'scoop', aliases: ['ice cream', 'icecream'] },
  chocolate:  { caloriesPer: 150, defaultUnit: 'bar', aliases: ['chocolates'] },
  juice:      { caloriesPer: 110, defaultUnit: 'glass', aliases: ['orange juice', 'apple juice'] },
  soda:       { caloriesPer: 140, defaultUnit: 'can', aliases: ['coke', 'pepsi', 'sprite'] },
  water:      { caloriesPer: 0,   defaultUnit: 'glass' },
  roti:       { caloriesPer: 100, defaultUnit: 'piece', aliases: ['rotis', 'chapati', 'chapatis', 'roti canai'] },
  dal:        { caloriesPer: 180, defaultUnit: 'cup', aliases: ['daal', 'lentils', 'lentil'] },
  paneer:     { caloriesPer: 260, defaultUnit: '100g' },
  biryani:    { caloriesPer: 350, defaultUnit: 'plate', aliases: ['biriyani'] },
  dosa:       { caloriesPer: 130, defaultUnit: 'piece', aliases: ['dosas'] },
  idli:       { caloriesPer: 40,  defaultUnit: 'piece', aliases: ['idlis'] },
  samosa:     { caloriesPer: 260, defaultUnit: 'piece', aliases: ['samosas'] },
  naan:       { caloriesPer: 260, defaultUnit: 'piece', aliases: ['naans', 'nan'] },
  smoothie:   { caloriesPer: 200, defaultUnit: 'glass', aliases: ['smoothies'] },
  protein_shake: { caloriesPer: 150, defaultUnit: 'glass', aliases: ['protein shake', 'shake', 'whey'] },
  granola:    { caloriesPer: 200, defaultUnit: 'cup', aliases: ['granola bar'] },
  bacon:      { caloriesPer: 90,  defaultUnit: 'slice', aliases: ['bacons'] },
  sausage:    { caloriesPer: 180, defaultUnit: 'piece', aliases: ['sausages'] },
  wrap:       { caloriesPer: 300, defaultUnit: 'piece', aliases: ['wraps', 'burrito', 'burritos'] },
}

// ── Activity dictionary ─────────────────────────────────────────────────────

type ActivityDef = {
  caloriesPerMinute: number
  defaultMinutes: number
  aliases?: string[]
}

const ACTIVITY_DB: Record<string, ActivityDef> = {
  walking:    { caloriesPerMinute: 4,  defaultMinutes: 30, aliases: ['walk', 'walked'] },
  running:    { caloriesPerMinute: 10, defaultMinutes: 30, aliases: ['run', 'ran', 'jog', 'jogging', 'jogged'] },
  cycling:    { caloriesPerMinute: 8,  defaultMinutes: 30, aliases: ['cycle', 'cycled', 'biking', 'biked', 'bike'] },
  swimming:   { caloriesPerMinute: 7,  defaultMinutes: 30, aliases: ['swim', 'swam'] },
  yoga:       { caloriesPerMinute: 3,  defaultMinutes: 45 },
  gym:        { caloriesPerMinute: 6,  defaultMinutes: 60, aliases: ['weight training', 'weights', 'lifting', 'workout', 'worked out'] },
  hiking:     { caloriesPerMinute: 6,  defaultMinutes: 60, aliases: ['hike', 'hiked'] },
  dancing:    { caloriesPerMinute: 5,  defaultMinutes: 30, aliases: ['dance', 'danced'] },
  tennis:     { caloriesPerMinute: 7,  defaultMinutes: 60 },
  basketball: { caloriesPerMinute: 8,  defaultMinutes: 60 },
  football:   { caloriesPerMinute: 8,  defaultMinutes: 60, aliases: ['soccer'] },
  cricket:    { caloriesPerMinute: 5,  defaultMinutes: 60 },
  badminton:  { caloriesPerMinute: 5,  defaultMinutes: 30 },
  jumping_rope: { caloriesPerMinute: 12, defaultMinutes: 15, aliases: ['jump rope', 'skipping', 'skipped'] },
  stretching: { caloriesPerMinute: 2,  defaultMinutes: 15, aliases: ['stretch', 'stretched'] },
  pilates:    { caloriesPerMinute: 4,  defaultMinutes: 45 },
}

// ── Build lookup maps ───────────────────────────────────────────────────────

type FoodMatch = { key: string; phrase: string; def: FoodDef }
type ActivityMatch = { key: string; phrase: string; def: ActivityDef }

function buildFoodLookup(): { phrase: string; key: string; def: FoodDef }[] {
  const entries: FoodMatch[] = []
  for (const [key, def] of Object.entries(FOOD_DB)) {
    entries.push({ phrase: key.replace(/_/g, ' '), key, def })
    for (const alias of def.aliases ?? []) {
      entries.push({ phrase: alias.toLowerCase(), key, def })
    }
  }
  entries.sort((a, b) => b.phrase.length - a.phrase.length)
  return entries
}

function buildActivityLookup(): { phrase: string; key: string; def: ActivityDef }[] {
  const entries: ActivityMatch[] = []
  for (const [key, def] of Object.entries(ACTIVITY_DB)) {
    entries.push({ phrase: key.replace(/_/g, ' '), key, def })
    for (const alias of def.aliases ?? []) {
      entries.push({ phrase: alias.toLowerCase(), key, def })
    }
  }
  entries.sort((a, b) => b.phrase.length - a.phrase.length)
  return entries
}

const foodLookup = buildFoodLookup()
const activityLookup = buildActivityLookup()

// ── Single-item dictionary lookup (used by LLM pipeline) ────────────────────

export type DictMatch = { name: string; calories: number; unit: string }

/**
 * Exact-match a single item name (e.g. "coffee", "ice cream") against FOOD_DB.
 * Returns calorie info when found, or null so the caller can fall back to an API.
 */
export function lookupFoodInDict(query: string): DictMatch | null {
  const q = query.trim().toLowerCase()
  if (!q) return null

  for (const entry of foodLookup) {
    if (entry.phrase === q) {
      return {
        name: formatName(entry.phrase),
        calories: entry.def.caloriesPer,
        unit: entry.def.defaultUnit,
      }
    }
  }
  return null
}

// ── Quantity regex ───────────────────────────────────────────────────────────

const QUANTITY_RE =
  /(\d+(?:\.\d+)?)\s*(kg|g|grams?|cups?|pieces?|slices?|mins?|minutes?|hours?|hr|hrs|km|miles?|servings?|bowls?|glasses?|cans?|tbsp|tsp|scoops?|plates?|bars?)?/gi

type QuantityMatch = { value: number; unit: string | null; index: number; length: number }

function extractQuantities(text: string): QuantityMatch[] {
  const matches: QuantityMatch[] = []
  let m: RegExpExecArray | null
  QUANTITY_RE.lastIndex = 0
  while ((m = QUANTITY_RE.exec(text)) !== null) {
    matches.push({
      value: parseFloat(m[1]),
      unit: m[2]?.toLowerCase().replace(/s$/, '') ?? null,
      index: m.index,
      length: m[0].length,
    })
  }
  return matches
}

// ── Duration helpers ────────────────────────────────────────────────────────

function extractDurationMinutes(text: string): number | null {
  const hourMin = text.match(/(\d+(?:\.\d+)?)\s*(?:hours?|hrs?)\s*(?:and\s*)?(\d+)?\s*(?:mins?|minutes?)?/i)
  if (hourMin) {
    const hours = parseFloat(hourMin[1])
    const mins = hourMin[2] ? parseFloat(hourMin[2]) : 0
    return hours * 60 + mins
  }
  const minMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:mins?|minutes?)/i)
  if (minMatch) return parseFloat(minMatch[1])
  const hrOnly = text.match(/(\d+(?:\.\d+)?)\s*(?:hours?|hrs?)/i)
  if (hrOnly) return parseFloat(hrOnly[1]) * 60
  return null
}

// ── Direct calorie detection ────────────────────────────────────────────────

const DIRECT_CAL_RE = /(\d+(?:\.\d+)?)\s*(?:kcal|calories?|cals?)\s*(?:burned?)?/i

function extractDirectCalories(text: string): number | null {
  const m = text.match(DIRECT_CAL_RE)
  if (!m) return null
  const n = parseFloat(m[1])
  return Number.isFinite(n) && n > 0 && n <= 50000 ? Math.round(n) : null
}

// ── Main parse function ─────────────────────────────────────────────────────

export function parseTranscript(transcript: string): ParseResult {
  const raw = transcript.trim()
  const text = raw.toLowerCase()

  if (!text) {
    return { type: 'food', items: [], confidence: 'low', raw }
  }

  const activityItems = matchActivities(text)
  if (activityItems.length > 0) {
    const allHaveQuantity = activityItems.every((i) => i.quantity !== null)
    return {
      type: 'activity',
      items: activityItems,
      confidence: allHaveQuantity ? 'high' : 'low',
      raw,
    }
  }

  const directCal = extractDirectCalories(text)
  if (directCal !== null) {
    const label = text.replace(DIRECT_CAL_RE, '').replace(/\b(burned?|i)\b/gi, '').trim()
    return {
      type: 'activity',
      items: [{
        name: label || 'Activity',
        quantity: directCal,
        unit: 'kcal',
        calories: directCal,
      }],
      confidence: 'high',
      raw,
    }
  }

  const foodItems = matchFoods(text)
  if (foodItems.length > 0) {
    const allHaveQuantity = foodItems.every((i) => i.quantity !== null && i.calories !== null)
    return {
      type: 'food',
      items: foodItems,
      confidence: allHaveQuantity ? 'high' : 'low',
      raw,
    }
  }

  return { type: 'food', items: [], confidence: 'low', raw }
}

// ── Food matching ───────────────────────────────────────────────────────────

function matchFoods(text: string): ParsedItem[] {
  const items: ParsedItem[] = []
  let remaining = text
  const quantities = extractQuantities(text)

  for (const entry of foodLookup) {
    const idx = remaining.indexOf(entry.phrase)
    if (idx === -1) continue

    const before = remaining.substring(0, idx)
    const nearbyQty = findNearestQuantity(quantities, idx, entry.phrase.length)

    const qty = nearbyQty?.value ?? null
    const unit = nearbyQty?.unit ?? entry.def.defaultUnit
    const calories = qty !== null ? Math.round(qty * entry.def.caloriesPer) : entry.def.caloriesPer

    items.push({
      name: formatName(entry.phrase),
      quantity: qty,
      unit,
      calories,
    })

    remaining = before + ' '.repeat(entry.phrase.length) + remaining.substring(idx + entry.phrase.length)
  }

  return items
}

// ── Activity matching ───────────────────────────────────────────────────────

function matchActivities(text: string): ParsedItem[] {
  const items: ParsedItem[] = []
  let remaining = text

  for (const entry of activityLookup) {
    const idx = remaining.indexOf(entry.phrase)
    if (idx === -1) continue

    const before = remaining.substring(0, idx)
    const durationMins = extractDurationMinutes(text)
    const mins = durationMins ?? entry.def.defaultMinutes
    const calories = Math.round(mins * entry.def.caloriesPerMinute)

    items.push({
      name: formatName(entry.phrase),
      quantity: mins,
      unit: 'min',
      calories,
    })

    remaining = before + ' '.repeat(entry.phrase.length) + remaining.substring(idx + entry.phrase.length)
  }

  return items
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function findNearestQuantity(
  quantities: QuantityMatch[],
  itemIndex: number,
  itemLength: number,
): QuantityMatch | null {
  let best: QuantityMatch | null = null
  let bestDist = Infinity

  for (const q of quantities) {
    const qEnd = q.index + q.length
    const dist = q.index < itemIndex
      ? itemIndex - qEnd
      : q.index - (itemIndex + itemLength)

    if (dist < bestDist && dist < 20) {
      bestDist = dist
      best = q
    }
  }
  return best
}

function formatName(phrase: string): string {
  return phrase.charAt(0).toUpperCase() + phrase.slice(1)
}
