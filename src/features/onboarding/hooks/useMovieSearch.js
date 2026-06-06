import { useEffect, useRef, useState } from 'react'
import { searchMovies } from '@/shared/api/tmdb'

/**
 * Debounced TMDB live-search controller for the onboarding film picker.
 *
 * Behavior preserved verbatim from MoviesStep (F2.3): 300ms debounce, popularity
 * sort, poster filter, top-8 slice, and the clear/close transitions. (The audit's
 * Escape / outside-click / listbox a11y improvements are deliberately NOT added
 * in this structure pass.)
 *
 * @returns {{
 *   query: string, setQuery: function, results: object[], searching: boolean,
 *   showDropdown: boolean, setShowDropdown: function, clearSearch: function,
 * }}
 */
export function useMovieSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const searchTimeoutRef = useRef(null)

  // Live search with debounce
  useEffect(() => {
    clearTimeout(searchTimeoutRef.current)
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
      } finally {
        setSearching(false)
      }
    }, 300)
    return () => clearTimeout(searchTimeoutRef.current)
  }, [query])

  // Reset query + close the dropdown (used by the clear button and after a pick).
  const clearSearch = () => {
    setQuery('')
    setShowDropdown(false)
  }

  return { query, setQuery, results, searching, showDropdown, setShowDropdown, clearSearch }
}
