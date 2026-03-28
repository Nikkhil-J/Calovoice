import type { FieldValues, UseFormReturn } from 'react-hook-form'

type HasCalories = FieldValues & { calories: string }

interface CalorieInputProps<T extends HasCalories> {
  form: UseFormReturn<T>
  className?: string
}

export function CalorieInput<T extends HasCalories>({
  form,
  className,
}: CalorieInputProps<T>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- RHF generic path inference is too strict for shared components
  const rhf = form as UseFormReturn<any>
  const value = rhf.watch('calories') as string
  return (
    <div className="entry-sheet-cal-wrap">
      <input
        className={`entry-sheet-input${className ? ` ${className}` : ''}`}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        enterKeyHint="done"
        placeholder="0"
        value={value}
        onChange={(e) => {
          if (/^\d*$/.test(e.target.value)) rhf.setValue('calories', e.target.value)
        }}
      />
      <span className="entry-sheet-cal-suffix">kcal</span>
    </div>
  )
}
