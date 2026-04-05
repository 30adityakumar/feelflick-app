// src/app/pages/watchlist/Watchlist.jsx
import { useEffect, useState } from 'react'
import { Bookmark, Loader2, Search, Trash2, X, Check, ChevronDown } from 'lucide-react'
import { supabase } from '@/shared/lib/supabase/client'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

export default function Watchlist() {
  const nav = useNavigate()
  const [user, setUser]                     = useState(null)
  const [movies, setMovies]                 = useState([])
  const [filteredMovies, setFilteredMovies] = useState([])
  const [loading, setLoading]               = useState(true)
  const [removingId, setRemovingId]         = useState(null)
  const [markingId, setMarkingId]           = useState(null)
  const [searchQuery, setSearchQuery]       = useState('')
  const [sortBy, setSortBy]                 = useState('added')

  useEffect(() => {
    let active = true
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (active) setUser(user ?? null)
    })
    return () => { active = false }
  }, [])

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
        if (!ids?.length) {
          if (active) { setMovies([]); setFilteredMovies([]); setLoading(false) }
          return
        }

        const { data: rows, error: mErr } = await supabase
          .from('movies')
          .select('id,title,poster_path,release_date,vote_average,tmdb_id')
          .in('id', ids)
        if (mErr) throw mErr

        const map = new Map(rows.map(r => [r.id, r]))
        const merged = watchlist
          .map(w => { const m = map.get(w.movie_id); return m ? { ...m, added_at: w.added_at, status: w.status } : null })
          .filter(Boolean)

        if (active) { setMovies(merged); setFilteredMovies(merged) }
      } catch {
        if (active) { setMovies([]); setFilteredMovies([]) }
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => { active = false }
  }, [user, removingId, markingId])

  useEffect(() => {
    let result = [...movies]
    if (searchQuery) result = result.filter(m => m.title?.toLowerCase().includes(searchQuery.toLowerCase()))
    result.sort((a, b) => {
      if (sortBy === 'title')  return (a.title || '').localeCompare(b.title || '')
      if (sortBy === 'rating') return (b.vote_average || 0) - (a.vote_average || 0)
      return new Date(b.added_at) - new Date(a.added_at)
    })
    setFilteredMovies(result)
  }, [movies, searchQuery, sortBy])

  async function remove(movieId) {
    if (!user) return
    setRemovingId(movieId)
    try {
      await supabase.from('user_watchlist').delete().eq('user_id', user.id).eq('movie_id', movieId)
      setMovies(prev => prev.filter(m => m.id !== movieId))
    } finally {
      setRemovingId(null)
    }
  }

  async function markAsWatched(movie) {
    if (!user) return
    setMarkingId(movie.id)
    try {
      await supabase.from('user_history').insert({
        user_id: user.id, movie_id: movie.id,
        watched_at: new Date().toISOString(), source: 'watchlist',
        watch_duration_minutes: null, mood_session_id: null,
      })
      await supabase.from('user_watchlist').delete().eq('user_id', user.id).eq('movie_id', movie.id)
      setMovies(prev => prev.filter(m => m.id !== movie.id))
    } finally {
      setMarkingId(null)
    }
  }

  function goToMovie(movie) {
    if (movie.tmdb_id) nav(`/movie/${movie.tmdb_id}`)
  }

  const totalMovies = movies.length
  const avgRating = totalMovies > 0
    ? (movies.reduce((s, m) => s + (m.vote_average || 0), 0) / totalMovies).toFixed(1)
    : null

  return (
    <main
      className="min-h-screen bg-black text-white pb-24 md:pb-10"
      style={{ paddingTop: 'var(--hdr-h, 64px)' }}
    >
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 70% 35% at 50% 0%, rgba(88,28,135,0.1) 0%, transparent 65%)' }} />
      </div>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8 sm:py-10">

        {/* ── Page header ──────────────────────────────────────── */}
        <div className="mb-8">
          <h1 className="text-2xl font-black text-white tracking-tight mb-1">Watchlist</h1>
          <div className="flex items-center gap-3 text-sm text-white/35">
            {loading ? (
              <span>Loading…</span>
            ) : (
              <>
                <span>{totalMovies} {totalMovies === 1 ? 'film' : 'films'}</span>
                {avgRating && (
                  <>
                    <span className="text-white/15">·</span>
                    <span>★ {avgRating} avg</span>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* ── Search + sort ─────────────────────────────────────── */}
        {!loading && movies.length > 0 && (
          <div className="flex gap-2.5 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none" style={{ width: 16, height: 16 }} />
              <input
                type="text"
                placeholder="Search watchlist…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/8 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/12 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="relative">
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="appearance-none bg-white/5 border border-white/8 rounded-xl pl-4 pr-9 py-2.5 text-sm text-white/70 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/12 transition-all cursor-pointer"
              >
                <option value="added">Recent</option>
                <option value="title">A–Z</option>
                <option value="rating">Rating</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30 pointer-events-none" />
            </div>
          </div>
        )}

        {/* ── Content ───────────────────────────────────────────── */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-3">
              <svg className="h-7 w-7 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="rgba(168,85,247,0.2)" strokeWidth="3" />
                <path d="M21 12a9 9 0 0 0-9-9v9z" fill="rgb(168,85,247)" />
              </svg>
              <p className="text-sm text-white/30">Loading your watchlist…</p>
            </div>
          </div>

        ) : movies.length === 0 ? (
          <EmptyState />

        ) : filteredMovies.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="w-12 h-12 rounded-2xl border border-white/8 bg-white/3 flex items-center justify-center mb-4">
              <Search className="h-5 w-5 text-white/20" />
            </div>
            <p className="text-sm text-white/40 mb-3">No results for &ldquo;{searchQuery}&rdquo;</p>
            <button
              onClick={() => setSearchQuery('')}
              className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
            >
              Clear search
            </button>
          </div>

        ) : (
          <>
            {searchQuery && (
              <p className="text-xs text-white/25 mb-4">{filteredMovies.length} of {movies.length} films</p>
            )}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4">
              <AnimatePresence>
                {filteredMovies.map((movie, idx) => (
                  <motion.div
                    key={movie.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.92 }}
                    transition={{ duration: 0.2, delay: Math.min(idx * 0.03, 0.3) }}
                  >
                    <MovieCard
                      movie={movie}
                      removing={removingId === movie.id}
                      marking={markingId === movie.id}
                      onRemove={() => remove(movie.id)}
                      onMarkWatched={() => markAsWatched(movie)}
                      onClick={() => goToMovie(movie)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </>
        )}

      </div>
    </main>
  )
}

// ── Movie card ─────────────────────────────────────────────────────────────────

function MovieCard({ movie, removing, marking, onRemove, onMarkWatched, onClick }) {
  const [swipe, setSwipe] = useState(null) // null | 'left' | 'right'
  const touchX = useState(null)

  const year   = movie.release_date?.slice(0, 4)
  const rating = movie.vote_average >= 1 ? movie.vote_average.toFixed(1) : null
  const poster = movie.poster_path ? `https://image.tmdb.org/t/p/w342${movie.poster_path}` : null

  function onTouchStart(e)  { touchX[1](e.targetTouches[0].clientX) }
  function onTouchMove(e) {
    if (touchX[0] == null) return
    const dx = touchX[0] - e.targetTouches[0].clientX
    setSwipe(dx > 50 ? 'left' : dx < -50 ? 'right' : null)
  }
  function onTouchEnd() {
    if (swipe === 'left')  onRemove()
    if (swipe === 'right') onMarkWatched()
    setSwipe(null); touchX[1](null)
  }

  return (
    <div
      className="group relative touch-pan-y"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Swipe hint (mobile) */}
      <AnimatePresence>
        {swipe && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`absolute inset-0 z-0 rounded-xl flex items-center ${
              swipe === 'left'
                ? 'justify-end pr-4 bg-red-500/15 border border-red-500/20'
                : 'justify-start pl-4 bg-purple-500/15 border border-purple-500/20'
            }`}
          >
            {swipe === 'left'
              ? <Trash2 className="h-5 w-5 text-red-400" />
              : <Check className="h-5 w-5 text-purple-400" />}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Poster */}
      <motion.button
        onClick={onClick}
        animate={{ x: swipe === 'left' ? -48 : swipe === 'right' ? 48 : 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="relative block w-full aspect-[2/3] rounded-xl overflow-hidden bg-white/5 ring-1 ring-white/8 hover:ring-purple-500/35 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-purple-500/12 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 z-10"
      >
        {poster ? (
          <img src={poster} alt={movie.title} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-white/15 text-xs">No image</span>
          </div>
        )}

        {/* Info overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
          <div className="absolute inset-x-0 bottom-0 p-2">
            <p className="text-[11px] font-semibold text-white leading-tight line-clamp-2 mb-1">
              {movie.title}
            </p>
            <div className="flex items-center gap-1.5 text-[10px] text-white/55">
              {year && <span>{year}</span>}
              {rating && <><span className="text-white/20">·</span><span>★ {rating}</span></>}
            </div>
          </div>
        </div>
      </motion.button>

      {/* ── Action buttons ── */}
      {/* Mark watched — top left */}
      <button
        onClick={e => { e.stopPropagation(); onMarkWatched() }}
        disabled={marking || removing}
        aria-label={`Mark ${movie.title} as watched`}
        className="absolute top-1.5 left-1.5 z-20 h-6 w-6 rounded-full bg-black/70 border border-white/12 flex items-center justify-center text-white/45 hover:text-purple-400 hover:bg-black/90 hover:border-purple-500/30 transition-all duration-150 opacity-100 md:opacity-0 md:group-hover:opacity-100 disabled:opacity-30"
      >
        {marking
          ? <Loader2 className="h-3 w-3 animate-spin" />
          : <Check className="h-3 w-3" />}
      </button>

      {/* Remove — top right */}
      <button
        onClick={e => { e.stopPropagation(); onRemove() }}
        disabled={removing || marking}
        aria-label={`Remove ${movie.title} from watchlist`}
        className="absolute top-1.5 right-1.5 z-20 h-6 w-6 rounded-full bg-black/70 border border-white/12 flex items-center justify-center text-white/45 hover:text-red-400 hover:bg-black/90 hover:border-red-500/25 transition-all duration-150 opacity-100 md:opacity-0 md:group-hover:opacity-100 disabled:opacity-30"
      >
        {removing
          ? <Loader2 className="h-3 w-3 animate-spin" />
          : <Trash2 className="h-3 w-3" />}
      </button>
    </div>
  )
}

// ── Empty state ────────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 rounded-2xl border border-white/8 bg-white/3 flex items-center justify-center mb-5">
        <Bookmark className="h-7 w-7 text-white/15" />
      </div>
      <h2 className="text-lg font-bold text-white mb-2">Nothing saved yet</h2>
      <p className="text-sm text-white/35 max-w-xs leading-relaxed mb-6">
        Save films you want to watch and they&apos;ll appear here.
      </p>
      <a
        href="/discover"
        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-sm font-semibold text-white shadow-md shadow-purple-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all"
      >
        Discover films
      </a>
    </div>
  )
}
