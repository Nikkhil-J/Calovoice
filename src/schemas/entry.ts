import { z } from 'zod'

export const foodEntrySchema = z.object({
  label: z.string(),
  quantity: z.string(),
  calories: z.string().regex(/^\d+$/, 'Calories required'),
})

export type FoodEntryFormValues = z.infer<typeof foodEntrySchema>

export const burnEntrySchema = z.object({
  label: z.string(),
  calories: z.string().regex(/^\d+$/, 'Calories required'),
})

export type BurnEntryFormValues = z.infer<typeof burnEntrySchema>
