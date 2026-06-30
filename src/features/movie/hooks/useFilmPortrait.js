import { useEffect, useState } from 'react'
import { supabase } from '@/shared/lib/supabase/client'

export function useFilmPortrait(tmdbId) {
  const [portrait, setPortrait] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!tmdbId) { setLoading(false); return }
    let cancelled = false
    supabase
      .from('film_portraits')
      .select('portrait')
      .eq('tmdb_id', tmdbId)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) { setPortrait(data?.portrait ?? null); setLoading(false) }
      })
    return () => { cancelled = true }
  }, [tmdbId])

  return { portrait, loading }
}
