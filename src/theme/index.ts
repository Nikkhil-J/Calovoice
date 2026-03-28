import { colors } from './colors'
import { radius } from './radius'
import { spacing } from './spacing'
import { typography } from './typography'
import { borders, cssVarTokens, motion, opacity, shadows, sizes, uiTokens, zIndex } from './tokens'

export { colors, spacing, typography, radius, sizes, opacity, motion, shadows, borders, zIndex, cssVarTokens, uiTokens }

export const theme = {
  colors,
  spacing,
  typography,
  radius,
  sizes,
  opacity,
  motion,
  shadows,
  borders,
  zIndex,
  cssVarTokens,
  uiTokens,
} as const
