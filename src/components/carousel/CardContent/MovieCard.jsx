// src/components/carousel/CardContent/MovieCard.jsx
import { memo, useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Plus, Check, Eye, EyeOff, ChevronRight, Star } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { tmdbImg } from '@/shared/api/tmdb'
import { useWatchlistContext } from '@/contexts/WatchlistContext'
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
  const { user, ready, makeStatusHelpers } = useWatchlistContext()

  const {
    isInWatchlist,
    isWatched,
    loading: actionLoading,
    toggleWatchlist,
    toggleWatched,
  } = ready ? makeStatusHelpers(movie) : {
    isInWatchlist: false,
    isWatched: false,
    loading: { watchlist: false, watched: false },
    toggleWatchlist: () => {},
    toggleWatched: () => {},
  }

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
        {() => (
          <div className="relative w-full h-full">
            {/* Skeleton */}
            {!imageLoaded && (
              <div className="absolute inset-0 bg-neutral-900 animate-pulse" />
            )}

            {/* Poster — w342 covers all display sizes (max 260px × 2x = 520px) */}
            <img
              src={tmdbImg(movie.poster_path, 'w342')}
              alt={movie.title}
              loading={priority ? 'eager' : 'lazy'}
              fetchpriority={priority && index < 3 ? 'high' : undefined}
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={() => setImageLoaded(true)}
            />

            {/* Rating badge — top right, small */}
            {meta.rating && !isExpanded && (
              <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-black/75 backdrop-blur-sm">
                <Star className="h-2.5 w-2.5 text-yellow-400 fill-yellow-400" />
                <span className="text-[10px] font-bold text-white/90 leading-none">{meta.rating}</span>
              </div>
            )}

            {/* Watched badge */}
            {isWatched && !isExpanded && (
              <div className="absolute top-2 left-2 flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-500/80 backdrop-blur-sm">
                <Eye className="h-2.5 w-2.5 text-white" />
              </div>
            )}

            {/* Expanded overlay */}
            {isExpanded && (
              <div className="absolute inset-x-0 bottom-0 pt-10 pb-3 px-3 bg-gradient-to-t from-black via-black/85 to-transparent">
                <h3 className="text-[0.9rem] font-bold text-white mb-1.5 line-clamp-1 leading-tight">
                  {movie.title}
                </h3>

                <div className="flex items-center gap-1.5 text-[0.68rem] mb-1.5">
                  {meta.matchPercent && (
                    <span className="text-emerald-400 font-bold">{meta.matchPercent}%</span>
                  )}
                  {meta.year && <span className="text-white/60">{meta.year}</span>}
                  {movie.runtime > 0 && (
                    <span className="text-white/50">
                      · {Math.floor(movie.runtime / 60)}h {movie.runtime % 60}m
                    </span>
                  )}
                </div>

                {movie.genres?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {movie.genres.slice(0, 3).map((g) => (
                      <span
                        key={g.id || g.name}
                        className="text-[0.62rem] text-white/55 bg-white/8 px-1.5 py-0.5 rounded-full"
                      >
                        {g.name}
                      </span>
                    ))}
                  </div>
                )}

                {meta.shortDesc && (
                  <p className="text-[0.68rem] text-white/65 line-clamp-2 mb-2.5 leading-relaxed">
                    {meta.shortDesc}
                  </p>
                )}

                <div className="flex items-center gap-1.5">
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
                        activeColor="emerald"
                        label={isWatched ? 'Mark Unwatched' : 'Mark Watched'}
                        loading={actionLoading.watched}
                      />
                    </>
                  )}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleNavigate() }}
                    className="ml-auto flex items-center gap-0.5 h-7 px-2 rounded-full border border-white/20 bg-black/50 text-white/70 hover:text-white hover:bg-black/75 hover:border-white/35 transition-all text-[0.65rem] font-semibold"
                    title="More details"
                  >
                    More <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Title below card when not expanded */}
      {!isExpanded && (
        <div className="mt-1.5 px-0.5">
          <p className="text-[0.75rem] font-medium text-white/80 line-clamp-1 leading-snug">
            {movie.title}
          </p>
          {meta.year && (
            <p className="text-[0.65rem] text-white/35 leading-none mt-0.5">{meta.year}</p>
          )}
        </div>
      )}
    </div>
  )
})

MovieCard.displayName = 'MovieCard'
