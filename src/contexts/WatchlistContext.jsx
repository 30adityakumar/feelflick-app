// src/contexts/WatchlistContext.jsx
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/shared/lib/supabase/client'
import { useUserMovieStatus } from '@/shared/hooks/useUserMovieStatus'

const WatchlistContext = createContext(null)

export function WatchlistProvider({ children }) {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false)

  // Load user once
  useEffect(() => {
    let isMounted = true
    supabase.auth
      .getUser()
      .then(({ data: { user: u } }) => {
        if (!isMounted) return
        setUser(u || null)
        setReady(true)
      })
      .catch(() => {
        if (!isMounted) return
        setUser(null)
        setReady(true)
      })
    return () => {
      isMounted = false
    }
  }, [])

  // Optional: expose a thin wrapper around your existing hook,
  // so cards don’t need to know about supabase/user at all.
  const makeStatusHelpers = useCallback(
    (movie) =>
      useUserMovieStatus({
        user,
        movie,
        source: 'quick_picks',
      }),
    [user]
  )

  const value = useMemo(
    () => ({
      user,
      ready,
      makeStatusHelpers,
    }),
    [user, ready, makeStatusHelpers]
  )

  return (
    <WatchlistContext.Provider value={value}>
      {children}
    </WatchlistContext.Provider>
  )
}

export function useWatchlistContext() {
  const ctx = useContext(WatchlistContext)
  if (!ctx) {
    throw new Error('useWatchlistContext must be used within WatchlistProvider')
  }
  return ctx
}
