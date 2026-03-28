import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { RHFNumericField } from '../components/form/RHFNumericField'
import { ProfileBodyFields } from '../components/ProfileBodyFields'
import { SuggestedCalorieGoal } from '../components/SuggestedCalorieGoal'
import { useAppNavigation } from '../navigation/AppNavigationContext'
import { deleteUser, signOut } from 'firebase/auth'
import { auth } from '../firebase'
import { saveProfile } from '../firestore/profile'
import { PageHeader } from '../components/layout/PageHeader'
import { profileSchema, type ProfileFormValues } from '../schemas/profile'
import { colors, spacing } from '../theme'
import type { ProfileSettings } from '../types/profile'
import { computeTdeeSuggested } from '../utils/tdee'

const settingsStyles = {
  successButton: {
    background: colors.positiveLight,
    color: colors.positiveDark,
    borderColor: 'transparent',
  },
  busyWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: `${spacing.sm}px`,
  },
  busySpinner: {
    width: '1rem',
    height: '1rem',
    borderWidth: '2px',
  },
} as const

type SavedProfileBaseline = Pick<
  ProfileSettings,
  'sex' | 'ageYears' | 'heightCm' | 'weightKg' | 'activityLevel' | 'maintenanceCalories'
>

function toSavedProfileBaseline(
  values: Pick<
    ProfileSettings,
    'sex' | 'ageYears' | 'heightCm' | 'weightKg' | 'activityLevel' | 'maintenanceCalories'
  >,
): SavedProfileBaseline {
  return {
    sex: values.sex,
    ageYears: Math.round(values.ageYears),
    heightCm: values.heightCm,
    weightKg: values.weightKg,
    activityLevel: values.activityLevel,
    maintenanceCalories: Math.round(values.maintenanceCalories),
  }
}

export function SettingsPage({
  uid,
  initial,
}: {
  uid: string
  initial: ProfileSettings
}) {
  const nav = useAppNavigation()

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      sex: initial.sex,
      ageYears: initial.ageYears,
      heightCm: initial.heightCm,
      weightKg: initial.weightKg,
      activityLevel: initial.activityLevel,
      maintenanceCalories: initial.maintenanceCalories,
      tdeeSuggested: initial.tdeeSuggested,
    },
    mode: 'onChange',
  })

  const { control, watch, setValue, handleSubmit, formState } = form
  const sex = watch('sex')
  const ageYears = watch('ageYears')
  const heightCm = watch('heightCm')
  const weightKg = watch('weightKg')
  const activityLevel = watch('activityLevel')
  const maintenanceCalories = watch('maintenanceCalories')

  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [savedBaseline, setSavedBaseline] = useState<SavedProfileBaseline>(
    () => toSavedProfileBaseline(initial),
  )

  const liveSuggested = useMemo(
    () => computeTdeeSuggested(sex, weightKg, heightCm, ageYears, activityLevel),
    [sex, weightKg, heightCm, ageYears, activityLevel],
  )
  const hasProfileChanges =
    sex !== savedBaseline.sex
    || ageYears !== savedBaseline.ageYears
    || heightCm !== savedBaseline.heightCm
    || weightKg !== savedBaseline.weightKg
    || activityLevel !== savedBaseline.activityLevel
    || maintenanceCalories !== savedBaseline.maintenanceCalories

  const saveProfileClick = handleSubmit(async (data) => {
    setBusy(true)
    setSaved(false)
    setSaveError(null)
    try {
      const live = computeTdeeSuggested(data.sex, data.weightKg, data.heightCm, data.ageYears, data.activityLevel)
      const profileToSave = {
        ...data,
        ageYears: Math.round(data.ageYears),
        maintenanceCalories: Math.round(data.maintenanceCalories),
        tdeeSuggested: live,
      }
      await saveProfile(uid, { ...profileToSave })
      setSavedBaseline(toSavedProfileBaseline(profileToSave))
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Failed to save profile')
    } finally {
      setBusy(false)
    }
  })

  const resetAll = async () => {
    if (
      !confirm(
        'Reset app? This signs you out and removes the Firebase user. Your data may remain.',
      )
    )
      return
    const u = auth.currentUser
    if (u) {
      try {
        await deleteUser(u)
      } catch {
        await signOut(auth)
      }
    }
    window.location.href = import.meta.env.BASE_URL || '/'
  }

  return (
    <div className="page settings">

      {/* Header */}
      <PageHeader
        title="Settings"
        subtitle="Profile & preferences"
        onBack={() => nav.pop()}
        reserveRightSlot
      />

      {/* Profile section */}
      <section className="settings-section">
        <div className="settings-section-head">Profile</div>
        <div className="settings-section-body">
          <ProfileBodyFields
            control={control}
            sexLabel="Sex"
            activityLabel="Activity level"
            compact
          />

          <SuggestedCalorieGoal
            liveSuggested={liveSuggested}
            maintenanceCalories={maintenanceCalories}
            onUseSuggested={() => setValue('maintenanceCalories', liveSuggested)}
          />

          <RHFNumericField<ProfileFormValues>
            name="maintenanceCalories"
            control={control}
            id="settings-goal"
            label="Daily calorie goal"
            helperText="Adjust if you want a different target."
            min={500}
            max={20000}
            step={1}
          />

          {saveError && (
            <p className="disclaimer small" role="alert" style={{ color: colors.negative }}>
              {saveError}
            </p>
          )}

          <button
            type="button"
            className={`btn full lg${busy ? '' : saved ? ' ghost' : ' primary'}`}
          disabled={busy || !formState.isValid || !hasProfileChanges}
            onClick={() => void saveProfileClick()}
            style={saved ? settingsStyles.successButton : undefined}
          >
            {busy ? (
              <span style={settingsStyles.busyWrap}>
                <span className="spinner" style={settingsStyles.busySpinner} />
                Saving…
              </span>
            ) : saved ? (
              '✓ Saved'
            ) : (
              'Save profile'
            )}
          </button>
        </div>
      </section>

      {/* Danger zone — minimal inline row */}
      <div className="settings-danger-row">
        <div className="settings-danger-left">
          <span className="settings-danger-title">Reset app data</span>
          <span className="settings-danger-sub">
            Signs out &amp; removes your account. Cannot be undone.
          </span>
        </div>
        <button
          type="button"
          className="btn-settings-danger"
          onClick={() => void resetAll()}
        >
          Reset
        </button>
      </div>

      <p className="disclaimer small">Estimates only — not medical advice.</p>
    </div>
  )
}
