// src/app/pages/movies/components/ResultsGrid.jsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Check, Eye, EyeOff, Star, Info } from 'lucide-react'

import { supabase } from '@/shared/lib/supabase/client'
import { tmdbImg } from '@/shared/api/tmdb'

/**
 * ResultsGrid
 * - Presentational + actions
 * - Expects TMDB `results` array
 */
export default function ResultsGrid({ results = [] }) {
  const [user, setUser] = useState(null)
  const [watchlistTmdbIds, setWatchlistTmdbIds] = useState(new Set())
  const [watchedTmdbIds, setWatchedTmdbIds] = useState(new Set())
  const [mutating, setMutating] = useState(false)

  const navigate = useNavigate()

  // Load current user
  useEffect(() => {
    let active = true
    ;(async () => {
      const { data } = await supabase.auth.getUser()
      if (!active) return
      setUser(data?.user ?? null)
    })()
    return () => {
      active = false
    }
  }, [])

  // Sync watchlist & watched status for the current result set
  useEffect(() => {
    let active = true

    async function syncStatus() {
      if (!user?.id || !results.length) {
        setWatchlistTmdbIds(new Set())
        setWatchedTmdbIds(new Set())
        return
      }

      const tmdbIds = results.map((m) => m.id)

      // Map TMDB IDs to internal movies.id
      const { data: movieRows, error: movieErr } = await supabase
        .from('movies')
        .select('id, tmdb_id')
        .in('tmdb_id', tmdbIds)

      if (movieErr || !active) {
        return
      }

      const movieIdToTmdbId = new Map()
      const movieIds = []

      for (const row of movieRows || []) {
        movieIdToTmdbId.set(row.id, row.tmdb_id)
        movieIds.push(row.id)
      }

      if (!movieIds.length) {
        setWatchlistTmdbIds(new Set())
        setWatchedTmdbIds(new Set())
        return
      }

      const [{ data: wl }, { data: wh }] = await Promise.all([
        supabase
          .from('user_watchlist')
          .select('movie_id')
          .eq('user_id', user.id)
          .in('movie_id', movieIds),
        supabase
          .from('movies_watched')
          .select('movie_id')
          .eq('user_id', user.id)
          .in('movie_id', movieIds),
      ])

      if (!active) return

      const wlSet = new Set()
      const whSet = new Set()

      for (const row of wl || []) {
        const tmdbId = movieIdToTmdbId.get(row.movie_id)
        if (tmdbId) wlSet.add(tmdbId)
      }

      for (const row of wh || []) {
        const tmdbId = movieIdToTmdbId.get(row.movie_id)
        if (tmdbId) whSet.add(tmdbId)
      }

      setWatchlistTmdbIds(wlSet)
      setWatchedTmdbIds(whSet)
    }

    syncStatus()
    return () => {
      active = false
    }
  }, [results, user])

  async function ensureMovieInDb(movie) {
    // Upsert by tmdb_id and return internal movies.id
    const payload = {
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
      json_data: movie,
    }

    const { data, error } = await supabase
      .from('movies')
      .upsert(payload, { onConflict: 'tmdb_id' })
      .select('id')
      .single()

    if (error) throw error
    return data.id
  }

  async function requireUser() {
    const { data } = await supabase.auth.getUser()
    if (data?.user) return data.user
    navigate('/auth', { replace: true, state: { from: '/browse' } })
    return null
  }

  async function toggleWatchlist(e, movie) {
    e.stopPropagation()
    const existingUser = user || (await requireUser())
    if (!existingUser) return

    setMutating(true)
    const tmdbId = movie.id
    const currentlyIn = watchlistTmdbIds.has(tmdbId)

    try {
      const movieId = await ensureMovieInDb(movie)

      if (currentlyIn) {
        await supabase
          .from('user_watchlist')
          .delete()
          .eq('user_id', existingUser.id)
          .eq('movie_id', movieId)

        setWatchlistTmdbIds((prev) => {
          const copy = new Set(prev)
          copy.delete(tmdbId)
          return copy
        })
      } else {
        setWatchlistTmdbIds((prev) => new Set(prev).add(tmdbId))
        setWatchedTmdbIds((prev) => {
          const copy = new Set(prev)
          copy.delete(tmdbId)
          return copy
        })

        await Promise.all([
          supabase.from('user_watchlist').upsert(
            {
              user_id: existingUser.id,
              movie_id: movieId,
              added_at: new Date().toISOString(),
              status: 'want_to_watch',
            },
            { onConflict: 'user_id,movie_id' }
          ),
          supabase
            .from('movies_watched')
            .delete()
            .eq('user_id', existingUser.id)
            .eq('movie_id', movieId),
        ])
      }
    } finally {
      setMutating(false)
    }
  }

  async function toggleWatched(e, movie) {
    e.stopPropagation()
    const existingUser = user || (await requireUser())
    if (!existingUser) return

    setMutating(true)
    const tmdbId = movie.id
    const currentlyWatched = watchedTmdbIds.has(tmdbId)

    try {
      const movieId = await ensureMovieInDb(movie)

      if (currentlyWatched) {
        await supabase
          .from('movies_watched')
          .delete()
          .eq('user_id', existingUser.id)
          .eq('movie_id', movieId)

        setWatchedTmdbIds((prev) => {
          const copy = new Set(prev)
          copy.delete(tmdbId)
          return copy
        })
      } else {
        setWatchedTmdbIds((prev) => new Set(prev).add(tmdbId))
        setWatchlistTmdbIds((prev) => {
          const copy = new Set(prev)
          copy.delete(tmdbId)
          return copy
        })

        await Promise.all([
          supabase.from('movies_watched').upsert(
            {
              user_id: existingUser.id,
              movie_id: movieId,
              title: movie.title,
              poster: movie.poster_path,
              release_date: movie.release_date || null,
              vote_average: movie.vote_average,
              genre_ids: movie.genre_ids || [],
              watched_at: new Date().toISOString(),
              source: 'browse',
            },
            { onConflict: 'user_id,movie_id' }
          ),
          supabase
            .from('user_watchlist')
            .delete()
            .eq('user_id', existingUser.id)
            .eq('movie_id', movieId),
        ])
      }
    } finally {
      setMutating(false)
    }
  }

  if (!results?.length) {
    return (
      <div className="py-10 text-center text-sm text-white/60">
        No movies found. Try adjusting your filters or search.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-5">
      {results.map((movie) => {
        const isInWatchlist = watchlistTmdbIds.has(movie.id)
        const isWatched = watchedTmdbIds.has(movie.id)
        const rating =
          typeof movie.vote_average === 'number'
            ? movie.vote_average.toFixed(1)
            : null

        return (
          <div
            key={movie.id}
            className="relative group rounded-xl overflow-hidden bg-neutral-900/80 border border-white/5 cursor-pointer shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-1"
            onClick={() => navigate(`/movie/${movie.id}`)}
          >
            {/* Poster */}
            <div className="relative aspect-[2/3]">
              <img
                src={tmdbImg(movie.poster_path, 'w500')}
                alt={movie.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />

              {/* Rating badge */}
              {rating && (
                <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-md bg-gradient-to-br from-purple-500/90 to-pink-500/90 backdrop-blur-sm shadow-lg text-xs font-bold text-white">
                  <Star className="h-3 w-3 fill-current" />
                  <span>{rating}</span>
                </div>
              )}

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                <h3 className="text-sm font-bold text-white line-clamp-2 mb-1.5">
                  {movie.title}
                </h3>

                <div className="flex items-center gap-2 text-[11px] text-white/80 mb-1">
                  {movie.release_date && (
                    <span>
                      {new Date(movie.release_date).getFullYear()}
                    </span>
                  )}
                  {rating && (
                    <>
                      <span>•</span>
                      <span className="text-purple-300 font-semibold">
                        ★ {rating}
                      </span>
                    </>
                  )}
                </div>

                {movie.overview && (
                  <p className="text-[11px] text-white/70 line-clamp-2 mb-2">
                    {movie.overview}
                  </p>
                )}

                <div className="flex items-center gap-2">
                  {/* Details button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      navigate(`/movie/${movie.id}`)
                    }}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 h-8 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-xs font-bold text-white shadow-lg transition-all hover:scale-105"
                  >
                    <Info className="h-3.5 w-3.5" />
                    <span>Details</span>
                  </button>

                  {user && (
                    <>
                      {/* Watchlist */}
                      <button
                        type="button"
                        disabled={mutating}
                        onClick={(e) => toggleWatchlist(e, movie)}
                        className={`inline-flex items-center justify-center h-8 w-8 rounded-lg border backdrop-blur-md shadow-lg text-xs transition-all hover:scale-110 disabled:opacity-50 ${
                          isInWatchlist
                            ? 'bg-purple-500/25 border-purple-400 text-purple-200'
                            : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                        }`}
                        title={
                          isInWatchlist ? 'In Watchlist' : 'Add to Watchlist'
                        }
                      >
                        {isInWatchlist ? (
                          <Check className="h-3.5 w-3.5" />
                        ) : (
                          <Plus className="h-3.5 w-3.5" />
                        )}
                      </button>

                      {/* Watched */}
                      <button
                        type="button"
                        disabled={mutating}
                        onClick={(e) => toggleWatched(e, movie)}
                        className={`inline-flex items-center justify-center h-8 w-8 rounded-lg border backdrop-blur-md shadow-lg text-xs transition-all hover:scale-110 disabled:opacity-50 ${
                          isWatched
                            ? 'bg-emerald-500/25 border-emerald-400 text-emerald-200'
                            : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                        }`}
                        title={
                          isWatched ? 'Mark as unwatched' : 'Mark as watched'
                        }
                      >
                        {isWatched ? (
                          <Eye className="h-3.5 w-3.5" />
                        ) : (
                          <EyeOff className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
