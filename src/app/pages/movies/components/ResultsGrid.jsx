// src/app/pages/browse/ResultsGrid.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/shared/lib/supabase/client'
import { Plus, Check, Eye, EyeOff, Info } from 'lucide-react'

const tmdbImg = (p) => p ? `https://image.tmdb.org/t/p/w500${p}` : ''

export default function ResultsGrid({ movies, user }) {
  const [watchlistTmdbIds, setWatchlistTmdbIds] = useState(new Set())
  const [watchedTmdbIds, setWatchedTmdbIds] = useState(new Set())
  const [hoveredMovie, setHoveredMovie] = useState(null)
  const [genres, setGenres] = useState({})
  const navigate = useNavigate()

  // Fetch Genres
  useEffect(() => {
    fetch(`https://api.themoviedb.org/3/genre/movie/list?api_key=${import.meta.env.VITE_TMDB_API_KEY}`)
      .then(r => r.json())
      .then(data => {
        const genreMap = {}
        data.genres?.forEach(g => { genreMap[g.id] = g.name })
        setGenres(genreMap)
      })
      .catch(console.error)
  }, [])

  // Sync Status from Supabase
  useEffect(() => {
    let active = true
    async function syncStatus() {
      if (!user?.id || !movies.length) return

      const tmdbIds = movies.map(m => m.id)

      // Fetch from user_watchlist (uses tmdb_id via movies table)
      const { data: moviesData } = await supabase
        .from('movies')
        .select('id, tmdb_id')
        .in('tmdb_id', tmdbIds)

      if (!moviesData) return

      const tmdbToInternalId = {}
      moviesData.forEach(m => { tmdbToInternalId[m.tmdb_id] = m.id })

      const internalIds = moviesData.map(m => m.id)

      const { data: wl } = await supabase
        .from('user_watchlist')
        .select('movie_id')
        .eq('user_id', user.id)
        .in('movie_id', internalIds)

      const { data: wh } = await supabase
        .from('movies_watched')
        .select('movie_id')
        .eq('user_id', user.id)
        .in('movie_id', internalIds)

      if (!active) return

      // Convert back to TMDB IDs for UI state
      const watchlistTmdb = new Set()
      const watchedTmdb = new Set()

      wl?.forEach(w => {
        const tmdbId = Object.keys(tmdbToInternalId).find(key => tmdbToInternalId[key] === w.movie_id)
        if (tmdbId) watchlistTmdb.add(Number(tmdbId))
      })

      wh?.forEach(w => {
        const tmdbId = Object.keys(tmdbToInternalId).find(key => tmdbToInternalId[key] === w.movie_id)
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
      setWatchlistTmdbIds(prev => { const n = new Set(prev); n.delete(tmdbId); return n })
      const internalId = await ensureMovieInDb(movie)
      await supabase.from('user_watchlist').delete().eq('user_id', user.id).eq('movie_id', internalId)
    } else {
      setWatchlistTmdbIds(prev => new Set(prev).add(tmdbId))
      setWatchedTmdbIds(prev => { const n = new Set(prev); n.delete(tmdbId); return n })
      const internalId = await ensureMovieInDb(movie)
      await Promise.all([
        supabase.from('user_watchlist').upsert({
          user_id: user.id,
          movie_id: internalId,
          added_at: new Date().toISOString(),
          status: 'want_to_watch'
        }, { onConflict: 'user_id,movie_id' }),
        supabase.from('movies_watched').delete().eq('user_id', user.id).eq('movie_id', internalId)
      ])
    }
  }

  const toggleWatched = async (e, movie) => {
    e.stopPropagation()
    if (!user) return navigate('/auth')

    const tmdbId = movie.id
    const isWatched = watchedTmdbIds.has(tmdbId)

    if (isWatched) {
      setWatchedTmdbIds(prev => { const n = new Set(prev); n.delete(tmdbId); return n })
      const internalId = await ensureMovieInDb(movie)
      await supabase.from('movies_watched').delete().eq('user_id', user.id).eq('movie_id', internalId)
    } else {
      setWatchedTmdbIds(prev => new Set(prev).add(tmdbId))
      setWatchlistTmdbIds(prev => { const n = new Set(prev); n.delete(tmdbId); return n })
      const internalId = await ensureMovieInDb(movie)
      await Promise.all([
        supabase.from('movies_watched').upsert({
          user_id: user.id,
          movie_id: internalId,
          title: movie.title,
          poster: movie.poster_path,
          release_date: movie.release_date || null,
          vote_average: movie.vote_average,
          genre_ids: movie.genre_ids,
          watched_at: new Date().toISOString(),
          source: 'browse'
        }, { onConflict: 'user_id,movie_id' }),
        supabase.from('user_watchlist').delete().eq('user_id', user.id).eq('movie_id', internalId)
      ])
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
              className={`relative bg-neutral-900 rounded-lg overflow-hidden shadow-lg cursor-pointer transition-all duration-300 ${
                isHovered ? 'scale-105 shadow-2xl z-30' : 'scale-100'
              }`}
              onClick={() => navigate(`/movie/${movie.id}`)}
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
                  <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-md bg-gradient-to-br from-purple-500/90 to-pink-500/90 backdrop-blur-sm shadow-lg">
                    <span className="text-white text-xs font-bold">★</span>
                    <span className="text-white text-xs font-bold">{movie.vote_average.toFixed(1)}</span>
                  </div>
                )}
              </div>

              {/* Hover Overlay */}
              {isHovered && (
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/95 to-transparent flex flex-col justify-end p-3">
                  {/* Title */}
                  <h3 className="text-white text-sm font-bold line-clamp-2 mb-2">{movie.title}</h3>

                  {/* Meta */}
                  <div className="flex items-center gap-2 mb-2 text-xs text-white/80">
                    {movie.release_date && <span>{new Date(movie.release_date).getFullYear()}</span>}
                    {movie.vote_average > 0 && (
                      <>
                        <span>•</span>
                        <span className="text-purple-300 font-semibold">★ {movie.vote_average.toFixed(1)}</span>
                      </>
                    )}
                  </div>

                  {/* Genres */}
                  {movieGenres.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {movieGenres.map(genre => (
                        <span key={genre} className="px-2 py-0.5 rounded-full bg-white/10 text-white/70 text-[10px] font-medium backdrop-blur-sm">
                          {genre}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {/* View Details */}
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/movie/${movie.id}`) }}
                      className="flex-1 flex items-center justify-center gap-1 h-8 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs font-bold transition-all hover:scale-105"
                    >
                      <Info className="h-3 w-3" />
                      <span>Details</span>
                    </button>

                    {user && (
                      <>
                        {/* Watchlist */}
                        <button
                          onClick={(e) => toggleWatchlist(e, movie)}
                          className={`flex items-center justify-center h-8 w-8 rounded-lg transition-all hover:scale-110 backdrop-blur-md border shadow-lg ${
                            isInWatchlist ? 'bg-purple-500/30 border-purple-400 text-purple-300' : 'bg-white/10 hover:bg-white/20 border-white/20 text-white'
                          }`}
                          title={isInWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
                        >
                          {isInWatchlist ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                        </button>

                        {/* Watched */}
                        <button
                          onClick={(e) => toggleWatched(e, movie)}
                          className={`flex items-center justify-center h-8 w-8 rounded-lg transition-all hover:scale-110 backdrop-blur-md border shadow-lg ${
                            isWatched ? 'bg-emerald-500/30 border-emerald-400 text-emerald-300' : 'bg-white/10 hover:bg-white/20 border-white/20 text-white'
                          }`}
                          title={isWatched ? 'Mark as Unwatched' : 'Mark as Watched'}
                        >
                          {isWatched ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        </button>
                      </>
                    )}
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
