// src/app/pages/watched/WatchedHistory.jsx
import { useEffect, useState } from 'react'
import { supabase } from '@/shared/lib/supabase/client'
import { useNavigate } from 'react-router-dom'
import { Loader2, Clock, Search, SlidersHorizontal, Trash2, Calendar, TrendingUp, X, ChevronDown } from 'lucide-react'

export default function WatchedHistory() {
  const nav = useNavigate()
  const [user, setUser] = useState(null)
  const [movies, setMovies] = useState([])
  const [filteredMovies, setFilteredMovies] = useState([])
  const [loading, setLoading] = useState(true)
  const [removingId, setRemovingId] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('recent')

  // Get current user
  useEffect(() => {
    let active = true
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (active) setUser(user ?? null)
    })()
    return () => { active = false }
  }, [])

  // Get watched movies
  useEffect(() => {
    if (!user) return
    let active = true
    setLoading(true)

    ;(async () => {
      try {
        // Join history with movies table
        const { data, error } = await supabase
          .from('user_history')
          .select(`
            watched_at,
            movie:movies (
              id,
              title,
              poster_path,
              release_date,
              vote_average
            )
          `)
          .eq('user_id', user.id)
          .order('watched_at', { ascending: false })

        if (error) throw error

        // Flatten data structure
        const flattened = data?.map(item => ({
          ...item.movie,
          watched_at: item.watched_at
        })).filter(m => m.id) // filter out nulls

        if (active) {
          setMovies(flattened || [])
          setFilteredMovies(flattened || [])
        }
      } catch (err) {
        console.error('Error loading history:', err)
        if (active) {
          setMovies([])
          setFilteredMovies([])
        }
      } finally {
        if (active) setLoading(false)
      }
    })()

    return () => { active = false }
  }, [user, removingId])

  // Filter and sort
  useEffect(() => {
    let result = [...movies]

    // Filter by search
    if (searchQuery) {
      result = result.filter(m => m.title?.toLowerCase().includes(searchQuery.toLowerCase()))
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'title') return a.title?.localeCompare(b.title)
      else if (sortBy === 'rating') return (b.vote_average || 0) - (a.vote_average || 0)
      else return new Date(b.watched_at || 0) - new Date(a.watched_at || 0)
    })

    setFilteredMovies(result)
  }, [movies, searchQuery, sortBy])

  // Remove a movie from history
  async function remove(movieId) {
    if (!user) return
    setRemovingId(movieId)
    try {
      await supabase
        .from('user_history')
        .delete()
        .eq('user_id', user.id)
        .eq('movie_id', movieId)
      
      setMovies(prev => prev.filter(m => m.id !== movieId))
    } finally {
      setRemovingId(null)
    }
  }

  function goToMovie(id) {
    nav(`/movie/${id}`)
  }

  // Calculate stats
  const totalMovies = movies.length
  const avgRating = movies.length > 0 
    ? (movies.reduce((sum, m) => sum + (m.vote_average || 0), 0) / movies.length).toFixed(1)
    : '0.0'

  return (
    <main 
      className="bg-black text-white w-full pb-20 md:pb-6" 
      style={{ paddingTop: 'var(--hdr-h, 64px)', minHeight: '100vh' }}
    >
      <div className="mx-auto max-w-7xl px-4 py-4 md:py-6">
        
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-900/20">
              <Clock className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl md:text-3xl font-black tracking-tight bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Watch History
              </h1>
            </div>
          </div>

          {/* Simple Stats */}
          <div className="flex items-center gap-4 text-xs font-medium text-white/50 px-1">
            <div className="flex items-center gap-1.5">
              <span className="text-white font-bold">{totalMovies}</span>
              <span>{totalMovies === 1 ? 'movie' : 'movies'} watched</span>
            </div>
            {totalMovies > 0 && (
              <>
                <div className="h-3 w-px bg-white/10" />
                <div className="flex items-center gap-1.5">
                  <span className="text-yellow-400">★</span>
                  <span>{avgRating} avg rating</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Search & Sort Bar */}
        {(!loading && movies.length > 0) && (
          <div className="mb-6 flex gap-3">
            {/* Search */}
            <div className="flex-1 relative group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 group-focus-within:text-purple-400 transition-colors pointer-events-none" />
              <input
                type="text"
                placeholder="Search history..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/10 transition-all"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors aria-label='Clear search'"
                >
                  <X className="h-3.5 w-3.5 text-white/60" />
                </button>
              )}
            </div>

            {/* Sort */}
            <div className="relative w-40 hidden sm:block">
              <SlidersHorizontal className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 pointer-events-none" />
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="appearance-none w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-10 py-3 text-sm text-white focus:outline-none focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/10 transition-all cursor-pointer hover:bg-white/10"
              >
                <option value="recent" className="bg-black">Recent</option>
                <option value="title" className="bg-black">A-Z</option>
                <option value="rating" className="bg-black">Rating</option>
              </select>
              <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 pointer-events-none" />
            </div>
          </div>
        )}

        {/* Results Info */}
        {(!loading && movies.length > 0 && searchQuery) && (
          <div className="mb-4 text-xs font-medium text-white/50">
            Showing {filteredMovies.length} of {movies.length} movies
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center h-[50vh]">
            <Loader2 className="h-8 w-8 animate-spin mb-4 text-purple-500" />
            <p className="text-sm text-white/50 font-medium">Loading your history...</p>
          </div>
        ) : (
          <>
            {filteredMovies.length === 0 && searchQuery ? (
              <div className="flex flex-col items-center justify-center h-[40vh] text-center p-6">
                <div className="h-16 w-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                  <Search className="h-8 w-8 text-white/20" />
                </div>
                <p className="text-sm text-white/60 mb-4">No movies found for "{searchQuery}"</p>
                <button 
                  onClick={() => setSearchQuery('')}
                  className="text-xs font-bold text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 px-4 py-2 rounded-lg transition-all"
                >
                  Clear search
                </button>
              </div>
            ) : movies.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {filteredMovies.map(m => (
                  <MovieCard 
                    key={m.id} 
                    movie={m} 
                    onRemove={remove} 
                    onClick={() => goToMovie(m.id)}
                    removing={removingId === m.id}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}

// Movie Card Component
function MovieCard({ movie, onRemove, onClick, removing }) {
  return (
    <div className="group relative">
      <button 
        onClick={onClick}
        className="relative block w-full aspect-[2/3] rounded-xl overflow-hidden bg-white/5 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-900/20 focus:outline-none focus:ring-4 focus:ring-purple-500/20 active:scale-[0.98]"
      >
        {movie.poster_path ? (
          <img 
            src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`} 
            alt={movie.title} 
            className="w-full h-full object-cover loading-lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-white/10">
            <span className="text-white/40 text-xs font-medium">No Image</span>
          </div>
        )}

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300">
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <h3 className="text-xs font-bold text-white leading-tight line-clamp-2 mb-1.5 drop-shadow-md">
              {movie.title}
            </h3>
            <div className="flex items-center gap-2 text-[10px] font-medium text-white/80">
              {movie.release_date && (
                <span className="bg-white/10 px-1.5 py-0.5 rounded backdrop-blur-sm">
                  {new Date(movie.release_date).getFullYear()}
                </span>
              )}
              {movie.vote_average > 0 && (
                <span className="flex items-center gap-1 text-yellow-400 bg-black/40 px-1.5 py-0.5 rounded backdrop-blur-sm">
                  <span>★</span>
                  {movie.vote_average.toFixed(1)}
                </span>
              )}
            </div>
            {movie.watched_at && (
              <div className="mt-2 flex items-center gap-1 text-[10px] text-purple-300 font-medium">
                <Calendar className="h-3 w-3" />
                <span>Watched {new Date(movie.watched_at).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>
      </button>

      {/* Remove Button */}
      <button
        onClick={(e) => { e.stopPropagation(); onRemove(movie.id); }}
        disabled={removing}
        className="absolute top-2 right-2 z-20 h-8 w-8 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/70 hover:text-red-400 hover:bg-black hover:border-red-500/50 transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100 active:scale-90 disabled:opacity-50 shadow-lg"
        title="Remove from history"
      >
        {removing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-4 w-4" />}
      </button>
    </div>
  )
}

// Empty State
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-[50vh] text-center px-4 animate-in fade-in zoom-in duration-500">
      <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-purple-600/20 to-pink-600/20 flex items-center justify-center mb-6 ring-1 ring-white/10">
        <Clock className="h-8 w-8 text-purple-400" />
      </div>
      <h2 className="text-xl md:text-2xl font-black text-white mb-2">No watch history yet</h2>
      <p className="text-sm text-white/60 mb-8 max-w-sm leading-relaxed">
        Start watching movies to build your viewing history and get personalized recommendations
      </p>
      <a 
        href="/browse" 
        className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-3.5 rounded-xl text-sm font-bold text-white shadow-lg shadow-purple-900/30 hover:scale-105 hover:shadow-purple-900/50 active:scale-95 transition-all duration-300"
      >
        <TrendingUp className="h-4 w-4" />
        Browse Movies
      </a>
    </div>
  )
}
