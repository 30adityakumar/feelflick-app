// src/components/carousel/CardContent/MovieCard.jsx
import { memo, useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Plus, Check, Eye, EyeOff, ChevronDown, Star } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { tmdbImg } from '@/shared/api/tmdb'
import { useWatchlistContext } from '@/contexts/WatchlistContext'
import { Card } from '../Card'
import { updateImpression } from '@/shared/services/recommendations'

function ActionBtn({
  onClick,
  active,
  activeColor,
  icon: Icon,
  activeIcon: ActiveIcon,
  label,
  loading,
}) {
  const colors = {
    purple: 'bg-purple-500 border-purple-400 text-white',
    emerald: 'bg-emerald-500 border-emerald-400 text-white',
  }
  const activeCls = colors[activeColor] || colors.purple

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onClick?.()
      }}
      disabled={loading}
      title={label}
      className={`h-9 w-9 rounded-full border text-xs flex items-center justify-center
        transition-transform duration-150 focus:outline-none focus:ring-2 focus:ring-white
        disabled:opacity-50 hover:scale-110 active:scale-95
        ${
          active
            ? activeCls
            : 'bg-black/70 border-white/40 text-white hover:bg-black/90'
        }
      `}
    >
      {loading ? (
        <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : active && ActiveIcon ? (
        <ActiveIcon className="h-4 w-4" />
      ) : (
        <Icon className="h-4 w-4" />
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
  onClick, // optional override from parent
  placement = null, // 'hero', 'quick_picks', 'hidden_gems', etc.
}) {  const navigate = useNavigate()
  const [imageLoaded, setImageLoaded] = useState(false)
  const { user, ready, makeStatusHelpers } = useWatchlistContext()

  // When context not ready yet, avoid accessing hook
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

  // Track watchlist/watched changes for impression learning
  const prevWatchlistRef = useRef(isInWatchlist)
  const prevWatchedRef = useRef(isWatched)

  useEffect(() => {
    if (!placement || !user?.id || !movie?.id) return

    // Detect watchlist addition
    if (isInWatchlist && !prevWatchlistRef.current) {
      updateImpression(user.id, movie.id, placement, {
        added_to_watchlist: true
      })
    }

    // Detect marked as watched
    if (isWatched && !prevWatchedRef.current) {
      updateImpression(user.id, movie.id, placement, {
        marked_watched: true
      })
    }

    prevWatchlistRef.current = isInWatchlist
    prevWatchedRef.current = isWatched
  }, [isInWatchlist, isWatched, placement, user?.id, movie?.id])

  const meta = useMemo(() => {
    const rating =
      movie.vote_average && movie.vote_average > 0
        ? movie.vote_average.toFixed(1)
        : null
    const year = movie.release_date
      ? new Date(movie.release_date).getFullYear()
      : null
    const matchPercent =
      movie.vote_average && movie.vote_average > 0
        ? Math.round(movie.vote_average * 10)
        : null
    const shortDesc = movie.tagline
      ? movie.tagline
      : movie.overview
      ? movie.overview.split('.')[0] + '.'
      : null
    return { rating, year, matchPercent, shortDesc }
  }, [movie])

  const handleNavigate = useCallback(() => {
    // Track click for impression learning
    if (placement && user?.id && movie?.id) {
      updateImpression(user.id, movie.id, placement, {
        clicked: true,
        clicked_at: new Date().toISOString()
      })
    }
    
    if (onClick) onClick(movie)
    else {
      // Movies from our DB have tmdb_id, movies from TMDB API use id as tmdb_id
      const tmdbId = movie.tmdb_id ?? movie.id
      navigate(`/movie/${tmdbId}`)
    }
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
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleNavigate()
        }
      }}
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
            {/* Poster */}
            <img
              src={tmdbImg(movie.poster_path, 'w500')}
              alt={movie.title}
              loading={priority ? 'eager' : 'lazy'}
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={() => setImageLoaded(true)}
            />
            {!imageLoaded && (
              <div className="absolute inset-0 bg-neutral-800 animate-pulse" />
            )}

            {/* Rating badge */}
            {meta.rating && (
              <div className="absolute top-2 right-2 bg-black/80 px-2 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1">
                <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                <span>{meta.rating}</span>
              </div>
            )}

            {/* Expanded overlay */}
            {isExpanded && (
              <div className="absolute inset-x-0 bottom-0 pt-7 pb-3 px-3 bg-gradient-to-t from-black/90 via-black/70 to-transparent">
                <h3 className="text-[0.95rem] font-semibold text-white mb-1.5 line-clamp-1">
                  {movie.title}
                </h3>

                <div className="flex items-center gap-2 text-[0.68rem] text-white/80 mb-1.5">
                  {meta.matchPercent && (
                    <span className="text-emerald-400 font-semibold">
                      {meta.matchPercent}% Match
                    </span>
                  )}
                  {meta.year && <span>{meta.year}</span>}
                  {movie.runtime ? (
                    <span>
                      • {Math.floor(movie.runtime / 60)}h {movie.runtime % 60}m
                    </span>
                  ) : null}
                </div>

                {movie.genres?.length > 0 && (
                  <div className="flex flex-wrap gap-1 text-[0.7rem] text-white/70 mb-1.5">
                    {movie.genres.slice(0, 3).map((g) => (
                      <span key={g.id || g.name} className="opacity-80">
                        {g.name}
                      </span>
                    ))}
                  </div>
                )}

                {meta.shortDesc && (
                  <p className="text-[0.7rem] text-white/80 line-clamp-2 mb-2">
                    {meta.shortDesc}
                  </p>
                )}

                <div className="flex items-center gap-2 mt-1">
                  {user && (
                    <>
                      <ActionBtn
                        onClick={toggleWatchlist}
                        active={isInWatchlist}
                        activeIcon={Check}
                        icon={Plus}
                        activeColor="purple"
                        label={
                          isInWatchlist
                            ? 'Remove from Watchlist'
                            : 'Add to Watchlist'
                        }
                        loading={actionLoading.watchlist}
                      />
                      <ActionBtn
                        onClick={toggleWatched}
                        active={isWatched}
                        activeIcon={Eye}
                        icon={EyeOff}
                        activeColor="emerald"
                        label={
                          isWatched ? 'Mark Unwatched' : 'Mark as Watched'
                        }
                        loading={actionLoading.watched}
                      />
                    </>
                  )}

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleNavigate()
                    }}
                    className="ml-auto h-8 w-8 rounded-full border border-white/50 bg-black/60 text-white flex items-center justify-center text-xs hover:bg-black/80 transition-colors"
                    title="More details"
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {!isExpanded && (
        <div className="mt-2 px-1">
          <p className="text-[0.7rem] text-white/80 line-clamp-1">
            {movie.title}
          </p>
        </div>
      )}
    </div>
  )
})

MovieCard.displayName = 'MovieCard'
