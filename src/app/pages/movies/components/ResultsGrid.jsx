// src/app/pages/browse/ResultsGrid.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/shared/lib/supabase/client'
import { Plus, Check, Eye, EyeOff, Star } from 'lucide-react'
import { getGenres, tmdbImg } from '@/shared/api/tmdb'

export default function ResultsGrid({ movies, user }) {
  const [watchlistTmdbIds, setWatchlistTmdbIds] = useState(new Set())
  const [watchedTmdbIds, setWatchedTmdbIds] = useState(new Set())
  const [hoveredMovie, setHoveredMovie] = useState(null)
  const [genres, setGenres] = useState({})
  const navigate = useNavigate()

  // Fetch Genres
  useEffect(() => {
    getGenres()
      .then(data => {
        const genreMap = {}
        data.genres?.forEach(g => { genreMap[g.id] = g.name })
        setGenres(genreMap)
      })
      .catch(console.error)
  }, [])

  // Sync Status from Supabase
  // Sync Status from Supabase (normalized)
useEffect(() => {
  let active = true

  async function syncStatus() {
    if (!user?.id || !movies.length) return

    const tmdbIds = movies.map(m => m.id)

    // Map TMDB → internal movies.id
    const { data: moviesData, error: moviesErr } = await supabase
      .from('movies')
      .select('id, tmdb_id')
      .in('tmdb_id', tmdbIds)

    if (moviesErr) {
      console.error('[ResultsGrid] movies lookup error:', moviesErr)
      return
    }
    if (!moviesData?.length) return

    const tmdbToInternalId = {}
    moviesData.forEach(m => {
      tmdbToInternalId[m.tmdb_id] = m.id
    })
    const internalIds = moviesData.map(m => m.id)

    const { data: wl, error: wlErr } = await supabase
      .from('user_watchlist')
      .select('movie_id')
      .eq('user_id', user.id)
      .in('movie_id', internalIds)

    const { data: wh, error: whErr } = await supabase
      .from('user_history')
      .select('movie_id')
      .eq('user_id', user.id)
      .in('movie_id', internalIds)

    if (wlErr) console.error('[ResultsGrid] watchlist status error:', wlErr)
    if (whErr) console.error('[ResultsGrid] history status error:', whErr)
    if (!active) return

    // Convert back to TMDB IDs for UI state
    const watchlistTmdb = new Set()
    const watchedTmdb = new Set()

    wl?.forEach(w => {
      const tmdbId = Object.keys(tmdbToInternalId)
        .find(key => tmdbToInternalId[key] === w.movie_id)
      if (tmdbId) watchlistTmdb.add(Number(tmdbId))
    })

    wh?.forEach(w => {
      const tmdbId = Object.keys(tmdbToInternalId)
        .find(key => tmdbToInternalId[key] === w.movie_id)
      if (tmdbId) watchedTmdb.add(Number(tmdbId))
    })

    setWatchlistTmdbIds(watchlistTmdb)
    setWatchedTmdbIds(watchedTmdb)
  }

  syncStatus()
  return () => { active = false }
}, [user, movies])


  async function ensureMovieInDb(movie) {
    const { data } = await supabase
      .from('movies')
      .upsert({
        tmdb_id: movie.id,
        title: movie.title,
        original_title: movie.original_title,
        overview: movie.overview,
        poster_path: movie.poster_path,
        backdrop_path: movie.backdrop_path,
        release_date: movie.release_date || null,
        vote_average: movie.vote_average,
        vote_count: movie.vote_count,
        popularity: movie.popularity,
        original_language: movie.original_language,
        json_data: movie
      }, { onConflict: 'tmdb_id' })
      .select('id')
      .single()

    return data?.id
  }

  const toggleWatchlist = async (e, movie) => {
  e.stopPropagation()
  if (!user) return navigate('/auth')

  const tmdbId = movie.id
  const isInWatchlist = watchlistTmdbIds.has(tmdbId)

  if (isInWatchlist) {
    // Remove from watchlist
    setWatchlistTmdbIds(prev => {
      const n = new Set(prev); n.delete(tmdbId); return n
    })

    const internalId = await ensureMovieInDb(movie)
    if (internalId) {
      await supabase
        .from('user_watchlist')
        .delete()
        .eq('user_id', user.id)
        .eq('movie_id', internalId)
    }
  } else {
    // Add to watchlist, remove watched flag
    setWatchlistTmdbIds(prev => new Set(prev).add(tmdbId))
    setWatchedTmdbIds(prev => {
      const n = new Set(prev); n.delete(tmdbId); return n
    })

    const internalId = await ensureMovieInDb(movie)
    if (internalId) {
      await Promise.all([
        supabase
          .from('user_watchlist')
          .upsert({
            user_id: user.id,
            movie_id: internalId,
            added_at: new Date().toISOString(),
            status: 'want_to_watch',
            added_from_recommendation: false,
            mood_session_id: null,
            source: 'browse',
          }, { onConflict: 'user_id,movie_id' }),

        supabase
          .from('user_history')
          .delete()
          .eq('user_id', user.id)
          .eq('movie_id', internalId),
      ])
    }
  }
}


  const toggleWatched = async (e, movie) => {
  e.stopPropagation()
  if (!user) return navigate('/auth')

  const tmdbId = movie.id
  const isWatched = watchedTmdbIds.has(tmdbId)

  if (isWatched) {
    // Remove from history
    setWatchedTmdbIds(prev => {
      const n = new Set(prev); n.delete(tmdbId); return n
    })

    const internalId = await ensureMovieInDb(movie)
    if (internalId) {
      await supabase
        .from('user_history')
        .delete()
        .eq('user_id', user.id)
        .eq('movie_id', internalId)
    }
  } else {
    // Mark as watched, remove from watchlist
    setWatchedTmdbIds(prev => new Set(prev).add(tmdbId))
    setWatchlistTmdbIds(prev => {
      const n = new Set(prev); n.delete(tmdbId); return n
    })

    const internalId = await ensureMovieInDb(movie)
    if (internalId) {
      await Promise.all([
        supabase
          .from('user_history')
          .insert({
            user_id: user.id,
            movie_id: internalId,
            watched_at: new Date().toISOString(),
            source: 'browse',
            watch_duration_minutes: null,
            mood_session_id: null,
          }),

        supabase
          .from('user_watchlist')
          .delete()
          .eq('user_id', user.id)
          .eq('movie_id', internalId),
      ])
    }
  }
}


  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
      {movies.map((movie) => {
        const isInWatchlist = watchlistTmdbIds.has(movie.id)
        const isWatched = watchedTmdbIds.has(movie.id)
        const isHovered = hoveredMovie === movie.id
        const movieGenres = movie.genre_ids?.slice(0, 2).map(id => genres[id]).filter(Boolean) || []

        return (
          <div
            key={movie.id}
            className="relative group"
            onMouseEnter={() => setHoveredMovie(movie.id)}
            onMouseLeave={() => setHoveredMovie(null)}
          >
            <div
              className={`relative bg-neutral-900 rounded-xl overflow-hidden shadow-lg cursor-pointer transition-all duration-300 ${
                isHovered ? 'scale-105 shadow-2xl z-30' : 'scale-100'
              }`}
              onClick={() => navigate(`/movie/${movie.id}`)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  navigate(`/movie/${movie.id}`)
                }
              }}
            >
              {/* Poster */}
              <div className="relative aspect-[2/3] overflow-hidden">
                {movie.poster_path ? (
                  <img src={tmdbImg(movie.poster_path)} alt={movie.title} className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <div className="w-full h-full bg-white/10 flex items-center justify-center text-white/40 text-xs">No Poster</div>
                )}

                {/* Rating Badge */}
                {movie.vote_average > 0 && (
                  <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-black/75 backdrop-blur-sm">
                    <Star className="h-2.5 w-2.5 text-yellow-400 fill-yellow-400" />
                    <span className="text-white text-[10px] font-bold">{movie.vote_average.toFixed(1)}</span>
                  </div>
                )}
              </div>

              {/* Hover Overlay */}
              {isHovered && (
                <div className="absolute inset-x-0 bottom-0 pt-10 pb-3 px-3 bg-gradient-to-t from-black via-black/85 to-transparent">
                  {/* Title */}
                  <h3 className="text-[0.9rem] font-bold text-white mb-1.5 line-clamp-1 leading-tight">{movie.title}</h3>

                  {/* Meta */}
                  <div className="flex items-center gap-1.5 text-[0.68rem] mb-1.5">
                    {movie.release_date && <span className="text-white/60">{new Date(movie.release_date).getFullYear()}</span>}
                    {movie.vote_average > 0 && (
                      <span className="text-emerald-400 font-bold">{Math.round(movie.vote_average * 10)}%</span>
                    )}
                  </div>

                  {/* Genres */}
                  {movieGenres.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {movieGenres.map(genre => (
                        <span key={genre} className="text-[0.62rem] text-white/55 bg-white/8 px-1.5 py-0.5 rounded-full">
                          {genre}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-1.5">
                    {user && (
                      <>
                        {/* Watchlist */}
                        <button
                          onClick={(e) => toggleWatchlist(e, movie)}
                          className={`h-8 w-8 rounded-full border text-xs flex items-center justify-center transition-all duration-150 hover:scale-110 active:scale-95 ${
                            isInWatchlist ? 'bg-purple-500/90 border-purple-400 text-white' : 'bg-black/60 border-white/25 text-white hover:bg-black/85 hover:border-white/40'
                          }`}
                          title={isInWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
                        >
                          {isInWatchlist ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                        </button>

                        {/* Watched */}
                        <button
                          onClick={(e) => toggleWatched(e, movie)}
                          className={`h-8 w-8 rounded-full border text-xs flex items-center justify-center transition-all duration-150 hover:scale-110 active:scale-95 ${
                            isWatched ? 'bg-emerald-500/90 border-emerald-400 text-white' : 'bg-black/60 border-white/25 text-white hover:bg-black/85 hover:border-white/40'
                          }`}
                          title={isWatched ? 'Mark as Unwatched' : 'Mark as Watched'}
                        >
                          {isWatched ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                        </button>
                      </>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/movie/${movie.id}`) }}
                      className="ml-auto flex items-center gap-0.5 h-7 px-2 rounded-full border border-white/20 bg-black/50 text-white/70 hover:text-white hover:bg-black/75 hover:border-white/35 transition-all text-[0.65rem] font-semibold"
                    >
                      More
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
