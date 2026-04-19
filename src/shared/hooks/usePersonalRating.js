// src/shared/hooks/usePersonalRating.js

import { useEffect, useState } from 'react'

import { useAuthSession } from './useAuthSession'
import { getPersonalRating } from '@/shared/services/personalRating'

/**
 * Hook to fetch/compute ff_personal_rating for a user × movie pair.
 * Returns cached result if fresh, otherwise computes on mount.
 * @param {object|null} movie - Movie row with rating columns
 * @returns {{ personalRating: object|null, loading: boolean }}
 */
export function usePersonalRating(movie) {
  const { user } = useAuthSession()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user?.id || !movie?.id) {
      setData(null)
      return
    }

    let cancelled = false
    setLoading(true)

    getPersonalRating(user.id, movie)
      .then((r) => { if (!cancelled) setData(r) })
      .catch(() => { if (!cancelled) setData(null) })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  // WHY: only re-fetch when the movie ID changes, not on every object reference change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, movie?.id])

  return { personalRating: data, loading }
}
