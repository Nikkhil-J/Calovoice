import type { User } from 'firebase/auth'
import { useFirebaseAuth } from '../../hooks/useFirebaseAuth'
import { FullPageError } from '../primitives/FullPageError'
import { FullPageSpinner } from '../primitives/FullPageSpinner'

export function AuthGate({
  children,
}: {
  children: (user: User) => React.ReactNode
}) {
  const { user, loading, error, retry } = useFirebaseAuth()

  if (loading) return <FullPageSpinner />
  if (error) return <FullPageError message={error} onRetry={() => void retry()} />
  if (!user) return <FullPageSpinner />

  return <>{children(user)}</>
}
