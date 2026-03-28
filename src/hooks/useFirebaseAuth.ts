import { useEffect, useState, useCallback } from 'react'
import { onAuthStateChanged, signInAnonymously, type User } from 'firebase/auth'
import { auth } from '../firebase'

export function useFirebaseAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const retry = useCallback(async () => {
    setError(null)
    setLoading(true)
    try {
      await signInAnonymously(auth)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign-in failed')
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u)
        setLoading(false)
        setError(null)
      } else {
        signInAnonymously(auth).catch((e) => {
          setError(e instanceof Error ? e.message : 'Sign-in failed')
          setLoading(false)
        })
      }
    })
    return unsub
  }, [])

  return { user, loading, error, retry }
}
