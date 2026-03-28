import { createTheme } from '@mui/material/styles'
import { borders, colors, radius, shadows, sizes, spacing, typography } from './index'

export const muiTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: colors.positive,
      light: colors.positiveLight,
      dark: colors.positiveDark,
      contrastText: colors.white,
    },
    error: {
      main: colors.negative,
      light: colors.negativeLight,
      dark: colors.negativeDark,
    },
    background: {
      default: colors.background,
      paper: colors.surface,
    },
    text: {
      primary: colors.textPrimary,
      secondary: colors.textSecondary,
    },
    divider: colors.divider,
  },
  shape: { borderRadius: radius.md },
  typography: {
    fontFamily: typography.fontFamily,
    h4: { fontWeight: 800, letterSpacing: '-0.03em' },
    h5: { fontWeight: 700, letterSpacing: '-0.025em' },
    h6: { fontWeight: 700, letterSpacing: '-0.01em' },
    body2: { color: colors.textSecondary },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
        size: 'medium',
        fullWidth: true,
      },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: radius.md,
            backgroundColor: colors.surfaceAlt,
            transition: 'box-shadow 0.15s',
            '& fieldset': {
              borderColor: colors.dividerSoft,
              borderWidth: `${sizes.borderDefault}px`,
            },
            '&:hover fieldset': { borderColor: colors.dividerHover },
            '&.Mui-focused fieldset': {
              borderColor: colors.positive,
              borderWidth: `${sizes.borderDefault}px`,
            },
            '&.Mui-focused': {
              boxShadow: `0 0 0 ${sizes.focusRingWidth}px rgba(10, 146, 99, 0.25)`,
            },
          },
          '& .MuiInputLabel-root.Mui-focused': { color: colors.positive },
        },
      },
    },
    MuiFormControl: {
      defaultProps: {
        variant: 'outlined',
        size: 'medium',
        fullWidth: true,
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          borderRadius: radius.md,
          backgroundColor: colors.surfaceAlt,
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: colors.dividerSoft,
            borderWidth: `${sizes.borderDefault}px`,
          },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: colors.dividerHover },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: colors.positive,
            borderWidth: `${sizes.borderDefault}px`,
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: radius.md,
          fontWeight: 600,
          letterSpacing: '-0.01em',
          boxShadow: 'none',
          transition:
            'transform 0.1s ease, box-shadow 0.15s ease, background-color 0.15s ease',
          '&:hover': { boxShadow: 'none' },
          '&:active': { transform: 'scale(0.97)' },
        },
        sizeLarge: {
          minHeight: spacing.xxl + spacing.xs + spacing.xs,
          fontSize: '1rem',
          borderRadius: radius.md + spacing.xxs,
        },
        containedPrimary: {
          background: colors.positive,
          boxShadow: 'var(--token-shadow-positive)',
          '&:hover': {
            background: colors.positiveDark,
            boxShadow: 'var(--token-shadow-positive-hover)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: colors.surface,
        },
        elevation0: {
          border: borders.panel,
          boxShadow: shadows.sm,
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          borderRadius: radius.sm,
          margin: `${spacing.xxs}px ${spacing.xs}px`,
          fontSize: '0.9375rem',
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontSize: '0.9375rem',
          color: colors.textSecondary,
          '&.Mui-focused': { color: colors.positive },
        },
      },
    },
    MuiFormHelperText: {
      styleOverrides: {
        root: {
          fontSize: '0.75rem',
          color: colors.textTertiary,
        },
      },
    },
  },
})
