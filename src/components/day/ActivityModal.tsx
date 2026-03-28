import { memo } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import { useSheetAnimation } from '../../hooks/useSheetAnimation'
import { PRESET_ACTIVITIES } from '../../hooks/useEntryModals'
import type { BurnEntryFormValues } from '../../schemas/entry'
import { CalorieInput } from './CalorieInput'
import { ErrorBanner } from './ErrorBanner'

const ACTIVITY_EMOJI: Record<string, string> = {
  Running: '🏃',
  Walking: '🚶',
  Cycling: '🚴',
  Gym: '🏋️',
  Yoga: '🧘',
  Swimming: '🏊',
  Hiking: '🥾',
  Sports: '⚽',
}

interface ActivityModalProps {
  form: UseFormReturn<BurnEntryFormValues>
  onSave: () => void
  onClose: () => void
  errorBanner?: string | null
  onRetryVoice?: () => void
  onDismissError?: () => void
}

interface EditActivityModalProps {
  form: UseFormReturn<BurnEntryFormValues>
  onSave: () => void
  onClose: () => void
  onDelete: () => void
}

function ActivityChips({ form }: { form: UseFormReturn<BurnEntryFormValues> }) {
  const selected = form.watch('label')
  return (
    <div className="entry-chip-grid">
      {PRESET_ACTIVITIES.map((a) => (
        <button
          key={a}
          type="button"
          className={`entry-chip${selected === a ? ' active' : ''}`}
          onClick={() => form.setValue('label', selected === a ? '' : a)}
        >
          <span className="entry-chip-emoji">{ACTIVITY_EMOJI[a] ?? '🔥'}</span>
          {a}
        </button>
      ))}
    </div>
  )
}

export const AddActivityModal = memo(function AddActivityModal({
  form, onSave, onClose, errorBanner, onRetryVoice, onDismissError,
}: ActivityModalProps) {
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
            <div className="entry-sheet-icon burn">
              <ActivityIcon />
            </div>
            <div className="entry-sheet-header-text">
              <h3 className="entry-sheet-title">Log Activity</h3>
              <p className="entry-sheet-subtitle">Track calories burned</p>
            </div>
          </div>

          <ActivityChips form={form} />

          <div className="entry-sheet-or">
            <span className="entry-sheet-or-text">or type</span>
          </div>

          <div className="entry-sheet-field">
            <label className="entry-sheet-field-label">Describe your activity</label>
            <input
              className="entry-sheet-input blue-focus"
              placeholder="e.g. Jump rope, dancing"
              {...form.register('label')}
            />
          </div>

          <div className="entry-sheet-field">
            <label className="entry-sheet-field-label">Calories burned</label>
            <CalorieInput form={form} className="blue-focus" />
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

export const EditActivityModal = memo(function EditActivityModal({
  form, onSave, onClose, onDelete,
}: EditActivityModalProps) {
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
            <div className="entry-sheet-icon burn">
              <ActivityIcon />
            </div>
            <div className="entry-sheet-header-text">
              <h3 className="entry-sheet-title">Edit Activity</h3>
              <p className="entry-sheet-subtitle">Update this entry</p>
            </div>
          </div>

          <ActivityChips form={form} />

          <div className="entry-sheet-or">
            <span className="entry-sheet-or-text">or type</span>
          </div>

          <div className="entry-sheet-field">
            <label className="entry-sheet-field-label">Activity</label>
            <input
              className="entry-sheet-input blue-focus"
              placeholder="e.g. Jump rope, dancing"
              {...form.register('label')}
            />
          </div>

          <div className="entry-sheet-field">
            <label className="entry-sheet-field-label">Calories burned</label>
            <CalorieInput form={form} className="blue-focus" />
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

function ActivityIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="4" r="2.5" fill="currentColor" opacity="0.85"/>
      <path d="M15.9 8.1a1 1 0 0 0-1.4.1L12 11.5 9.5 8.2a1 1 0 0 0-1.4-.1 1 1 0 0 0-.1 1.4l2 2.6V16l-2.3 4a1 1 0 1 0 1.7 1l2.6-4.5 2.6 4.5a1 1 0 1 0 1.7-1L14 16v-3.9l2-2.6a1 1 0 0 0-.1-1.4z" fill="currentColor" opacity="0.85"/>
    </svg>
  )
}
