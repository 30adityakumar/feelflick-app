import { memo, useCallback, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Eye, EyeOff, Plus } from 'lucide-react'
import { tmdbImg, posterSrcSet } from '@/shared/api/tmdb'
import { useWatchlistContext } from '@/app/providers/WatchlistContext'
import { useUserMovieStatus } from '@/shared/hooks/useUserMovieStatus'
import { updateImpression } from '@/shared/services/recommendations'
import { track } from '@/shared/services/analytics'
import MovieCardRating from '@/shared/components/MovieCardRating'
import { Card } from '../Card'

export const MovieCard = memo(function MovieCard({
  item: movie,
  hovered = false,
  index,
  width,
  height,
  priority = false,
  onClick,
  placement = null,
  rowTitle = null,
  reducedMotion = false,
  onCardEnter,
  onCardLeave,
  onCardFocus,
  onCardBlur,
}) {
  const navigate = useNavigate()
  const triggerRef = useRef(null)
  const [posterLoaded, setPosterLoaded] = useState(false)
  const { user, ready } = useWatchlistContext()
  const tmdbId = movie.tmdb_id ?? movie.id

  const {
    isInWatchlist,
    isWatched,
    loading: actionLoading,
    toggleWatchlist,
    toggleWatched,
  } = useUserMovieStatus({
    user: ready ? user : null,
    movie: ready ? movie : null,
    source: placement === 'mood' ? 'mood_recommendation' : 'carousel_row',
  })

  const meta = useMemo(() => {
    const hasAudience = movie.ff_audience_rating != null && (movie.ff_audience_confidence ?? 0) >= 50
    const hasCritic = movie.ff_critic_rating != null && (movie.ff_critic_confidence ?? 0) >= 50
    const rating = hasAudience ? movie.ff_audience_rating
      : hasCritic ? movie.ff_critic_rating
      : null
    const year = movie.release_date ? new Date(movie.release_date).getFullYear() : null
    return { rating, year }
  }, [movie])

  const handleNavigate = useCallback(() => {
    if (placement && user?.id && movie?.id) {
      updateImpression(user.id, movie.id, 'clicked').catch(() => {})
    }
    track('card_clicked', {
      movie_id: tmdbId,
      movie_title: movie?.title,
      row_title: rowTitle,
      index,
    })

    if (onClick) onClick(movie)
    else navigate(`/movie/${tmdbId}`)
  }, [index, movie, navigate, onClick, placement, rowTitle, tmdbId, user?.id])

  const handleToggleWatchlist = useCallback(() => {
    if (!isInWatchlist) {
      track('card_watchlisted', {
        movie_id: tmdbId,
        movie_title: movie?.title,
        row_title: rowTitle,
      })
    }
    toggleWatchlist()
  }, [isInWatchlist, movie?.title, rowTitle, tmdbId, toggleWatchlist])

  const handleRootBlur = useCallback(
    (event) => {
      if (triggerRef.current?.contains(event.relatedTarget)) return
      onCardBlur?.(event.relatedTarget)
    },
    [onCardBlur]
  )

  const handleKeyDown = useCallback(
    (event) => {
      if (event.target !== event.currentTarget) return
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        handleNavigate()
      }
    },
    [handleNavigate]
  )

  return (
    <div
      ref={triggerRef}
      role="button"
      tabIndex={0}
      aria-label={`Open ${movie.title}`}
      data-movie-id={movie.id}
      data-index={index}
      data-hovered={hovered ? 'true' : 'false'}
      className="relative block cursor-pointer outline-none"
      style={{ width }}
      onMouseEnter={() => onCardEnter?.(movie, triggerRef.current)}
      onMouseLeave={(event) => onCardLeave?.(event.relatedTarget)}
      onFocus={() => onCardFocus?.(movie, triggerRef.current)}
      onBlur={handleRootBlur}
      onClick={handleNavigate}
      onKeyDown={handleKeyDown}
    >
      <Card hovered={hovered} width={width} height={height} reducedMotion={reducedMotion}>
        {!posterLoaded ? <div className="skeleton absolute inset-0" aria-hidden="true" /> : null}
        <img
          src={tmdbImg(movie.poster_path, 'w342')}
          srcSet={posterSrcSet(movie.poster_path, ['w342', 'w500'])}
          sizes="(max-width: 640px) 144px, 200px"
          alt={movie.title}
          width={342}
          height={513}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority && index < 3 ? 'high' : undefined}
          className="h-full w-full object-cover"
          style={{
            opacity: posterLoaded ? 1 : 0,
            transform: `scale(${hovered && !reducedMotion ? 1.025 : 1})`,
            transition: reducedMotion
              ? 'opacity 100ms linear'
              : 'opacity 180ms ease, transform 180ms cubic-bezier(0.22, 1, 0.36, 1)',
          }}
          onLoad={() => setPosterLoaded(true)}
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: 'linear-gradient(to bottom, transparent 58%, rgba(15,16,16,0.28) 100%)' }}
        />
        {movie._seen ? (
          <div
            className="absolute left-2 top-2 z-10 rounded-md px-2 py-0.5 text-[0.65rem] font-semibold backdrop-blur-sm"
            style={{
              background: 'color-mix(in srgb, var(--color-surface-raised, #2e3135) 84%, transparent)',
              color: 'var(--color-text-primary, #f5f2eb)',
              border: '1px solid var(--color-border-subtle, #3a3d41)',
              fontFamily: 'var(--font-body)',
            }}
          >
            ✓ Seen
          </div>
        ) : null}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-24"
          style={{
            background: 'linear-gradient(to top, rgba(15,16,16,0.92) 0%, rgba(15,16,16,0.36) 52%, transparent 100%)',
            opacity: hovered ? 1 : 0,
            transition: reducedMotion ? undefined : 'opacity 180ms ease',
          }}
        />
        {meta.rating != null ? (
          <div className="absolute right-3 top-3">
            <MovieCardRating movie={movie} showGenreBadge size="sm" />
          </div>
        ) : null}
        {user ? (
          <div
            className={`absolute inset-x-0 bottom-0 z-10 flex items-center justify-center gap-2 pb-3 ${hovered ? '' : 'pointer-events-none'}`}
            style={{
              opacity: hovered ? 1 : 0,
              transition: reducedMotion ? undefined : 'opacity 180ms ease',
            }}
          >
            <button
              type="button"
              aria-label={isInWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}
              onClick={(e) => { e.stopPropagation(); handleToggleWatchlist() }}
              disabled={actionLoading.watchlist}
              className="rounded-full border border-[var(--color-border-subtle,#3a3d41)] bg-[var(--color-surface-raised,#2e3135)]/90 p-2 text-[var(--color-text-primary,#f5f2eb)] transition-colors hover:border-[var(--color-border-strong,#747a82)] hover:bg-[var(--color-surface-2,#222427)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus,#f5f2eb)]"
            >
              {actionLoading.watchlist ? (
                <span className="skeleton h-4 w-4 rounded-full" aria-hidden="true" />
              ) : isInWatchlist ? (
                <Check className="h-4 w-4" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
            </button>
            <button
              type="button"
              aria-label={isWatched ? 'Mark unwatched' : 'Mark watched'}
              onClick={(e) => { e.stopPropagation(); toggleWatched() }}
              disabled={actionLoading.watched}
              className="rounded-full border border-[var(--color-border-subtle,#3a3d41)] bg-[var(--color-surface-raised,#2e3135)]/90 p-2 text-[var(--color-text-primary,#f5f2eb)] transition-colors hover:border-[var(--color-border-strong,#747a82)] hover:bg-[var(--color-surface-2,#222427)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus,#f5f2eb)]"
            >
              {actionLoading.watched ? (
                <span className="skeleton h-4 w-4 rounded-full" aria-hidden="true" />
              ) : isWatched ? (
                <Eye className="h-4 w-4" />
              ) : (
                <EyeOff className="h-4 w-4" />
              )}
            </button>
          </div>
        ) : null}
      </Card>

      <div className="pointer-events-none mt-3 overflow-hidden px-0.5">
        <p className="line-clamp-1 text-[0.92rem] font-semibold leading-tight text-[var(--color-text-primary,#f5f2eb)]">
          {movie.title}
        </p>
        <div className="mt-1 flex items-center gap-1.5 text-[0.82rem] text-[var(--color-text-muted,#a5a198)]">
          {meta.year ? <span>{meta.year}</span> : null}
          {meta.year && meta.rating != null ? <span>•</span> : null}
          {meta.rating != null ? (
            <span className="inline-flex items-center gap-1 font-semibold text-amber-300">
              {meta.rating}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  )
})

MovieCard.displayName = 'MovieCard'
