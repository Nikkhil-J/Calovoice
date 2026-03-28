import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form'
import { LabeledSelect } from '../LabeledSelect'
import type { SelectChangeEvent } from '@mui/material'
import type { ReactNode } from 'react'

type Props<T extends FieldValues> = {
  name: Path<T>
  control: Control<T>
  id: string
  label: string
  children: ReactNode
}

export function RHFLabeledSelect<T extends FieldValues, V extends string>({
  name,
  control,
  id,
  label,
  children,
}: Props<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <LabeledSelect<V>
          id={id}
          name={name}
          label={label}
          value={field.value as V}
          onChange={(e: SelectChangeEvent<V>) => field.onChange(e.target.value)}
        >
          {children}
        </LabeledSelect>
      )}
    />
  )
}
