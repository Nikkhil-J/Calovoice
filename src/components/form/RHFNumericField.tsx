import {
  Controller,
  type Control,
  type FieldValues,
  type Path,
} from "react-hook-form";
import { NumericField, type NumericFieldProps } from "../NumericField";

type Props<T extends FieldValues> = Omit<
  NumericFieldProps,
  "value" | "onChange"
> & {
  name: Path<T>;
  control: Control<T>;
};

export function RHFNumericField<T extends FieldValues>({
  name,
  control,
  ...rest
}: Props<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <NumericField
          {...rest}
          name={name}
          value={field.value as number}
          onChange={(v) => field.onChange(v)}
        />
      )}
    />
  );
}
