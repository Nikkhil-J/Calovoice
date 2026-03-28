import { doc, runTransaction, type Transaction } from 'firebase/firestore'
import { db } from '../firebase'
import type { BurnEntry, DayDocument, FoodEntry } from '../types/dayLog'

export function dayDocRef(uid: string, dateKey: string) {
  return doc(db, 'users', uid, 'days', dateKey)
}

const EMPTY_DAY: DayDocument = { eatenEntries: [], burnedEntries: [] }

async function withDayTransaction(
  uid: string,
  dateKey: string,
  fn: (tx: Transaction, prev: DayDocument, exists: boolean) => void,
): Promise<void> {
  const ref = dayDocRef(uid, dateKey)
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref)
    const exists = snap.exists()
    const prev = exists ? (snap.data() as DayDocument) : EMPTY_DAY
    fn(tx, prev, exists)
  })
}

export async function appendFoodEntries(
  uid: string,
  dateKey: string,
  entries: FoodEntry[],
): Promise<void> {
  const ref = dayDocRef(uid, dateKey)
  await withDayTransaction(uid, dateKey, (tx, prev) => {
    tx.set(ref, {
      eatenEntries: [...(prev.eatenEntries ?? []), ...entries],
      burnedEntries: prev.burnedEntries ?? [],
    })
  })
}

export async function appendBurnEntries(
  uid: string,
  dateKey: string,
  entries: BurnEntry[],
): Promise<void> {
  const ref = dayDocRef(uid, dateKey)
  await withDayTransaction(uid, dateKey, (tx, prev) => {
    tx.set(ref, {
      eatenEntries: prev.eatenEntries ?? [],
      burnedEntries: [...(prev.burnedEntries ?? []), ...entries],
    })
  })
}

export async function updateFoodEntry(
  uid: string,
  dateKey: string,
  id: string,
  patch: Partial<Pick<FoodEntry, 'label' | 'calories' | 'quantity'>>,
): Promise<void> {
  const ref = dayDocRef(uid, dateKey)
  await withDayTransaction(uid, dateKey, (tx, prev, exists) => {
    if (!exists) return
    const eaten = (prev.eatenEntries ?? []).map((e) =>
      e.id === id ? { ...e, ...patch, updatedAt: Date.now() } : e,
    )
    tx.update(ref, { eatenEntries: eaten })
  })
}

export async function deleteFoodEntry(
  uid: string,
  dateKey: string,
  id: string,
): Promise<void> {
  const ref = dayDocRef(uid, dateKey)
  await withDayTransaction(uid, dateKey, (tx, prev, exists) => {
    if (!exists) return
    tx.update(ref, {
      eatenEntries: (prev.eatenEntries ?? []).filter((e) => e.id !== id),
    })
  })
}

export async function updateBurnEntry(
  uid: string,
  dateKey: string,
  id: string,
  patch: Partial<Pick<BurnEntry, 'calories' | 'label'>>,
): Promise<void> {
  const ref = dayDocRef(uid, dateKey)
  await withDayTransaction(uid, dateKey, (tx, prev, exists) => {
    if (!exists) return
    const burned = (prev.burnedEntries ?? []).map((e) =>
      e.id === id ? { ...e, ...patch, updatedAt: Date.now() } : e,
    )
    tx.update(ref, { burnedEntries: burned })
  })
}

export async function deleteBurnEntry(
  uid: string,
  dateKey: string,
  id: string,
): Promise<void> {
  const ref = dayDocRef(uid, dateKey)
  await withDayTransaction(uid, dateKey, (tx, prev, exists) => {
    if (!exists) return
    tx.update(ref, {
      burnedEntries: (prev.burnedEntries ?? []).filter((e) => e.id !== id),
    })
  })
}
