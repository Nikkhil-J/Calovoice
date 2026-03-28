import { useId, useRef, useState } from 'react'
import { Stack, TextField, Typography } from '@mui/material'
import { colors, radius, sizes, spacing, typography as typeScale } from '../theme'

const fieldStyles = {
  stackSpacing: `${spacing.sm - spacing.xs}px`,
  rootRadius: `${radius.sm}px`,
  inputPaddingY: `${spacing.sm + spacing.xxs}px`,
  inputPaddingX: `${spacing.md - spacing.xs}px`,
  fullWidth: '100%',
  labelWeight: typeScale.title.fontWeight,
  inputFontSize: '1rem',
  inputWeight: typeScale.body.fontWeight,
  helperDisplay: 'block',
} as const

export type NumericFieldProps = {
  id?: string
  name?: string
  label: string
  helperText?: string
  value: number
  onChange: (v: number) => void
  min: number
  max: number
  step?: number
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

function isDecimalStep(step: number) {
  return step < 1 || step % 1 !== 0
}

function decimalPlacesFromStep(step: number): number {
  if (!isDecimalStep(step)) return 0
  const s = String(step)
  const dot = s.indexOf('.')
  return dot === -1 ? 0 : s.length - dot - 1
}

function trimTrailingZeros(s: string): string {
  if (!s.includes('.')) return s
  const t = s.replace(/\.?0+$/, '')
  return t === '' ? '0' : t
}

/** Stable string shown when the field is not being edited. */
function formatNumericDisplay(n: number, step: number): string {
  if (!Number.isFinite(n)) return ''
  if (!isDecimalStep(step)) return String(Math.round(n))
  const places = decimalPlacesFromStep(step)
  return trimTrailingZeros(n.toFixed(Math.min(places, 10)))
}

function allowsPartialDecimal(raw: string): boolean {
  return /^\d*\.?\d*$/.test(raw)
}

function allowsPartialInteger(raw: string): boolean {
  return /^\d*$/.test(raw)
}

/** Parse a finished edit; empty or incomplete decimals → null (revert display, no onChange). */
function parseCommitted(raw: string): number | null {
  const t = raw.trim()
  if (t === '' || t === '.') return null
  const n = Number(t)
  return Number.isFinite(n) ? n : null
}

/**
 * Controlled numeric input with local string state while focused so backspace,
 * partial decimals, and empty states behave like a normal text field. Valid
 * numeric drafts are pushed to the parent immediately; blur/Enter still
 * performs final clamped commit and display normalization.
 */
export function NumericField({
  id: propId,
  name,
  label,
  helperText,
  value,
  onChange,
  min,
  max,
  step = 1,
}: NumericFieldProps) {
  const safe = Number.isFinite(value) ? value : min
  const allowDecimal = isDecimalStep(step)
  const reactId = useId()
  const fieldId = propId ?? `num-${reactId.replace(/:/g, '')}`
  const inputMode = allowDecimal ? 'decimal' : 'numeric'

  const [draft, setDraft] = useState<string | null>(null)
  /** Latest string to commit on blur (updated in handlers; avoids stale refs vs. state). */
  const draftForCommitRef = useRef<string | null>(null)

  const skipCommitOnNextBlur = useRef(false)

  const committedLabel = formatNumericDisplay(safe, step)
  const inputValue = draft !== null ? draft : committedLabel

  const commitFromDraft = () => {
    const raw = draftForCommitRef.current
    draftForCommitRef.current = null
    setDraft(null)
    if (raw === null) return
    const parsed = parseCommitted(raw)
    if (parsed === null) return
    onChange(clamp(parsed, min, max))
  }

  const handleFocus = () => {
    const s = formatNumericDisplay(safe, step)
    draftForCommitRef.current = s
    setDraft(s)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value
    const ok = allowDecimal
      ? allowsPartialDecimal(next)
      : allowsPartialInteger(next)
    if (!ok) return
    draftForCommitRef.current = next
    setDraft(next)
    const parsed = parseCommitted(next)
    if (parsed !== null) onChange(parsed)
  }

  const handleBlur = () => {
    if (skipCommitOnNextBlur.current) {
      skipCommitOnNextBlur.current = false
      draftForCommitRef.current = null
      setDraft(null)
      return
    }
    commitFromDraft()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      e.currentTarget.blur()
      return
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      skipCommitOnNextBlur.current = true
      draftForCommitRef.current = null
      setDraft(null)
      e.currentTarget.blur()
    }
  }

  return (
    <Stack spacing={fieldStyles.stackSpacing} sx={{ width: fieldStyles.fullWidth }}>
      <Typography
        component="label"
        htmlFor={fieldId}
        variant="body2"
        sx={{ fontWeight: fieldStyles.labelWeight, color: 'text.secondary' }}
      >
        {label}
      </Typography>
      <TextField
        id={fieldId}
        name={name}
        type="text"
        value={inputValue}
        variant="outlined"
        hiddenLabel
        fullWidth
        size="medium"
        onFocus={handleFocus}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        slotProps={{
          htmlInput: {
            inputMode,
            'aria-label': label,
            autoComplete: 'off',
            enterKeyHint: 'done',
          },
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: fieldStyles.rootRadius,
            bgcolor: 'background.paper',
            minHeight: sizes.inputMinHeight,
            transition: (t) =>
              t.transitions.create(['border-color', 'box-shadow'], {
                duration: t.transitions.duration.short,
              }),
            '& fieldset': {
              borderColor: colors.divider,
            },
            '&:hover fieldset': {
              borderColor: colors.dividerHover,
            },
            '&.Mui-focused fieldset': {
              borderWidth: sizes.borderStrong,
              borderColor: 'primary.main',
            },
          },
          '& input': {
            textAlign: 'start',
            fontSize: fieldStyles.inputFontSize,
            fontWeight: fieldStyles.inputWeight,
            py: fieldStyles.inputPaddingY,
            px: fieldStyles.inputPaddingX,
            color: 'text.primary',
          },
        }}
      />
      {helperText ? (
        <Typography variant="caption" color="text.secondary" sx={{ display: fieldStyles.helperDisplay }}>
          {helperText}
        </Typography>
      ) : null}
    </Stack>
  )
}
