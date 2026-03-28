export interface FoodEntry {
  id: string
  label: string
  /** Serving / amount (e.g. "1 small bag") — optional. */
  quantity?: string
  calories: number
  source: 'voice' | 'manual'
  createdAt: number
  updatedAt?: number
  rawTranscript?: string
}

export interface BurnEntry {
  id: string
  label?: string
  calories: number
  source: 'voice' | 'manual'
  createdAt: number
  updatedAt?: number
  rawTranscript?: string
}

export interface DayDocument {
  eatenEntries: FoodEntry[]
  burnedEntries: BurnEntry[]
}
