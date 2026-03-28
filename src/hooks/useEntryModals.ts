import { zodResolver } from '@hookform/resolvers/zod'
import { useCallback, useState } from 'react'
import { useForm } from 'react-hook-form'
import {
  appendFoodEntries,
  appendBurnEntries,
  updateFoodEntry,
  updateBurnEntry,
  deleteFoodEntry,
  deleteBurnEntry,
} from '../firestore/dayLog'
import {
  foodEntrySchema,
  burnEntrySchema,
  type FoodEntryFormValues,
  type BurnEntryFormValues,
} from '../schemas/entry'
import type { BurnEntry, FoodEntry } from '../types/dayLog'

export const PRESET_ACTIVITIES = [
  'Running', 'Walking', 'Cycling', 'Gym',
  'Yoga', 'Swimming', 'Hiking', 'Sports',
] as const

const FOOD_DEFAULTS: FoodEntryFormValues = { label: '', quantity: '', calories: '' }
const BURN_DEFAULTS: BurnEntryFormValues = { label: '', calories: '' }

export function useEntryModals(uid: string, dateKey: string) {
  const [manualFood, setManualFood] = useState(false)
  const [manualBurn, setManualBurn] = useState(false)
  const [editFood, setEditFood] = useState<FoodEntry | null>(null)
  const [editBurn, setEditBurn] = useState<BurnEntry | null>(null)
  const [errorBanner, setErrorBanner] = useState<string | null>(null)

  const foodForm = useForm<FoodEntryFormValues>({
    resolver: zodResolver(foodEntrySchema),
    defaultValues: FOOD_DEFAULTS,
  })

  const burnForm = useForm<BurnEntryFormValues>({
    resolver: zodResolver(burnEntrySchema),
    defaultValues: BURN_DEFAULTS,
  })

  const submitManualFood = foodForm.handleSubmit(async (data) => {
    try {
      const c = Math.round(Number(data.calories))
      const entry: FoodEntry = {
        id: crypto.randomUUID(),
        label: data.label.trim() || 'Food',
        calories: c,
        source: 'manual',
        createdAt: Date.now(),
      }
      await appendFoodEntries(uid, dateKey, [entry])
      foodForm.reset(FOOD_DEFAULTS)
      setManualFood(false)
      setErrorBanner(null)
    } catch (e) {
      setErrorBanner(e instanceof Error ? e.message : 'Failed to save food entry')
    }
  })

  const submitManualBurn = burnForm.handleSubmit(async (data) => {
    try {
      const c = Math.round(Number(data.calories))
      const entry: BurnEntry = {
        id: crypto.randomUUID(),
        label: data.label.trim() || undefined,
        calories: c,
        source: 'manual',
        createdAt: Date.now(),
      }
      await appendBurnEntries(uid, dateKey, [entry])
      burnForm.reset(BURN_DEFAULTS)
      setManualBurn(false)
      setErrorBanner(null)
    } catch (e) {
      setErrorBanner(e instanceof Error ? e.message : 'Failed to save activity entry')
    }
  })

  const saveEditFood = foodForm.handleSubmit(async (data) => {
    if (!editFood) return
    try {
      const c = Math.round(Number(data.calories))
      await updateFoodEntry(uid, dateKey, editFood.id, {
        label: data.label.trim() || editFood.label,
        calories: c,
        ...(data.quantity.trim() ? { quantity: data.quantity.trim() } : {}),
      })
      setEditFood(null)
      foodForm.reset(FOOD_DEFAULTS)
    } catch (e) {
      setErrorBanner(e instanceof Error ? e.message : 'Failed to update food entry')
    }
  })

  const saveEditBurn = burnForm.handleSubmit(async (data) => {
    if (!editBurn) return
    try {
      const c = Math.round(Number(data.calories))
      await updateBurnEntry(uid, dateKey, editBurn.id, {
        calories: c,
        label: data.label.trim() || undefined,
      })
      setEditBurn(null)
      burnForm.reset(BURN_DEFAULTS)
    } catch (e) {
      setErrorBanner(e instanceof Error ? e.message : 'Failed to update activity entry')
    }
  })

  const openEditFood = useCallback((e: FoodEntry) => {
    setEditFood(e)
    foodForm.reset({ label: e.label, quantity: e.quantity ?? '', calories: String(e.calories) })
  }, [foodForm])

  const openEditBurn = useCallback((e: BurnEntry) => {
    setEditBurn(e)
    burnForm.reset({ label: e.label ?? '', calories: String(e.calories) })
  }, [burnForm])

  const closeManualFood = useCallback(() => {
    setManualFood(false)
    foodForm.reset(FOOD_DEFAULTS)
    setErrorBanner(null)
  }, [foodForm])

  const closeManualBurn = useCallback(() => {
    setManualBurn(false)
    burnForm.reset(BURN_DEFAULTS)
    setErrorBanner(null)
  }, [burnForm])

  const closeEditFood = useCallback(() => {
    setEditFood(null)
    foodForm.reset(FOOD_DEFAULTS)
  }, [foodForm])

  const closeEditBurn = useCallback(() => {
    setEditBurn(null)
    burnForm.reset(BURN_DEFAULTS)
  }, [burnForm])

  const handleDeleteFood = useCallback((id: string) => {
    void deleteFoodEntry(uid, dateKey, id).catch((e) => {
      setErrorBanner(e instanceof Error ? e.message : 'Failed to delete food entry')
    })
  }, [uid, dateKey])

  const handleDeleteBurn = useCallback((id: string) => {
    void deleteBurnEntry(uid, dateKey, id).catch((e) => {
      setErrorBanner(e instanceof Error ? e.message : 'Failed to delete activity entry')
    })
  }, [uid, dateKey])

  const openManualFoodWithLabel = useCallback((label: string) => {
    foodForm.setValue('label', label)
    setManualFood(true)
  }, [foodForm])

  const openManualWithError = useCallback((kind: 'food' | 'burn', msg: string) => {
    setErrorBanner(msg)
    if (kind === 'food') setManualFood(true)
    else setManualBurn(true)
  }, [])

  return {
    manualFood, manualBurn, editFood, editBurn, errorBanner,
    foodForm, burnForm,
    setManualFood, setManualBurn, setErrorBanner,
    submitManualFood, submitManualBurn, saveEditFood, saveEditBurn,
    openEditFood, openEditBurn, closeManualFood, closeManualBurn,
    closeEditFood, closeEditBurn, handleDeleteFood, handleDeleteBurn,
    openManualFoodWithLabel, openManualWithError,
  }
}
