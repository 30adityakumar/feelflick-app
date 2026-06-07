import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchSuggestionPool } from '../suggestionPool'

/**
 * Build & hold the onboarding Step-3 suggestion pool.
 *
 * MOUNT-ONCE by design: the pool is fetched once on mount, capturing the
 * genres/moods from the first render so the suggestion row doesn't re-shuffle
 * under the user mid-selection. `retry` re-runs the SAME fetch with those same
 * mount-captured picks (no re-shuffle, no query change). The fetch stays
 * non-throwing; a failure now also flips `poolError` so MoviesStep can surface a
 * real error + retry instead of a benign "All suggestions added" empty state.
 *
 * @param {number[]} selectedGenreIds — TMDB genre IDs from Step 2
 * @param {string[]} moods            — onboarding mood keys from Step 1
 * @returns {{ pool: object[], poolLoading: boolean, poolError: boolean, retry: function }}
 */
export function useSuggestionPool(selectedGenreIds, moods) {
  const [pool, setPool] = useState([])
  const [poolLoading, setPoolLoading] = useState(true)
  const [poolError, setPoolError] = useState(false)
  // Capture the mount-time picks so retry re-fetches the identical set.
  const argsRef = useRef({ selectedGenreIds, moods })

  const load = useCallback(() => {
    setPoolLoading(true)
    setPoolError(false)
    const { selectedGenreIds: genreIds, moods: moodKeys } = argsRef.current
    fetchSuggestionPool(genreIds, moodKeys)
      .then(films => { setPool(films); setPoolLoading(false) })
      .catch(() => { setPoolLoading(false); setPoolError(true) })
  }, [])

  useEffect(() => {
    load()
  }, [load]) // load is stable (useCallback []) → mount-once preserved

  return { pool, poolLoading, poolError, retry: load }
}
