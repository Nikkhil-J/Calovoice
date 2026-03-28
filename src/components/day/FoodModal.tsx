import { memo } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import { useSheetAnimation } from '../../hooks/useSheetAnimation'
import type { FoodEntryFormValues } from '../../schemas/entry'
import { CalorieInput } from './CalorieInput'
import { ErrorBanner } from './ErrorBanner'

interface FoodModalProps {
  form: UseFormReturn<FoodEntryFormValues>
  onSave: () => void
  onClose: () => void
  errorBanner?: string | null
  onRetryVoice?: () => void
  onDismissError?: () => void
}

interface EditFoodModalProps {
  form: UseFormReturn<FoodEntryFormValues>
  onSave: () => void
  onClose: () => void
  onDelete: () => void
}

export const AddFoodModal = memo(function AddFoodModal({
  form, onSave, onClose, errorBanner, onRetryVoice, onDismissError,
}: FoodModalProps) {
  const { closing, animateOut } = useSheetAnimation(onClose)

  const sheetClass = closing ? 'entry-sheet entry-sheet-exit' : 'entry-sheet'
  const backdropClass = closing ? 'entry-sheet-backdrop entry-sheet-backdrop-exit' : 'entry-sheet-backdrop'

  return (
    <>
      <div
        className={backdropClass}
        role="presentation"
        onClick={(e) => { if (e.target === e.currentTarget) animateOut() }}
      />
      <div className={sheetClass} role="dialog" aria-modal>
        <div className="modal-handle"><div className="modal-handle-bar" /></div>

        <div className="entry-sheet-body">
          {errorBanner && onRetryVoice && onDismissError && (
            <ErrorBanner message={errorBanner} onRetry={onRetryVoice} onDismiss={onDismissError} />
          )}

          <div className="entry-sheet-header">
            <div className="entry-sheet-icon food">
              <FoodIcon />
            </div>
            <div className="entry-sheet-header-text">
              <h3 className="entry-sheet-title">Add Food</h3>
              <p className="entry-sheet-subtitle">Log what you ate</p>
            </div>
          </div>

          <div className="entry-sheet-field">
            <label className="entry-sheet-field-label">Description</label>
            <input
              className="entry-sheet-input"
              placeholder="e.g. Chicken salad, rice bowl"
              autoFocus
              {...form.register('label')}
            />
          </div>

          <div className="entry-sheet-field">
            <label className="entry-sheet-field-label">Calories</label>
            <CalorieInput form={form} />
          </div>

          <div className="entry-sheet-actions">
            <button type="button" className="entry-sheet-pill cancel" onClick={animateOut}>
              Cancel
            </button>
            <button type="button" className="entry-sheet-pill save-food" onClick={() => void onSave()}>
              Save
            </button>
          </div>
        </div>
      </div>
    </>
  )
})

export const EditFoodModal = memo(function EditFoodModal({
  form, onSave, onClose, onDelete,
}: EditFoodModalProps) {
  const { closing, animateOut } = useSheetAnimation(onClose)

  const sheetClass = closing ? 'entry-sheet entry-sheet-exit' : 'entry-sheet'
  const backdropClass = closing ? 'entry-sheet-backdrop entry-sheet-backdrop-exit' : 'entry-sheet-backdrop'

  return (
    <>
      <div
        className={backdropClass}
        role="presentation"
        onClick={(e) => { if (e.target === e.currentTarget) animateOut() }}
      />
      <div className={sheetClass} role="dialog" aria-modal>
        <div className="modal-handle"><div className="modal-handle-bar" /></div>

        <div className="entry-sheet-body">
          <div className="entry-sheet-header">
            <div className="entry-sheet-icon food">
              <FoodIcon />
            </div>
            <div className="entry-sheet-header-text">
              <h3 className="entry-sheet-title">Edit Food</h3>
              <p className="entry-sheet-subtitle">Update this entry</p>
            </div>
          </div>

          <div className="entry-sheet-field">
            <label className="entry-sheet-field-label">Item</label>
            <input className="entry-sheet-input" {...form.register('label')} />
          </div>

          <div className="entry-sheet-field">
            <label className="entry-sheet-field-label">Quantity</label>
            <input
              className="entry-sheet-input"
              placeholder="e.g. 1 small bowl"
              {...form.register('quantity')}
            />
          </div>

          <div className="entry-sheet-field">
            <label className="entry-sheet-field-label">Calories</label>
            <CalorieInput form={form} />
          </div>

          <div className="entry-sheet-actions">
            <button type="button" className="entry-sheet-pill save-food" onClick={() => void onSave()}>
              Save
            </button>
            <button type="button" className="entry-sheet-pill delete" onClick={onDelete}>
              Delete
            </button>
            <button type="button" className="entry-sheet-pill cancel" onClick={animateOut}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </>
  )
})

function FoodIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M18 3a1 1 0 0 1 1 1v4a4 4 0 0 1-3 3.874V20a1 1 0 1 1-2 0v-8.126A4 4 0 0 1 11 8V4a1 1 0 1 1 2 0v4a2 2 0 0 0 1 1.732V4a1 1 0 1 1 2 0v5.732A2 2 0 0 0 17 8V4a1 1 0 0 1 1-1zM5 3a1 1 0 0 1 1 1v6h1V4a1 1 0 1 1 2 0v6h1V4a1 1 0 1 1 2 0v7a3 3 0 0 1-2 2.83V20a1 1 0 1 1-2 0v-6.17A3 3 0 0 1 4 11V4a1 1 0 0 1 1-1z" fill="currentColor" opacity="0.85"/>
    </svg>
  )
}
