// src/app/pages/browse/MoviesTab.jsx
import { useEffect, useState } from 'react'
import { supabase } from '@/shared/lib/supabase/client'
import BrowseSearchBar from './BrowseSearchBar'
import ResultsGrid from './ResultsGrid'
import Pagination from './Pagination'

const TMDB_BASE = 'https://api.themoviedb.org/3'
const TMDB_KEY = import.meta.env.VITE_TMDB_API_KEY

export default function MoviesTab() {
  const [movies, setMovies] = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [genre, setGenre] = useState('')
  const [query, setQuery] = useState('')
  const [sortBy, setSortBy] = useState('popularity.desc')
  const [user, setUser] = useState(null)

  // Auth
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data?.user ?? null))
    const { data } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null))
    return () => data?.subscription?.unsubscribe?.()
  }, [])

  // Fetch Movies
  useEffect(() => {
    let active = true
    async function fetchMovies() {
      setLoading(true)
      try {
        let url
        if (query.trim()) {
          // Search mode
          url = `${TMDB_BASE}/search/movie?api_key=${TMDB_KEY}&language=en-US&query=${encodeURIComponent(query)}&page=${page}`
        } else {
          // Discover mode
          url = `${TMDB_BASE}/discover/movie?api_key=${TMDB_KEY}&language=en-US&page=${page}&sort_by=${sortBy}`
          if (genre) url += `&with_genres=${genre}`
        }

        const res = await fetch(url)
        const data = await res.json()
        
        if (!active) return
        
        setMovies(data.results || [])
        setTotalPages(Math.min(data.total_pages || 1, 500)) // TMDB limits to 500 pages
      } catch (error) {
        console.error('Error fetching movies:', error)
        if (active) setMovies([])
      } finally {
        if (active) setLoading(false)
      }
    }

    fetchMovies()
    return () => { active = false }
  }, [page, genre, query, sortBy])

  const handleSearch = (searchQuery, selectedGenre, selectedSort) => {
    setQuery(searchQuery)
    setGenre(selectedGenre)
    setSortBy(selectedSort)
    setPage(1) // Reset to page 1 on new search
  }

  const handlePageChange = (newPage) => {
    setPage(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-black text-white pb-12">
      {/* Search Bar */}
      <div className="sticky top-0 z-40 bg-black/95 backdrop-blur-lg border-b border-white/10 pt-20 md:pt-24 pb-4">
        <div className="mx-auto max-w-7xl px-4 md:px-8 lg:px-12">
          <BrowseSearchBar onSearch={handleSearch} />
        </div>
      </div>

      {/* Results */}
      <div className="mx-auto max-w-7xl px-4 md:px-8 lg:px-12 mt-8">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {[...Array(18)].map((_, i) => (
              <div key={i} className="aspect-[2/3] rounded-lg bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : movies.length > 0 ? (
          <>
            <ResultsGrid movies={movies} user={user} />
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={handlePageChange} />
          </>
        ) : (
          <div className="text-center py-20">
            <p className="text-white/60 text-lg">No movies found. Try a different search.</p>
          </div>
        )}
      </div>
    </div>
  )
}
