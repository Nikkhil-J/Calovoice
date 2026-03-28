import { CssBaseline, ThemeProvider } from '@mui/material'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { cssVarTokens } from './theme'
import { muiTheme } from './theme/muiTheme'
import { startPerformanceGuardrails } from './utils/performanceGuardrails'

Object.entries(cssVarTokens).forEach(([name, value]) => {
  document.documentElement.style.setProperty(name, value)
})

if (import.meta.env.DEV) {
  startPerformanceGuardrails()
}

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('Missing #root element in index.html')

createRoot(rootEl).render(
  <StrictMode>
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </StrictMode>,
)
