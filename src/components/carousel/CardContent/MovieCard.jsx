// src/components/carousel/CardContent/MovieCard.jsx
import { memo, useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Plus, Check, Eye, EyeOff, ChevronRight, Star } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { tmdbImg } from '@/shared/api/tmdb'
import { useWatchlistContext } from '@/contexts/WatchlistContext'
import { useUserMovieStatus } from '@/shared/hooks/useUserMovieStatus'
import { Card } from '../Card'
import { updateImpression } from '@/shared/services/recommendations'

function ActionBtn({ onClick, active, activeColor, icon: Icon, activeIcon: ActiveIcon, label, loading }) {
  const colors = {
    purple: 'bg-purple-500/90 border-purple-400 text-white',
    emerald: 'bg-emerald-500/90 border-emerald-400 text-white',
  }
  const activeCls = colors[activeColor] || colors.purple

  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onClick?.() }}
      disabled={loading}
      title={label}
      className={`
        h-8 w-8 rounded-full border text-xs flex items-center justify-center
        transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-white/50
        disabled:opacity-50 hover:scale-110 active:scale-95
        ${active ? activeCls : 'bg-black/60 border-white/25 text-white hover:bg-black/85 hover:border-white/40'}
      `}
    >
      {loading ? (
        <div className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : active && ActiveIcon ? (
        <ActiveIcon className="h-3.5 w-3.5" />
      ) : (
        <Icon className="h-3.5 w-3.5" />
      )}
    </button>
  )
}

export const MovieCard = memo(function MovieCard({
  item: movie,
  isExpanded = false,
  onHover,
  onLeave,
  index,
  width,
  height,
  priority = false,
  onClick,
  placement = null,
}) {
  const navigate = useNavigate()
  const [imageLoaded, setImageLoaded] = useState(false)
  const { user, ready } = useWatchlistContext()

  const {
    isInWatchlist,
    isWatched,
    loading: actionLoading,
    toggleWatchlist,
    toggleWatched,
  } = useUserMovieStatus({
    user: ready ? user : null,
    movie: ready ? movie : null,
    source: 'quick_picks',
  })

  const prevWatchlistRef = useRef(isInWatchlist)
  const prevWatchedRef = useRef(isWatched)

  useEffect(() => {
    if (!placement || !user?.id || !movie?.id) return
    if (isInWatchlist && !prevWatchlistRef.current)
      updateImpression(user.id, movie.id, placement, { added_to_watchlist: true })
    if (isWatched && !prevWatchedRef.current)
      updateImpression(user.id, movie.id, placement, { marked_watched: true })
    prevWatchlistRef.current = isInWatchlist
    prevWatchedRef.current = isWatched
  }, [isInWatchlist, isWatched, placement, user?.id, movie?.id])

  const meta = useMemo(() => {
    const rating = movie.vote_average > 0 ? movie.vote_average.toFixed(1) : null
    const year = movie.release_date ? new Date(movie.release_date).getFullYear() : null
    const matchPercent = movie.vote_average > 0 ? Math.round(movie.vote_average * 10) : null
    const shortDesc = movie.tagline || (movie.overview ? movie.overview.split('.')[0] + '.' : null)
    return { rating, year, matchPercent, shortDesc }
  }, [movie])

  const handleNavigate = useCallback(() => {
    if (placement && user?.id && movie?.id)
      updateImpression(user.id, movie.id, placement, { clicked: true, clicked_at: new Date().toISOString() })
    if (onClick) onClick(movie)
    else navigate(`/movie/${movie.tmdb_id ?? movie.id}`)
  }, [movie, navigate, onClick, placement, user?.id])

  return (
    <div
      className="w-full h-full cursor-pointer"
      onMouseEnter={() => onHover?.(movie.id)}
      onMouseLeave={onLeave}
      onClick={handleNavigate}
      data-movie-id={movie.id}
      data-index={index}
      role="button"
      aria-label={`Open ${movie.title}`}
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleNavigate() } }}
    >
      <Card
        item={movie}
        index={index}
        isExpanded={isExpanded}
        onHover={onHover}
        onLeave={onLeave}
        width={width}
        height={height}
        priority={priority}
      >
        {() => isExpanded ? (
          /* ── EXPANDED: Netflix-style backdrop + info panel ── */
          <div className="flex flex-col h-full">

            {/* Backdrop image — cinematic top half */}
            <div
              className="relative flex-none overflow-hidden"
              style={{ height: Math.round(height * 0.52) }}
            >
              <img
                src={
                  movie.backdrop_path
                    ? tmdbImg(movie.backdrop_path, 'w780')
                    : tmdbImg(movie.poster_path, 'w342')
                }
                alt=""
                aria-hidden="true"
                className="w-full h-full object-cover"
                style={{ objectPosition: movie.backdrop_path ? 'center 25%' : 'center top' }}
                loading="eager"
              />
              {/* Gradient into info panel */}
              <div className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-b from-transparent to-neutral-950" />
              {/* FeelFlick purple ambient glow */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ background: 'radial-gradient(ellipse at 10% 100%, rgba(88,28,135,0.35) 0%, transparent 60%)' }}
              />
              {/* Watched badge */}
              {isWatched && (
                <div className="absolute top-2 left-2 flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-purple-500/85 backdrop-blur-sm">
                  <Eye className="h-2.5 w-2.5 text-white" />
                  <span className="text-[9px] text-white font-semibold tracking-wide">Watched</span>
                </div>
              )}
            </div>

            {/* Info panel */}
            <div className="flex-1 bg-neutral-950 px-3 pt-2 pb-3 flex flex-col min-h-0">
              <h3 className="text-[0.88rem] font-bold text-white/95 mb-1 line-clamp-2 leading-tight">
                {movie.title}
              </h3>

              {/* Meta row */}
              <div className="flex items-center gap-1 text-[0.65rem] mb-1.5 flex-wrap">
                {meta.rating && (
                  <span className="inline-flex items-center gap-0.5">
                    <Star className="h-2.5 w-2.5 text-yellow-400 fill-yellow-400" />
                    <span className="text-white/85 font-bold">{meta.rating}</span>
                  </span>
                )}
                {meta.year && (
                  <span className="text-white/40 ml-0.5">· {meta.year}</span>
                )}
                {movie.runtime > 0 && (
                  <span className="text-white/35">
                    · {Math.floor(movie.runtime / 60)}h {movie.runtime % 60}m
                  </span>
                )}
              </div>

              {/* Genre pills */}
              {movie.genres?.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-1.5">
                  {movie.genres.slice(0, 2).map((g) => (
                    <span
                      key={g.id || g.name}
                      className="text-[0.6rem] text-purple-300/85 bg-purple-500/15 border border-purple-500/25 px-1.5 py-0.5 rounded-full font-medium"
                    >
                      {g.name}
                    </span>
                  ))}
                </div>
              )}

              {/* Tagline / description */}
              {meta.shortDesc && (
                <p className="text-[0.67rem] text-white/48 line-clamp-2 leading-relaxed mb-auto pt-0.5">
                  {meta.shortDesc}
                </p>
              )}

              {/* Action row */}
              <div className="flex items-center gap-1.5 pt-2 mt-auto">
                {user && (
                  <>
                    <ActionBtn
                      onClick={toggleWatchlist}
                      active={isInWatchlist}
                      activeIcon={Check}
                      icon={Plus}
                      activeColor="purple"
                      label={isInWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
                      loading={actionLoading.watchlist}
                    />
                    <ActionBtn
                      onClick={toggleWatched}
                      active={isWatched}
                      activeIcon={Eye}
                      icon={EyeOff}
                      activeColor="purple"
                      label={isWatched ? 'Mark Unwatched' : 'Mark Watched'}
                      loading={actionLoading.watched}
                    />
                  </>
                )}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleNavigate() }}
                  className="ml-auto flex items-center gap-0.5 h-7 px-2.5 rounded-full border border-purple-400/25 bg-purple-500/10 text-purple-300 hover:text-white hover:bg-purple-500/22 hover:border-purple-400/40 transition-all text-[0.65rem] font-semibold"
                  title="More details"
                >
                  More <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            </div>

          </div>
        ) : (
          /* ── DEFAULT: poster-only view ── */
          <div className="relative w-full h-full">
            {!imageLoaded && (
              <div className="absolute inset-0 bg-purple-950/20 animate-pulse" />
            )}
            <img
              src={tmdbImg(movie.poster_path, 'w342')}
              alt={movie.title}
              loading={priority ? 'eager' : 'lazy'}
              fetchPriority={priority && index < 3 ? 'high' : undefined}
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={() => setImageLoaded(true)}
            />
            {meta.rating && (
              <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-black/75 backdrop-blur-sm">
                <Star className="h-2.5 w-2.5 text-yellow-400 fill-yellow-400" />
                <span className="text-[10px] font-bold text-white/90 leading-none">{meta.rating}</span>
              </div>
            )}
            {isWatched && (
              <div className="absolute top-2 left-2 flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-purple-500/80 backdrop-blur-sm">
                <Eye className="h-2.5 w-2.5 text-white" />
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Info below card when not expanded */}
      {!isExpanded && (
        <div className="mt-2 px-0.5">
          <p className="text-[0.78rem] font-semibold text-white/90 line-clamp-1 leading-snug">
            {movie.title}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            {meta.year && (
              <span className="text-[0.65rem] text-white/38 leading-none">{meta.year}</span>
            )}
            {meta.rating && (
              <>
                {meta.year && <span className="text-white/18 text-[0.6rem]">·</span>}
                <span className="inline-flex items-center gap-0.5">
                  <Star className="h-2.5 w-2.5 text-yellow-400 fill-yellow-400" />
                  <span className="text-[0.65rem] text-white/55 font-medium leading-none">{meta.rating}</span>
                </span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
})

MovieCard.displayName = 'MovieCard'
