import { useEffect, useState } from 'react'
import { fetchSuggestionPool } from '../suggestionPool'

/**
 * Build & hold the onboarding Step-3 suggestion pool.
 *
 * MOUNT-ONCE by design: the original MoviesStep fetched the pool once on mount
 * with an intentionally empty dependency array, capturing the genres/moods from
 * the first render so the suggestion row doesn't re-shuffle under the user mid-
 * selection. This hook preserves that exactly — including the swallowed-error /
 * no-retry loading behavior. (The audit flagged the swallowed pool error as a
 * future UX issue; it is deliberately NOT addressed in this structure pass.)
 *
 * @param {number[]} selectedGenreIds — TMDB genre IDs from Step 2
 * @param {string[]} moods            — onboarding mood keys from Step 1
 * @returns {{ pool: object[], poolLoading: boolean }}
 */
export function useSuggestionPool(selectedGenreIds, moods) {
  const [pool, setPool] = useState([])
  const [poolLoading, setPoolLoading] = useState(true)

  useEffect(() => {
    setPoolLoading(true)
    fetchSuggestionPool(selectedGenreIds, moods)
      .then(films => { setPool(films); setPoolLoading(false) })
      .catch(() => setPoolLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps -- mount-once: capture initial picks, don't re-fetch

  return { pool, poolLoading }
}
