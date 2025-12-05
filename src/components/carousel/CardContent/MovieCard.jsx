// src/components/carousel/CardContent/MovieCard.jsx
import { memo, useState, useEffect, useCallback, useMemo } from 'react'
import { Plus, Check, Eye, EyeOff, ChevronDown, Star } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { tmdbImg } from '@/shared/api/tmdb'
import { supabase } from '@/shared/lib/supabase/client'
import { useUserMovieStatus } from '@/shared/hooks/useUserMovieStatus'
import { Card } from '../Card'

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
}) {
  const navigate = useNavigate()
  const [imageLoaded, setImageLoaded] = useState(false)
  const [user, setUser] = useState(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: u } }) => setUser(u))
  }, [])

  const {
    isInWatchlist,
    isWatched,
    loading: actionLoading,
    toggleWatchlist,
    toggleWatched,
  } = useUserMovieStatus({ user, movie, source: 'quick_picks' })

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
    if (onClick) onClick(movie)
    else navigate(`/movie/${movie.id}`)
  }, [movie, navigate, onClick])

  return (
    <div
      className="w-full h-full cursor-pointer"
      onMouseEnter={() => onHover?.(movie.id)}
      onMouseLeave={onLeave}
      onClick={handleNavigate}
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
                <h3 className="text-sm font-semibold text-white mb-2 line-clamp-1">
                  {movie.title}
                </h3>

                <div className="flex items-center gap-2 text-[11px] text-white/80 mb-2">
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
                  <div className="flex flex-wrap gap-1 text-[11px] text-white/70 mb-2">
                    {movie.genres.slice(0, 3).map((g) => (
                      <span key={g.id || g.name} className="opacity-80">
                        {g.name}
                      </span>
                    ))}
                  </div>
                )}

                {meta.shortDesc && (
                  <p className="text-[11px] text-white/80 line-clamp-2 mb-2">
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
                    className="ml-auto h-9 w-9 rounded-full border border-white/50 bg-black/60 text-white flex items-center justify-center text-xs hover:bg-black/80 transition-colors"
                    title="More details"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {!isExpanded && (
        <div className="mt-2 px-1">
          <p className="text-[11px] text-white/80 line-clamp-1">
            {movie.title}
          </p>
        </div>
      )}
    </div>
  )
})

MovieCard.displayName = 'MovieCard'
