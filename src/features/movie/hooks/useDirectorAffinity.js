// src/features/movie/hooks/useDirectorAffinity.js
// Count of films by `directorName` in the current user's watch history.
// RLS-safe: user_history is owner-only — the join just gives us the count
// of our own rows where the joined movie's director matches.

import { useEffect, useState } from 'react'
import { supabase } from '@/shared/lib/supabase/client'

export function useDirectorAffinity(userId, directorName) {
  const [state, setState] = useState({ count: 0, loading: Boolean(userId && directorName) })

  useEffect(() => {
    if (!userId || !directorName || directorName === '—') {
      setState({ count: 0, loading: false })
      return
    }
    let abort = false
    setState(s => ({ ...s, loading: true }))

    ;(async () => {
      try {
        const { count, error } = await supabase
          .from('user_history')
          .select('movie_id, movies!inner(director_name)', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('movies.director_name', directorName)
        if (abort) return
        if (error) throw error
        setState({ count: count || 0, loading: false })
      } catch (err) {
        if (abort) return
        console.warn('[useDirectorAffinity]', err)
        setState({ count: 0, loading: false })
      }
    })()

    return () => { abort = true }
  }, [userId, directorName])

  return state
}
