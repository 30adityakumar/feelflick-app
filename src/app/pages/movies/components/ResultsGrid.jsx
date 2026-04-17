// src/app/pages/movies/components/ResultsGrid.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/shared/lib/supabase/client'
import { Plus, Check, Eye, EyeOff, Star, ChevronRight } from 'lucide-react'
import { tmdbImg } from '@/shared/api/tmdb'

// Mood tag derived from pacing + intensity scores (Supabase movies only)
function getMoodTag(movie) {
  const { pacing_score, intensity_score, emotional_depth_score, cult_status_score, discovery_potential } = movie
  if (cult_status_score >= 60) return { label: 'Cult classic', color: 'rgba(167,139,250,0.9)' }
  if (discovery_potential >= 70) return { label: 'Hidden gem', color: 'rgba(52,211,153,0.9)' }
  if (intensity_score >= 8) return { label: 'Intense', color: 'rgba(248,113,113,0.9)' }
  if (pacing_score <= 3 && emotional_depth_score >= 7) return { label: 'Slow burn', color: 'rgba(147,197,253,0.9)' }
  if (pacing_score >= 8) return { label: 'Fast-paced', color: 'rgba(251,191,36,0.9)' }
  if (emotional_depth_score >= 8) return { label: 'Thought-provoking', color: 'rgba(196,181,253,0.9)' }
  return null
}

export default function ResultsGrid({ movies, user, isSearchMode = false }) {
  const [watchlistIds, setWatchlistIds] = useState(new Set())
  const [watchedIds, setWatchedIds]     = useState(new Set())
  const [hoveredId, setHoveredId]       = useState(null)
  const navigate = useNavigate()

  // Sync watchlist/watched status — keyed by tmdb_id for both TMDB and Supabase results
  useEffect(() => {
    let active = true
    async function syncStatus() {
      if (!user?.id || !movies.length) return

      // tmdb_id is `movie.tmdb_id` for Supabase results, `movie.id` for TMDB results
      const tmdbIds = movies.map((m) => m.tmdb_id ?? m.id).filter(Boolean)

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

      const idToTmdb = Object.fromEntries(Object.entries(tmdbToId).map(([k, v]) => [v, Number(k)]))
      setWatchlistIds(new Set(wl?.map((r) => idToTmdb[r.movie_id]).filter(Boolean) ?? []))
      setWatchedIds(new Set(wh?.map((r) => idToTmdb[r.movie_id]).filter(Boolean) ?? []))
    }
    syncStatus()
    return () => { active = false }
  }, [user, movies])

  async function ensureMovieInDb(movie) {
    const tmdbId = movie.tmdb_id ?? movie.id
    const { data } = await supabase
      .from('movies')
      .upsert({
        tmdb_id: tmdbId, title: movie.title, original_title: movie.original_title,
        overview: movie.overview, poster_path: movie.poster_path, backdrop_path: movie.backdrop_path,
        release_date: movie.release_date || null, vote_average: movie.vote_average,
        vote_count: movie.vote_count, popularity: movie.popularity,
        original_language: movie.original_language,
      }, { onConflict: 'tmdb_id' })
      .select('id').single()
    return data?.id
  }

  const toggleWatchlist = async (e, movie) => {
    e.stopPropagation()
    if (!user) return navigate('/auth')
    const tmdbId = movie.tmdb_id ?? movie.id
    const isIn = watchlistIds.has(tmdbId)
    setWatchlistIds((prev) => { const s = new Set(prev); isIn ? s.delete(tmdbId) : s.add(tmdbId); return s })
    if (!isIn) setWatchedIds((prev) => { const s = new Set(prev); s.delete(tmdbId); return s })
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
    const tmdbId = movie.tmdb_id ?? movie.id
    const isWatched = watchedIds.has(tmdbId)
    setWatchedIds((prev) => { const s = new Set(prev); isWatched ? s.delete(tmdbId) : s.add(tmdbId); return s })
    if (!isWatched) setWatchlistIds((prev) => { const s = new Set(prev); s.delete(tmdbId); return s })
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
        const tmdbId       = movie.tmdb_id ?? movie.id
        const isInWatchlist = watchlistIds.has(tmdbId)
        const isWatched     = watchedIds.has(tmdbId)
        const isHovered     = hoveredId === tmdbId
        const year          = movie.release_year ?? (movie.release_date ? new Date(movie.release_date).getFullYear() : null)

        // Rating: prefer ff_final_rating (Supabase), fall back to vote_average (TMDB)
        const rating = movie.ff_final_rating != null
          ? Number(movie.ff_final_rating).toFixed(1)
          : movie.vote_average > 0 ? movie.vote_average.toFixed(1) : null

        // Mood tag: only available on Supabase results
        const moodTag = !isSearchMode ? getMoodTag(movie) : null

        // Genre display: Supabase `primary_genre` or TMDB genre_ids (no map needed for primary)
        const genreLabel = movie.primary_genre || null

        const detailPath = `/movie/${tmdbId}`

        return (
          <div
            key={tmdbId}
            className="group relative"
            onMouseEnter={() => setHoveredId(tmdbId)}
            onMouseLeave={() => setHoveredId(null)}
          >
            <div
              className={`relative cursor-pointer overflow-hidden rounded-xl transition-all duration-200 ${
                isHovered ? 'z-20 scale-[1.03] shadow-[0_8px_32px_rgba(0,0,0,0.7)]' : 'scale-100'
              }`}
              style={{
                border: isHovered
                  ? '1px solid rgba(216,180,254,0.22)'
                  : '1px solid rgba(248,250,252,0.06)',
                background: 'var(--color-surface, #120d1c)',
              }}
              onClick={() => navigate(detailPath)}
              role="button"
              tabIndex={0}
              aria-label={`View ${movie.title}`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(detailPath) }
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
                  <div className="flex h-full w-full items-center justify-center text-[0.7rem]"
                    style={{ color: 'rgba(248,250,252,0.2)' }}>
                    No poster
                  </div>
                )}

                {/* Rating badge */}
                {rating && (
                  <div
                    className="absolute right-2 top-2 flex items-center gap-1 rounded-full px-1.5 py-0.5 backdrop-blur-sm"
                    style={{
                      background: 'rgba(0,0,0,0.72)',
                      border: '1px solid rgba(248,250,252,0.12)',
                    }}
                  >
                    <Star className="h-2.5 w-2.5 fill-yellow-400 text-yellow-400" />
                    <span className="text-[0.68rem] font-bold text-white">{rating}</span>
                    {movie.ff_final_rating != null && (
                      <span className="text-[0.58rem] font-normal" style={{ color: 'rgba(192,132,252,0.8)' }}>FF</span>
                    )}
                  </div>
                )}

                {/* Mood tag — top-left, only in browse mode */}
                {moodTag && !isHovered && (
                  <div
                    className="absolute left-2 top-2 rounded-full px-2 py-0.5 text-[0.6rem] font-semibold"
                    style={{
                      background: 'rgba(0,0,0,0.72)',
                      border: `1px solid ${moodTag.color}30`,
                      color: moodTag.color,
                      backdropFilter: 'blur(6px)',
                    }}
                  >
                    {moodTag.label}
                  </div>
                )}

                {/* Hover overlay */}
                <div
                  className={`absolute inset-0 flex flex-col justify-end transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'}`}
                  style={{
                    background: 'linear-gradient(to top, rgba(9,6,14,0.98) 0%, rgba(15,10,24,0.82) 40%, rgba(20,14,32,0.28) 70%, transparent 100%)',
                  }}
                >
                  <div className="p-3">
                    <h3 className="mb-1 line-clamp-2 text-[0.82rem] font-semibold leading-tight text-white">
                      {movie.title}
                    </h3>

                    <div className="mb-2 flex flex-wrap items-center gap-1 text-[0.67rem]"
                      style={{ color: 'rgba(248,250,252,0.5)' }}>
                      {year && <span>{year}</span>}
                      {year && genreLabel && <span style={{ color: 'rgba(248,250,252,0.25)' }}>·</span>}
                      {genreLabel && <span>{genreLabel}</span>}
                      {moodTag && (
                        <>
                          <span style={{ color: 'rgba(248,250,252,0.25)' }}>·</span>
                          <span style={{ color: moodTag.color }}>{moodTag.label}</span>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {user && (
                        <>
                          <ActionBtn
                            onClick={(e) => toggleWatchlist(e, movie)}
                            active={isInWatchlist}
                            activeStyle={{ background: 'rgba(168,85,247,0.85)', borderColor: 'rgba(216,180,254,0.5)' }}
                            title={isInWatchlist ? 'In watchlist' : 'Add to watchlist'}
                          >
                            {isInWatchlist ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                          </ActionBtn>
                          <ActionBtn
                            onClick={(e) => toggleWatched(e, movie)}
                            active={isWatched}
                            activeStyle={{ background: 'rgba(16,185,129,0.85)', borderColor: 'rgba(110,231,183,0.5)' }}
                            title={isWatched ? 'Mark unwatched' : 'Mark watched'}
                          >
                            {isWatched ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                          </ActionBtn>
                        </>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(detailPath) }}
                        className="ml-auto flex h-7 items-center gap-0.5 rounded-full px-2.5 text-[0.65rem] font-semibold transition-colors"
                        style={{
                          border: '1px solid rgba(248,250,252,0.18)',
                          background: 'rgba(255,255,255,0.08)',
                          color: 'rgba(248,250,252,0.65)',
                        }}
                      >
                        Details
                        <ChevronRight className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Title + year below card */}
            <div className="mt-2 px-0.5">
              <p className="line-clamp-1 text-[0.78rem] font-medium transition-colors"
                style={{ color: isHovered ? 'rgba(248,250,252,1)' : 'rgba(248,250,252,0.72)' }}>
                {movie.title}
              </p>
              {movie.director_name && (
                <p className="text-xs text-white/35 truncate mt-0.5 leading-tight">
                  {movie.director_name}
                </p>
              )}
              {year && (
                <p className="mt-0.5 text-[0.68rem]" style={{ color: 'rgba(248,250,252,0.32)' }}>
                  {year}
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ActionBtn({ onClick, active, activeStyle, title, children }) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      className="flex h-7 w-7 items-center justify-center rounded-full border text-white transition-all duration-150 hover:scale-110 active:scale-95"
      style={
        active
          ? activeStyle
          : { background: 'rgba(0,0,0,0.55)', borderColor: 'rgba(248,250,252,0.2)' }
      }
    >
      {children}
    </button>
  )
}
