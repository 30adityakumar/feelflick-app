// src/contexts/WatchlistContext.jsx
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/shared/lib/supabase/client'

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

  const value = useMemo(
    () => ({
      user,
      ready,
    }),
    [user, ready]
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
