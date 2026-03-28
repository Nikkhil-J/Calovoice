import { sizes } from '../../theme'

const style = {
  width: sizes.spinnerLg,
  height: sizes.spinnerLg,
  borderWidth: `${sizes.borderAccent}px`,
} as const

export function FullPageSpinner() {
  return (
    <div className="page center">
      <div className="spinner" style={style} />
    </div>
  )
}
