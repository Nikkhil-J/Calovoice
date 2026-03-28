import { createContext, useContext } from 'react'

export type AppScreen =
  | { name: 'onboarding' }
  | { name: 'main' }
  | { name: 'day'; dateKey: string }
  | { name: 'history' }
  | { name: 'settings' }

export type AppNavigation = {
  openHistory: () => void
  openSettings: () => void
  openDay: (dateKey: string) => void
  pop: () => void
  goToToday: () => void
}

const AppNavigationContext = createContext<AppNavigation | null>(null)

export function AppNavigationProvider({
  value,
  children,
}: {
  value: AppNavigation
  children: React.ReactNode
}) {
  return (
    <AppNavigationContext.Provider value={value}>
      {children}
    </AppNavigationContext.Provider>
  )
}

/** Colocated with provider; hook must be exported for page components. */
// eslint-disable-next-line react-refresh/only-export-components -- hook + provider pattern
export function useAppNavigation(): AppNavigation {
  const v = useContext(AppNavigationContext)
  if (!v) {
    throw new Error('useAppNavigation must be used within AppNavigationProvider')
  }
  return v
}
