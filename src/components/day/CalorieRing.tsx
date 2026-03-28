import { memo, useMemo } from 'react'
import { useAnimatedNumber } from '../../hooks/useAnimatedNumber'
import { colors, sizes } from '../../theme'

const SIZE = sizes.ring
const STROKE = sizes.ringStroke
const RADIUS = (SIZE - STROKE) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
const CENTER = SIZE / 2
const TICK_LEN = sizes.ringTick
const RING_RATIO_WARN_HIGH = 0.85
const RING_RATIO_WARN_MED = 0.65
const ANGLE_START_DEG = -90
const FULL_CIRCLE_DEG = 360
const HALF_TURN_DEG = 180
const DAY_START_HOUR = 7
const DAY_WINDOW_HOURS = 16

interface CalorieRingProps {
  eaten: number
  goal: number
  burned: number
}

function ringColor(ratio: number, isOver: boolean): string {
  if (isOver) return colors.negative
  if (ratio > RING_RATIO_WARN_HIGH) return colors.warningStrong
  if (ratio > RING_RATIO_WARN_MED) return colors.warningSoft
  return colors.positive
}

/** Fraction of daily eating window elapsed (7am–11pm = 16h). */
function expectedRatio(): number {
  const h = new Date().getHours() + new Date().getMinutes() / 60
  return Math.max(0, Math.min((h - DAY_START_HOUR) / DAY_WINDOW_HOURS, 1))
}

export const CalorieRing = memo(function CalorieRing({
  eaten,
  goal,
  burned,
}: CalorieRingProps) {
  const net = Math.max(0, eaten - burned)
  const ratio = goal > 0 ? Math.min(net / goal, 1) : 0
  const offset = CIRCUMFERENCE * (1 - ratio)
  const remaining = goal - eaten + burned
  const isOver = remaining < 0

  const displayNumber = useAnimatedNumber(Math.abs(remaining))
  const color = ringColor(ratio, isOver)

  const tick = useMemo(() => {
    const er = expectedRatio()
    if (er <= 0 || er >= 1) return null
    const angle = ANGLE_START_DEG + er * FULL_CIRCLE_DEG
    const rad = (angle * Math.PI) / HALF_TURN_DEG
    const inner = RADIUS - TICK_LEN / 2
    const outer = RADIUS + TICK_LEN / 2
    return {
      x1: CENTER + inner * Math.cos(rad),
      y1: CENTER + inner * Math.sin(rad),
      x2: CENTER + outer * Math.cos(rad),
      y2: CENTER + outer * Math.sin(rad),
    }
  }, [])

  const showTick = tick && eaten > 0 && !isOver

  return (
    <div className="calorie-ring">
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        aria-label={`${Math.abs(remaining)} kcal ${isOver ? 'over goal' : 'remaining'}`}
        role="img"
      >
        <circle
          cx={CENTER} cy={CENTER} r={RADIUS}
          fill="none" stroke="var(--surface-3)" strokeWidth={STROKE} opacity={0.5}
        />
        <circle
          cx={CENTER} cy={CENTER} r={RADIUS}
          fill="none"
          stroke={color}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${CENTER} ${CENTER})`}
          className="calorie-ring-progress"
        />
        {showTick && (
          <line
            x1={tick.x1} y1={tick.y1} x2={tick.x2} y2={tick.y2}
            stroke="var(--t3)" strokeWidth={sizes.borderStrong} strokeLinecap="round" opacity={0.55}
          />
        )}
      </svg>

      <div className="calorie-ring-center">
        <span className={`calorie-ring-number${isOver ? ' over' : ''}`}>
          {displayNumber}
        </span>
        <span className="calorie-ring-label">
          {isOver ? 'over' : 'remaining'}
        </span>
      </div>
    </div>
  )
})
