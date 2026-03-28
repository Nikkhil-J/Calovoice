import { useRef, useCallback, useMemo } from 'react'
import { BottomSheet, useBottomSheetClose } from './BottomSheet'
import type { ParseResult, ParsedItem } from '../../services/parser'

interface ResultFormProps {
  kind: 'food' | 'burn'
  result: ParseResult
  error: string | null
  saving: boolean
  onUpdateItem: (index: number, patch: Partial<ParsedItem>) => void
  onRemoveItem: (index: number) => void
  onAddItem: () => void
  onSave: () => void
  onCancel: () => void
}

export function ResultForm({
  kind,
  result,
  error,
  saving,
  onUpdateItem,
  onRemoveItem,
  onAddItem,
  onSave,
  onCancel,
}: ResultFormProps) {
  const items = result.items

  const nameRefs = useRef<(HTMLInputElement | null)[]>([])
  const calRefs = useRef<(HTMLInputElement | null)[]>([])

  const setNameRef = useCallback((i: number) => (el: HTMLInputElement | null) => {
    nameRefs.current[i] = el
  }, [])

  const setCalRef = useCallback((i: number) => (el: HTMLInputElement | null) => {
    calRefs.current[i] = el
  }, [])

  const handleAddAndFocus = useCallback(() => {
    onAddItem()
    requestAnimationFrame(() => {
      const next = nameRefs.current[items.length]
      next?.focus()
    })
  }, [onAddItem, items.length])

  const handleNameKeyDown = useCallback((e: React.KeyboardEvent, i: number) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      calRefs.current[i]?.focus()
    }
    if (e.key === 'Backspace' && items[i]?.name === '' && items.length > 1) {
      e.preventDefault()
      onRemoveItem(i)
      requestAnimationFrame(() => {
        const target = i > 0 ? calRefs.current[i - 1] : nameRefs.current[0]
        target?.focus()
      })
    }
  }, [items, onRemoveItem])

  const handleCalKeyDown = useCallback((e: React.KeyboardEvent, i: number) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (i === items.length - 1) {
        handleAddAndFocus()
      } else {
        nameRefs.current[i + 1]?.focus()
      }
    }
  }, [items.length, handleAddAndFocus])

  const totalCalories = useMemo(() => {
    let sum = 0
    let count = 0
    for (const item of items) {
      if (item.calories !== null) {
        sum += item.calories
        count++
      }
    }
    return count > 0 && items.length >= 2 ? sum : null
  }, [items])

  return (
    <BottomSheet onClose={onCancel}>
      <ResultFormContent
        kind={kind}
        items={items}
        error={error}
        saving={saving}
        totalCalories={totalCalories}
        setNameRef={setNameRef}
        setCalRef={setCalRef}
        onUpdateItem={onUpdateItem}
        handleNameKeyDown={handleNameKeyDown}
        handleCalKeyDown={handleCalKeyDown}
        onRemoveItem={onRemoveItem}
        handleAddAndFocus={handleAddAndFocus}
        onSave={onSave}
      />
    </BottomSheet>
  )
}

interface ResultFormContentProps {
  kind: 'food' | 'burn'
  items: ParsedItem[]
  error: string | null
  saving: boolean
  totalCalories: number | null
  setNameRef: (i: number) => (el: HTMLInputElement | null) => void
  setCalRef: (i: number) => (el: HTMLInputElement | null) => void
  onUpdateItem: (index: number, patch: Partial<ParsedItem>) => void
  handleNameKeyDown: (e: React.KeyboardEvent, i: number) => void
  handleCalKeyDown: (e: React.KeyboardEvent, i: number) => void
  onRemoveItem: (index: number) => void
  handleAddAndFocus: () => void
  onSave: () => void
}

function ResultFormContent({
  kind,
  items,
  error,
  saving,
  totalCalories,
  setNameRef,
  setCalRef,
  onUpdateItem,
  handleNameKeyDown,
  handleCalKeyDown,
  onRemoveItem,
  handleAddAndFocus,
  onSave,
}: ResultFormContentProps) {
  const requestClose = useBottomSheetClose()
  const isFood = kind === 'food'

  return (
    <>
      <h3>{isFood ? 'Log food' : 'Log activity'}</h3>

      {items.length === 0 && (
        <p className="voice-result-empty">
          Nothing detected — add an item below.
        </p>
      )}

      {items.length > 0 && (
        <div className="food-list">
          <div className="food-header" role="row" aria-hidden>
            <span>{isFood ? 'Item' : 'Activity'}</span>
            <span>Cal</span>
            <span />
          </div>

          {items.map((item, i) => (
            <div key={i} className="food-row" role="row">
              <input
                ref={setNameRef(i)}
                className="food-input"
                placeholder={isFood ? 'e.g. Chicken salad' : 'e.g. Running'}
                autoComplete="off"
                autoFocus={i === 0}
                aria-label={isFood ? `Item ${i + 1} name` : `Activity ${i + 1} name`}
                value={item.name}
                onChange={(e) => onUpdateItem(i, { name: e.target.value })}
                onKeyDown={(e) => handleNameKeyDown(e, i)}
              />
              <input
                ref={setCalRef(i)}
                className="food-input food-input-cal"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                enterKeyHint="next"
                placeholder="kcal"
                aria-label={`Item ${i + 1} calories`}
                value={item.calories === null ? '' : String(item.calories)}
                onChange={(e) => {
                  const v = e.target.value
                  if (!/^\d*$/.test(v)) return
                  onUpdateItem(i, {
                    calories: v === '' ? null : Math.round(Number(v)),
                  })
                }}
                onKeyDown={(e) => handleCalKeyDown(e, i)}
              />
              {items.length > 1 ? (
                <button
                  type="button"
                  className="food-remove-btn"
                  aria-label={`Remove item ${i + 1}`}
                  onClick={() => onRemoveItem(i)}
                >
                  &times;
                </button>
              ) : (
                <span className="food-remove-btn" aria-hidden />
              )}
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        className="food-add-btn"
        onClick={handleAddAndFocus}
      >
        + Add item
      </button>

      {totalCalories !== null && (
        <div className="food-total">
          Total: <span className="food-total-value">{totalCalories} kcal</span>
        </div>
      )}

      {error && <p className="error">{error}</p>}

      <div className="row">
        <button
          type="button"
          className="btn primary"
          disabled={saving}
          onClick={() => void onSave()}
        >
          {saving ? 'Saving\u2026' : 'Save'}
        </button>
        <button type="button" className="btn ghost" onClick={requestClose ?? undefined}>
          Cancel
        </button>
      </div>
    </>
  )
}
