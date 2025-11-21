// src/app/pages/watchlist/Watchlist.jsx
import { useEffect, useState, useMemo } from 'react'
import { Bookmark, Loader2, Search, SlidersHorizontal, Trash2, X, Check, Clock, ChevronDown, Filter } from 'lucide-react'
import { supabase } from '@/shared/lib/supabase/client'
import { useNavigate } from 'react-router-dom'

export default function Watchlist() {
  const nav = useNavigate()
  const [user, setUser] = useState(null)
  const [movies, setMovies] = useState([])
  const [filteredMovies, setFilteredMovies] = useState([])
  const [loading, setLoading] = useState(true)
  const [removingId, setRemovingId] = useState(null)
  const [markingWatched, setMarkingWatched] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('added')

  // Fetch user
  useEffect(() => {
    let active = true
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (active) setUser(user ?? null)
    })()
    return () => { active = false }
  }, [])

  // Fetch watchlist
  useEffect(() => {
    if (!user) return
    let active = true
    setLoading(true)
    
    ;(async () => {
      try {
        const { data: watchlist, error } = await supabase
          .from('user_watchlist')
          .select('movie_id,status,added_at')
          .eq('user_id', user.id)
          .order('added_at', { ascending: false })

        if (error) throw error

        const ids = watchlist?.map(r => r.movie_id)
        if (!ids || ids.length === 0) {
          if (active) {
            setMovies([])
            setFilteredMovies([])
            setLoading(false)
          }
          return
        }

        const { data: rows, error: mErr } = await supabase
          .from('movies')
          .select('id,title,poster_path,release_date,vote_average')
          .in('id', ids)

        if (mErr) throw mErr

        const map = new Map(rows.map(r => [r.id, r]))
        const merged = watchlist
          .map(w => {
            const m = map.get(w.movie_id)
            return m ? { ...m, added_at: w.added_at, status: w.status } : null
          })
          .filter(Boolean)

        if (active) {
          setMovies(merged)
          setFilteredMovies(merged)
        }
      } catch (e) {
        console.error('Watchlist fetch error:', e)
        if (active) {
          setMovies([])
          setFilteredMovies([])
        }
      } finally {
        if (active) setLoading(false)
      }
    })()
    
    return () => { active = false }
  }, [user, removingId, markingWatched])

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
      else return new Date(b.added_at) - new Date(a.added_at)
    })

    setFilteredMovies(result)
  }, [movies, searchQuery, sortBy])

  async function remove(movieId) {
    if (!user) return
    setRemovingId(movieId)
    try {
      await supabase
        .from('user_watchlist')
        .delete()
        .eq('user_id', user.id)
        .eq('movie_id', movieId)
      
      setMovies(prev => prev.filter(m => m.id !== movieId))
    } finally {
      setRemovingId(null)
    }
  }

  async function markAsWatched(movie) {
    if (!user) return
    setMarkingWatched(movie.id)
    try {
      // Add to history
      await supabase.from('user_history').upsert({
        user_id: user.id,
        movie_id: movie.id,
        watched_at: new Date().toISOString(),
      }, { onConflict: 'user_id,movie_id' })

      // Remove from watchlist
      await supabase
        .from('user_watchlist')
        .delete()
        .eq('user_id', user.id)
        .eq('movie_id', movie.id)
      
      setMovies(prev => prev.filter(m => m.id !== movie.id))
    } finally {
      setMarkingWatched(null)
    }
  }

  function goToMovie(id) {
    nav(`/movie/${id}`)
  }

  return (
    <main 
      className="bg-black text-white w-full pb-20 md:pb-6" 
      style={{ paddingTop: 'var(--hdr-h, 64px)', minHeight: '100vh' }}
    >
      <div className="mx-auto max-w-7xl px-4 py-4 md:py-6">
        
        {/* Header with Stats */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-900/20">
              <Bookmark className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl md:text-3xl font-black tracking-tight bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                My Watchlist
              </h1>
            </div>
          </div>

          {/* Simple Stats */}
          <div className="flex items-center gap-4 text-xs font-medium text-white/50 px-1">
            <div className="flex items-center gap-1.5">
              <span className="text-white font-bold">{filteredMovies.length}</span>
              <span>{filteredMovies.length === 1 ? 'movie' : 'movies'}</span>
            </div>
            {filteredMovies.length > 0 && (
              <>
                <div className="h-3 w-px bg-white/10" />
                <div className="flex items-center gap-1.5">
                  <span className="text-yellow-400">★</span>
                  <span>{(filteredMovies.reduce((sum, m) => sum + (m.vote_average || 0), 0) / filteredMovies.length).toFixed(1)} avg</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Search & Sort */}
        {(!loading && movies.length > 0) && (
          <div className="mb-6 flex gap-3">
            {/* Search */}
            <div className="flex-1 relative group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 group-focus-within:text-purple-400 transition-colors pointer-events-none" />
              <input
                type="text"
                placeholder="Search watchlist..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/10 transition-all"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors"
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
                <option value="added" className="bg-black">Recent</option>
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
            <p className="text-sm text-white/50 font-medium">Loading your watchlist...</p>
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
                    onMarkWatched={markAsWatched} 
                    onClick={() => goToMovie(m.id)}
                    removing={removingId === m.id}
                    markingWatched={markingWatched === m.id}
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
function MovieCard({ movie, onRemove, onMarkWatched, onClick, removing, markingWatched }) {
  const [touchStart, setTouchStart] = useState(null)
  const [touchEnd, setTouchEnd] = useState(null)
  const [swipeDirection, setSwipeDirection] = useState(null)
  const minSwipeDistance = 50

  const onTouchStart = (e) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX)
    if (!touchStart || !e.targetTouches[0].clientX) return
    const distance = touchStart - e.targetTouches[0].clientX
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance
    
    if (isLeftSwipe) setSwipeDirection('left')
    else if (isRightSwipe) setSwipeDirection('right')
    else setSwipeDirection(null)
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance
    
    if (isLeftSwipe) onRemove(movie.id)
    else if (isRightSwipe) onMarkWatched(movie)
    
    setSwipeDirection(null)
    setTouchStart(null)
    setTouchEnd(null)
  }

  return (
    <div 
      className="group relative touch-pan-y"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Swipe Indicators (Mobile) */}
      <div className={`md:hidden absolute inset-0 z-0 rounded-xl overflow-hidden transition-opacity ${swipeDirection ? 'opacity-100' : 'opacity-0'}`}>
        {swipeDirection === 'left' && (
          <div className="absolute inset-0 bg-red-500/20 flex items-center justify-end pr-6 border border-red-500/30">
            <Trash2 className="h-6 w-6 text-red-400" />
          </div>
        )}
        {swipeDirection === 'right' && (
          <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-start pl-6 border border-emerald-500/30">
            <Check className="h-6 w-6 text-emerald-400" />
          </div>
        )}
      </div>

      <button 
        onClick={onClick}
        className={`
          relative block w-full aspect-[2/3] rounded-xl overflow-hidden bg-white/5 
          transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-900/20
          focus:outline-none focus:ring-4 focus:ring-purple-500/20 active:scale-[0.98] z-10
          ${swipeDirection ? 'translate-x-0' : ''}
        `}
        style={{
          transform: swipeDirection === 'left' ? 'translateX(-60px)' : swipeDirection === 'right' ? 'translateX(60px)' : 'none'
        }}
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
          </div>
        </div>
      </button>

      {/* Action Buttons - Always Top for Both Desktop & Mobile */}
      {/* Mark as Watched (Left) */}
      <button
        onClick={(e) => { e.stopPropagation(); onMarkWatched(movie); }}
        disabled={markingWatched}
        className="absolute top-2 left-2 z-20 h-8 w-8 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/70 hover:text-emerald-400 hover:bg-black hover:border-emerald-500/50 transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100 active:scale-90 disabled:opacity-50 shadow-lg"
        title="Mark as watched"
      >
        {markingWatched ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-4 w-4" />}
      </button>

      {/* Remove Button (Right) */}
      <button
        onClick={(e) => { e.stopPropagation(); onRemove(movie.id); }}
        disabled={removing}
        className="absolute top-2 right-2 z-20 h-8 w-8 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/70 hover:text-red-400 hover:bg-black hover:border-red-500/50 transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100 active:scale-90 disabled:opacity-50 shadow-lg"
        title="Remove from watchlist"
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
        <Bookmark className="h-8 w-8 text-purple-400" />
      </div>
      <h2 className="text-xl md:text-2xl font-black text-white mb-2">Your watchlist is empty</h2>
      <p className="text-sm text-white/60 mb-8 max-w-sm leading-relaxed">
        Start adding movies you want to watch and build your personal collection
      </p>
      <a 
        href="/browse" 
        className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-3.5 rounded-xl text-sm font-bold text-white shadow-lg shadow-purple-900/30 hover:scale-105 hover:shadow-purple-900/50 active:scale-95 transition-all duration-300"
      >
        <Search className="h-4 w-4" />
        Browse Movies
      </a>
    </div>
  )
}
