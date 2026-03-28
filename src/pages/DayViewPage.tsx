import { useCallback, useEffect } from 'react'
import { useAppNavigation } from '../navigation/AppNavigationContext'
import { useDayLog } from '../hooks/useDayLog'
import { useProfile } from '../hooks/useProfile'
import { useCalorieSummary } from '../hooks/useCalorieSummary'
import { useInsightText } from '../hooks/useInsightText'
import { usePredictiveInsight } from '../hooks/usePredictiveInsight'
import { useTimeline, flatEntries } from '../hooks/useTimeline'
import { useVoiceLogging } from '../hooks/useVoiceLogging'
import { useEntryModals } from '../hooks/useEntryModals'
import { SmartSummaryCard } from '../components/day/SmartSummaryCard'
import { Timeline } from '../components/day/Timeline'
import { EmptyState } from '../components/day/EmptyState'
import { FloatingActions } from '../components/day/FloatingActions'
import { VoiceRecorder } from '../components/day/VoiceRecorder'
import { AddFoodModal, EditFoodModal } from '../components/day/FoodModal'
import { AddActivityModal, EditActivityModal } from '../components/day/ActivityModal'
import { uiTokens } from '../theme'
import {
  ChevronDownIcon,
  HeaderIconButton,
  PageHeader,
  SettingsIcon,
} from '../components/layout/PageHeader'
import {
  formatDateKeyLabel,
  getTodayDateKey,
  isFutureDateKey,
} from '../utils/dateKey'

const NOOP = () => {}

export function DayViewPage({
  uid,
  dateKey,
}: {
  uid: string
  dateKey: string
}) {
  const nav = useAppNavigation()
  const { profile, loading: pLoad } = useProfile(uid)
  const { day, loading: dLoad } = useDayLog(uid, dateKey)
  const isToday = dateKey === getTodayDateKey()

  const maintenance = profile?.maintenanceCalories ?? 0
  const summary = useCalorieSummary(day, maintenance)
  const insightText = useInsightText(summary, day.eatenEntries.length)
  const predictiveInsight = usePredictiveInsight(summary, day.eatenEntries.length)
  const grouped = useTimeline(day)

  const modals = useEntryModals(uid, dateKey)
  const voice = useVoiceLogging(uid, dateKey, (k) => {
    if (k === 'food') modals.setManualFood(true)
    else modals.setManualBurn(true)
  })

  const voiceStart = voice.start
  const handleLogFood = useCallback(() => {
    void voiceStart('food')
  }, [voiceStart])

  const handleLogActivity = useCallback(() => {
    void voiceStart('burn')
  }, [voiceStart])

  useEffect(() => {
    if (isFutureDateKey(dateKey)) nav.goToToday()
  }, [dateKey, nav])

  if (isFutureDateKey(dateKey)) {
    return <div className="page center"><div className="spinner" /></div>
  }

  if (pLoad || !profile) {
    return (
      <div className="page day-view">
        <PageHeader
          title={formatDateKeyLabel(dateKey)}
          reserveRightSlot
        />
        <section className="day-view-loading-shell" aria-hidden>
          <div className="skeleton skeleton-card day-view-loading-summary" />
          <div className="timeline-skeleton">
            <div className="skeleton skeleton-card" />
            <div className="skeleton skeleton-card" style={{ opacity: uiTokens.opacity.skeletonMedium }} />
            <div className="skeleton skeleton-card" style={{ opacity: uiTokens.opacity.timelineSkeletonTail }} />
          </div>
        </section>
        <FloatingActions
          onLogFood={NOOP}
          onLogActivity={NOOP}
          foodDisabled
          activityDisabled
        />
      </div>
    )
  }

  const hasEntries = flatEntries(grouped).length > 0

  const foodLabel = (() => {
    if (!isToday) return 'Add Meal'
    const h = new Date().getHours()
    if (h < 11) return 'Log Breakfast'
    if (h < 14) return 'Log Lunch'
    if (h < 17) return 'Log Snack'
    return 'Log Dinner'
  })()

  return (
    <div className="page day-view">
      {/* Header */}
      <PageHeader
        title={formatDateKeyLabel(dateKey)}
        onBack={!isToday ? () => nav.goToToday() : undefined}
        backIcon="home"
        backAriaLabel="Back to today"
        titleSuffix={(
          <button
            type="button"
            className="chevron-history-btn"
            onClick={() => nav.openHistory()}
            title="View history"
            aria-label="View history"
          >
            <ChevronDownIcon />
          </button>
        )}
        rightAction={(
          <HeaderIconButton
            onClick={() => nav.openSettings()}
            title="Settings"
            ariaLabel="Settings"
          >
            <SettingsIcon />
          </HeaderIconButton>
        )}
      />

      {/* Smart Summary */}
      <SmartSummaryCard
        summary={summary}
        insightText={insightText}
        predictiveInsight={predictiveInsight}
      />

      {/* Timeline or Empty State */}
      {hasEntries ? (
        <Timeline
          grouped={grouped}
          loading={dLoad}
          onEditFood={modals.openEditFood}
          onEditBurn={modals.openEditBurn}
        />
      ) : dLoad ? (
        <div className="timeline-skeleton">
          <div className="skeleton skeleton-card" />
          <div className="skeleton skeleton-card" style={{ opacity: uiTokens.opacity.skeletonMedium }} />
        </div>
      ) : (
        <EmptyState onQuickAdd={modals.openManualFoodWithLabel} />
      )}

      {/* Floating Action Bar */}
      <FloatingActions
        onLogFood={handleLogFood}
        onLogActivity={handleLogActivity}
        foodLabel={foodLabel}
      />

      {/* Modals */}
      {modals.manualFood && (
        <AddFoodModal
          form={modals.foodForm}
          onSave={modals.submitManualFood} onClose={modals.closeManualFood}
          errorBanner={modals.errorBanner}
          onRetryVoice={() => { modals.closeManualFood(); void voice.start('food') }}
          onDismissError={() => modals.setErrorBanner(null)}
        />
      )}

      {modals.manualBurn && (
        <AddActivityModal
          form={modals.burnForm}
          onSave={modals.submitManualBurn} onClose={modals.closeManualBurn}
          errorBanner={modals.errorBanner}
          onRetryVoice={() => { modals.closeManualBurn(); void voice.start('burn') }}
          onDismissError={() => modals.setErrorBanner(null)}
        />
      )}

      {modals.editFood && (
        <EditFoodModal
          form={modals.foodForm}
          onSave={modals.saveEditFood} onClose={modals.closeEditFood}
          onDelete={() => { modals.handleDeleteFood(modals.editFood!.id); modals.closeEditFood() }}
        />
      )}

      {modals.editBurn && (
        <EditActivityModal
          form={modals.burnForm}
          onSave={modals.saveEditBurn} onClose={modals.closeEditBurn}
          onDelete={() => { modals.handleDeleteBurn(modals.editBurn!.id); modals.closeEditBurn() }}
        />
      )}

      {/* Voice Sheet / Overlay */}
      {voice.phase !== 'idle' && voice.kind && (
        <VoiceRecorder
          phase={voice.phase}
          kind={voice.kind}
          transcript={voice.transcript}
          submittedText={voice.submittedText}
          amplitude={voice.amplitude}
          result={voice.result}
          error={voice.error}
          saving={voice.saving}
          onSubmit={voice.submit}
          onStop={voice.stop}
          onCancel={voice.cancel}
          onUpdateItem={voice.updateItem}
          onRemoveItem={voice.removeItem}
          onAddItem={voice.addItem}
          onSave={voice.save}
          onFallbackManual={() => {
            const k = voice.kind ?? 'food'
            voice.cancel()
            if (k === 'food') modals.setManualFood(true)
            else modals.setManualBurn(true)
          }}
        />
      )}
    </div>
  )
}
