import {
  FormControl,
  MenuItem,
  Select,
  Stack,
  Typography,
  type SelectChangeEvent,
} from '@mui/material'
import type { ReactNode } from 'react'
import { colors, radius, shadows, sizes, spacing, typography } from '../theme'

const selectStyles = {
  stackSpacing: `${spacing.sm - spacing.xs}px`,
  rootRadius: `${radius.sm}px`,
  menuMarginTop: `${spacing.xs}px`,
  selectPaddingY: `${spacing.sm + spacing.xxs}px`,
  selectPaddingX: `${spacing.md}px`,
  fullWidth: '100%',
  alignCenter: 'center',
  flexDisplay: 'flex',
  labelWeight: typography.title.fontWeight,
} as const

type Props<T extends string> = {
  id: string
  name?: string
  label: string
  value: T
  onChange: (e: SelectChangeEvent<T>) => void
  children: ReactNode
}

export function LabeledSelect<T extends string>({
  id,
  name,
  label,
  value,
  onChange,
  children,
}: Props<T>) {
  return (
    <Stack spacing={selectStyles.stackSpacing} sx={{ width: selectStyles.fullWidth }}>
      <Typography
        component="label"
        htmlFor={id}
        variant="body2"
        sx={{ fontWeight: selectStyles.labelWeight, color: 'text.secondary' }}
      >
        {label}
      </Typography>
      <FormControl fullWidth>
        <Select<T>
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          variant="outlined"
          displayEmpty
          MenuProps={{
            disablePortal: false,
            slotProps: {
              paper: {
                sx: {
                  maxHeight: sizes.paperMaxHeight,
                  borderRadius: selectStyles.rootRadius,
                  mt: selectStyles.menuMarginTop,
                  boxShadow: shadows.md,
                },
              },
            },
          }}
          sx={{
            borderRadius: selectStyles.rootRadius,
            minHeight: sizes.inputMinHeight,
            bgcolor: 'background.paper',
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: colors.divider,
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: colors.dividerHover,
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderWidth: sizes.borderStrong,
              borderColor: 'primary.main',
            },
            '& .MuiSelect-select': {
              py: selectStyles.selectPaddingY,
              px: selectStyles.selectPaddingX,
              display: selectStyles.flexDisplay,
              alignItems: selectStyles.alignCenter,
            },
          }}
        >
          {children}
        </Select>
      </FormControl>
    </Stack>
  )
}

export { MenuItem }
