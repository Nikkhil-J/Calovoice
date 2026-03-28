import type { BurnEntry, FoodEntry } from './dayLog'

export type TimelineEntry =
  | { kind: 'food'; entry: FoodEntry }
  | { kind: 'burn'; entry: BurnEntry }

export type CalorieStatus = 'on-track' | 'over' | 'under'
