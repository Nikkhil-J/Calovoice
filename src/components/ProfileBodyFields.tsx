import { Stack } from '@mui/material'
import type { Control } from 'react-hook-form'
import { spacing } from '../theme'
import type { ProfileFormValues } from '../schemas/profile'
import type { ActivityLevel, Sex } from '../types/profile'
import { ACTIVITY_LABELS } from '../utils/tdee'
import { RHFLabeledSelect } from './form/RHFLabeledSelect'
import { RHFNumericField } from './form/RHFNumericField'
import { MenuItem } from './LabeledSelect'

const ACTIVITY_ORDER: ActivityLevel[] = [
  'sedentary',
  'light',
  'moderate',
  'active',
  'extra_active',
]

export type ProfileBodyFieldsProps = {
  control: Control<ProfileFormValues>
  sexLabel?: string
  activityLabel?: string
  /** Two-column compact grid layout (used on Settings). */
  compact?: boolean
}

export function ProfileBodyFields({
  control,
  sexLabel = 'Sex (for BMR formula)',
  activityLabel = 'Activity level',
  compact = false,
}: ProfileBodyFieldsProps) {
  const stackSpacing = `${spacing.md + spacing.xs + spacing.xs}px`

  const sexField = (
    <RHFLabeledSelect<ProfileFormValues, Sex>
      name="sex"
      control={control}
      id="profile-sex"
      label={sexLabel}
    >
      <MenuItem value="male">Male</MenuItem>
      <MenuItem value="female">Female</MenuItem>
    </RHFLabeledSelect>
  )

  const ageField = (
    <RHFNumericField<ProfileFormValues>
      name="ageYears"
      control={control}
      id="profile-age"
      label="Age (years)"
      min={13}
      max={120}
      step={1}
    />
  )

  const heightField = (
    <RHFNumericField<ProfileFormValues>
      name="heightCm"
      control={control}
      id="profile-height"
      label="Height (cm)"
      min={50}
      max={280}
      step={1}
    />
  )

  const weightField = (
    <RHFNumericField<ProfileFormValues>
      name="weightKg"
      control={control}
      id="profile-weight"
      label="Weight (kg)"
      min={20}
      max={400}
      step={0.1}
    />
  )

  const activityField = (
    <RHFLabeledSelect<ProfileFormValues, ActivityLevel>
      name="activityLevel"
      control={control}
      id="profile-activity"
      label={activityLabel}
    >
      {ACTIVITY_ORDER.map((k) => (
        <MenuItem key={k} value={k}>
          {ACTIVITY_LABELS[k]}
        </MenuItem>
      ))}
    </RHFLabeledSelect>
  )

  if (compact) {
    return (
      <div className="profile-fields-grid">
        <div className="pf-row pf-two-col">
          {sexField}
          {ageField}
        </div>
        <div className="pf-row pf-two-col">
          {heightField}
          {weightField}
        </div>
        <div className="pf-row">
          {activityField}
        </div>
      </div>
    )
  }

  return (
    <Stack spacing={stackSpacing} sx={{ width: '100%' }}>
      {sexField}
      {ageField}
      {heightField}
      {weightField}
      {activityField}
    </Stack>
  )
}
