import { useEffect, useRef, useState } from 'react'
import { searchMovies } from '@/shared/api/tmdb'

/**
 * Debounced TMDB live-search controller for the onboarding film picker.
 *
 * Behavior preserved verbatim: 300ms debounce, popularity sort, poster filter,
 * top-8 slice, and the clear/close transitions. A search failure now flips
 * `searchError` (cleared at each new search start) so the dropdown can show a
 * real error instead of masquerading as "No results"; `retrySearch` re-runs the
 * SAME query through the SAME debounced path (no query/ranking change).
 *
 * `activeIndex` is the combobox active-option index (-1 = none); it resets on
 * each new search and on clear. The search EXECUTION (debounce/sort/filter/slice
 * + error handling) is unchanged — only open/active-option state is added here.
 *
 * @returns {{
 *   query: string, setQuery: function, results: object[], searching: boolean,
 *   showDropdown: boolean, setShowDropdown: function, clearSearch: function,
 *   searchError: boolean, retrySearch: function,
 *   activeIndex: number, setActiveIndex: function,
 * }}
 */
export function useMovieSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [searchError, setSearchError] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [retryTick, setRetryTick] = useState(0)
  const searchTimeoutRef = useRef(null)

  // Live search with debounce
  useEffect(() => {
    clearTimeout(searchTimeoutRef.current)
    setSearchError(false)
    setActiveIndex(-1) // new search → no active option
    if (!query.trim()) {
      setResults([])
      setSearching(false)
      setShowDropdown(false)
      return
    }
    setSearching(true)
    setShowDropdown(true)
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const data = await searchMovies(query)
        setResults(
          (data?.results || [])
            .filter(m => m.poster_path)
            .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
            .slice(0, 8)
        )
      } catch {
        setResults([])
        setSearchError(true)
      } finally {
        setSearching(false)
      }
    }, 300)
    return () => clearTimeout(searchTimeoutRef.current)
  }, [query, retryTick])

  // Reset query + close the dropdown (used by the clear button and after a pick).
  const clearSearch = () => {
    setQuery('')
    setShowDropdown(false)
    setActiveIndex(-1)
  }

  // Re-run the same query through the same debounced path.
  const retrySearch = () => setRetryTick(t => t + 1)

  return { query, setQuery, results, searching, showDropdown, setShowDropdown, clearSearch, searchError, retrySearch, activeIndex, setActiveIndex }
}
