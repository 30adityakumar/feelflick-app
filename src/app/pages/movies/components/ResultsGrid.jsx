// src/app/pages/browse/ResultsGrid.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/shared/lib/supabase/client'
import { Plus, Check, Eye, EyeOff, Star, ChevronRight } from 'lucide-react'
import { getGenres, tmdbImg } from '@/shared/api/tmdb'

export default function ResultsGrid({ movies, user }) {
  const [watchlistTmdbIds, setWatchlistTmdbIds] = useState(new Set())
  const [watchedTmdbIds,   setWatchedTmdbIds]   = useState(new Set())
  const [hoveredMovie, setHoveredMovie] = useState(null)
  const [genres, setGenres] = useState({})
  const navigate = useNavigate()

  useEffect(() => {
    getGenres()
      .then((data) => {
        const map = {}
        data.genres?.forEach((g) => { map[g.id] = g.name })
        setGenres(map)
      })
      .catch(console.error)
  }, [])

  useEffect(() => {
    let active = true
    async function syncStatus() {
      if (!user?.id || !movies.length) return
      const tmdbIds = movies.map((m) => m.id)

      const { data: moviesData } = await supabase
        .from('movies').select('id, tmdb_id').in('tmdb_id', tmdbIds)
      if (!moviesData?.length || !active) return

      const tmdbToId = {}
      moviesData.forEach((m) => { tmdbToId[m.tmdb_id] = m.id })
      const internalIds = moviesData.map((m) => m.id)

      const [{ data: wl }, { data: wh }] = await Promise.all([
        supabase.from('user_watchlist').select('movie_id').eq('user_id', user.id).in('movie_id', internalIds),
        supabase.from('user_history').select('movie_id').eq('user_id', user.id).in('movie_id', internalIds),
      ])
      if (!active) return

      const toTmdb = (internalId) =>
        Number(Object.keys(tmdbToId).find((k) => tmdbToId[k] === internalId))

      setWatchlistTmdbIds(new Set(wl?.map((r) => toTmdb(r.movie_id)).filter(Boolean) ?? []))
      setWatchedTmdbIds(new Set(wh?.map((r) => toTmdb(r.movie_id)).filter(Boolean) ?? []))
    }
    syncStatus()
    return () => { active = false }
  }, [user, movies])

  async function ensureMovieInDb(movie) {
    const { data } = await supabase
      .from('movies')
      .upsert({
        tmdb_id: movie.id, title: movie.title, original_title: movie.original_title,
        overview: movie.overview, poster_path: movie.poster_path, backdrop_path: movie.backdrop_path,
        release_date: movie.release_date || null, vote_average: movie.vote_average,
        vote_count: movie.vote_count, popularity: movie.popularity,
        original_language: movie.original_language, json_data: movie,
      }, { onConflict: 'tmdb_id' })
      .select('id').single()
    return data?.id
  }

  const toggleWatchlist = async (e, movie) => {
    e.stopPropagation()
    if (!user) return navigate('/auth')
    const tmdbId = movie.id
    const isIn = watchlistTmdbIds.has(tmdbId)
    setWatchlistTmdbIds((prev) => { const s = new Set(prev); isIn ? s.delete(tmdbId) : s.add(tmdbId); return s })
    if (!isIn) setWatchedTmdbIds((prev) => { const s = new Set(prev); s.delete(tmdbId); return s })
    const internalId = await ensureMovieInDb(movie)
    if (!internalId) return
    if (isIn) {
      await supabase.from('user_watchlist').delete().eq('user_id', user.id).eq('movie_id', internalId)
    } else {
      await Promise.all([
        supabase.from('user_watchlist').upsert({ user_id: user.id, movie_id: internalId, added_at: new Date().toISOString(), status: 'want_to_watch', source: 'browse' }, { onConflict: 'user_id,movie_id' }),
        supabase.from('user_history').delete().eq('user_id', user.id).eq('movie_id', internalId),
      ])
    }
  }

  const toggleWatched = async (e, movie) => {
    e.stopPropagation()
    if (!user) return navigate('/auth')
    const tmdbId = movie.id
    const isWatched = watchedTmdbIds.has(tmdbId)
    setWatchedTmdbIds((prev) => { const s = new Set(prev); isWatched ? s.delete(tmdbId) : s.add(tmdbId); return s })
    if (!isWatched) setWatchlistTmdbIds((prev) => { const s = new Set(prev); s.delete(tmdbId); return s })
    const internalId = await ensureMovieInDb(movie)
    if (!internalId) return
    if (isWatched) {
      await supabase.from('user_history').delete().eq('user_id', user.id).eq('movie_id', internalId)
    } else {
      await Promise.all([
        supabase.from('user_history').insert({ user_id: user.id, movie_id: internalId, watched_at: new Date().toISOString(), source: 'browse' }),
        supabase.from('user_watchlist').delete().eq('user_id', user.id).eq('movie_id', internalId),
      ])
    }
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 md:gap-4">
      {movies.map((movie) => {
        const isInWatchlist = watchlistTmdbIds.has(movie.id)
        const isWatched     = watchedTmdbIds.has(movie.id)
        const isHovered     = hoveredMovie === movie.id
        const movieGenres   = movie.genre_ids?.slice(0, 2).map((id) => genres[id]).filter(Boolean) ?? []
        const year          = movie.release_date ? new Date(movie.release_date).getFullYear() : null

        return (
          <div
            key={movie.id}
            className="group relative"
            onMouseEnter={() => setHoveredMovie(movie.id)}
            onMouseLeave={() => setHoveredMovie(null)}
          >
            <div
              className={`relative cursor-pointer overflow-hidden rounded-xl transition-all duration-200 ${
                isHovered ? 'z-20 scale-[1.03] shadow-[0_8px_32px_rgba(0,0,0,0.7)]' : 'scale-100'
              }`}
              style={{
                border: isHovered ? '1px solid rgba(216,180,254,0.22)' : '1px solid rgba(248,250,252,0.06)',
                background: 'var(--surface)',
              }}
              onClick={() => navigate(`/movie/${movie.id}`)}
              role="button"
              tabIndex={0}
              aria-label={`View ${movie.title}`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`/movie/${movie.id}`) }
              }}
            >
              {/* Poster */}
              <div className="relative aspect-[2/3] overflow-hidden bg-white/5">
                {movie.poster_path ? (
                  <img
                    src={tmdbImg(movie.poster_path, 'w342')}
                    alt={movie.title}
                    className={`h-full w-full object-cover transition-transform duration-300 ${isHovered ? 'scale-105' : 'scale-100'}`}
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[0.7rem] text-white/25">
                    No poster
                  </div>
                )}

                {/* Rating badge */}
                {movie.vote_average > 0 && (
                  <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full border border-white/12 bg-black/70 px-1.5 py-0.5 backdrop-blur-sm">
                    <Star className="h-2.5 w-2.5 fill-yellow-400 text-yellow-400" />
                    <span className="text-[0.68rem] font-bold text-white">{movie.vote_average.toFixed(1)}</span>
                  </div>
                )}

                {/* Hover overlay */}
                <div
                  className={`absolute inset-0 flex flex-col justify-end transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'}`}
                  style={{
                    background: 'linear-gradient(to top, rgba(9,6,14,0.98) 0%, rgba(15,10,24,0.82) 40%, rgba(20,14,32,0.3) 70%, transparent 100%)',
                  }}
                >
                  <div className="p-3">
                    {/* Title */}
                    <h3 className="mb-1 line-clamp-2 text-[0.82rem] font-semibold leading-tight text-white">
                      {movie.title}
                    </h3>

                    {/* Meta */}
                    <div className="mb-2 flex items-center gap-1.5 text-[0.68rem] text-white/50">
                      {year && <span>{year}</span>}
                      {year && movieGenres.length > 0 && <span className="text-white/25">·</span>}
                      {movieGenres.map((g, i) => (
                        <span key={g}>{i > 0 ? <span className="text-white/25 mx-0.5">·</span> : null}{g}</span>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5">
                      {user && (
                        <>
                          <ActionBtn
                            onClick={(e) => toggleWatchlist(e, movie)}
                            active={isInWatchlist}
                            activeColor="purple"
                            title={isInWatchlist ? 'In watchlist' : 'Add to watchlist'}
                          >
                            {isInWatchlist ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                          </ActionBtn>
                          <ActionBtn
                            onClick={(e) => toggleWatched(e, movie)}
                            active={isWatched}
                            activeColor="emerald"
                            title={isWatched ? 'Mark unwatched' : 'Mark watched'}
                          >
                            {isWatched ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                          </ActionBtn>
                        </>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/movie/${movie.id}`) }}
                        className="ml-auto flex h-7 items-center gap-0.5 rounded-full border border-white/18 bg-white/8 px-2.5 text-[0.65rem] font-semibold text-white/65 transition-colors hover:bg-white/14 hover:text-white"
                      >
                        Details
                        <ChevronRight className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Title below card (visible at rest) */}
            <div className="mt-2 px-0.5">
              <p className="line-clamp-1 text-[0.78rem] font-medium text-white/75 transition-colors group-hover:text-white">
                {movie.title}
              </p>
              {year && (
                <p className="mt-0.5 text-[0.68rem] text-white/35">{year}</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ActionBtn({ onClick, active, activeColor, title, children }) {
  const colorMap = {
    purple:  { bg: 'rgba(168,85,247,0.85)',  border: 'rgba(216,180,254,0.5)' },
    emerald: { bg: 'rgba(16,185,129,0.85)',  border: 'rgba(110,231,183,0.5)' },
  }
  const colors = colorMap[activeColor] ?? colorMap.purple

  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      className="flex h-7 w-7 items-center justify-center rounded-full border transition-all duration-150 hover:scale-110 active:scale-95"
      style={{
        background: active ? colors.bg : 'rgba(0,0,0,0.55)',
        borderColor: active ? colors.border : 'rgba(248,250,252,0.2)',
        color: 'white',
      }}
    >
      {children}
    </button>
  )
}
