import { memo, useCallback, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, ChevronRight, Eye, EyeOff, Plus, Star } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { tmdbImg } from '@/shared/api/tmdb'
import { useWatchlistContext } from '@/contexts/WatchlistContext'
import { useUserMovieStatus } from '@/shared/hooks/useUserMovieStatus'
import { updateImpression } from '@/shared/services/recommendations'
import { WatchProviders } from '../WatchProviders'
import { Card } from '../Card'

function ActionButton({
  label,
  onClick,
  icon: Icon,
  activeIcon: ActiveIcon,
  active = false,
  loading = false,
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={(event) => {
        event.stopPropagation()
        onClick?.()
      }}
      disabled={loading}
      className="inline-flex h-8 w-8 items-center justify-center rounded-full border text-white transition-all duration-200"
      style={{
        backdropFilter: 'var(--blur-md)',
        borderColor: active ? 'rgba(244, 208, 255, 0.54)' : 'rgba(248, 250, 252, 0.26)',
        background: active
          ? 'linear-gradient(135deg, rgba(192, 89, 255, 0.95) 0%, rgba(236, 72, 153, 0.9) 100%)'
          : 'linear-gradient(180deg, rgba(38, 24, 56, 0.82) 0%, rgba(14, 10, 21, 0.96) 100%)',
        boxShadow: active
          ? 'inset 0 1px 0 rgba(255,255,255,0.12)'
          : 'inset 0 1px 0 rgba(255,255,255,0.06)',
      }}
    >
      {loading ? (
        <span className="skeleton h-4 w-4 rounded-full" aria-hidden="true" />
      ) : active && ActiveIcon ? (
        <ActiveIcon className="h-4 w-4" />
      ) : (
        <Icon className="h-4 w-4" />
      )}
    </button>
  )
}

function getGenres(movie) {
  if (!Array.isArray(movie?.genres)) return []
  return movie.genres
    .map((genre) => (typeof genre === 'string' ? genre : genre?.name))
    .filter(Boolean)
}

function buildFallbackDescription(movie, year) {
  const genres = getGenres(movie).slice(0, 3)
  return [genres.join(' · '), year].filter(Boolean).join(' · ')
}

function MetaDot() {
  return <span style={{ color: 'rgba(248, 250, 252, 0.16)' }}>•</span>
}

export const MovieCard = memo(function MovieCard({
  item: movie,
  hoverPhase = 'rest',
  isExpanded = false,
  index,
  width,
  height,
  expandedWidth = width,
  expandedHeight,
  priority = false,
  onClick,
  placement = null,
  reducedMotion = false,
  dimmed = false,
  siblingOffset = 0,
  canHover = true,
  expandAlign = 'center',
  onCardEnter,
  onCardLeave,
  onCardFocus,
  onCardBlur,
}) {
  const navigate = useNavigate()
  const triggerRef = useRef(null)
  const [posterLoaded, setPosterLoaded] = useState(false)
  const [backdropLoaded, setBackdropLoaded] = useState(false)
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
    const rawRating = movie.ff_final_rating ?? movie.ff_rating ?? (movie.vote_average > 0 ? movie.vote_average : null)
    const rating = rawRating != null ? Number(rawRating).toFixed(1) : null
    const year = movie.release_date ? new Date(movie.release_date).getFullYear() : null
    const runtime =
      movie.runtime > 0
        ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m`
        : null
    const overview =
      movie.overview?.trim() ||
      movie.tagline?.trim() ||
      buildFallbackDescription(movie, year)
    const backdrop = movie.backdrop_path
      ? tmdbImg(movie.backdrop_path, 'w780')
      : tmdbImg(movie.poster_path, 'w500')

    return {
      rating,
      year,
      runtime,
      genres: getGenres(movie),
      overview,
      backdrop,
      eyebrow: movie._pickReason?.label || null,
    }
  }, [movie])

  const contentTransition = reducedMotion
    ? { duration: 0.1, ease: 'linear' }
    : { duration: 0.22, ease: [0.22, 1, 0.36, 1] }

  const shellTransition = reducedMotion
    ? { duration: 0.1, ease: 'linear' }
    : { duration: 0.28, ease: [0.22, 1, 0.36, 1] }

  const handleNavigate = useCallback(() => {
    if (placement && user?.id && movie?.id) {
      updateImpression(user.id, movie.id, placement, {
        clicked: true,
        clicked_at: new Date().toISOString(),
      })
    }

    if (onClick) onClick(movie)
    else navigate(`/movie/${tmdbId}`)
  }, [movie, navigate, onClick, placement, tmdbId, user?.id])

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

  const collapsedTitleHidden = isExpanded
  const heroHeight = Math.max(172, Math.round(expandedHeight * 0.45))
  const collapsedImageScale = hoverPhase === 'peek' ? 1.04 : 1
  const collapsedImageFilter =
    hoverPhase === 'peek' ? 'saturate(1.1) contrast(1.04) brightness(1.02)' : 'saturate(0.96)'

  return (
    <div
      ref={triggerRef}
      role="button"
      tabIndex={0}
      aria-label={`Open ${movie.title}`}
      aria-expanded={isExpanded}
      data-movie-id={movie.id}
      data-index={index}
      data-phase={hoverPhase}
      data-expanded={isExpanded ? 'true' : 'false'}
      className="relative block cursor-pointer outline-none"
      style={{ width }}
      onMouseEnter={() => {
        if (canHover) onCardEnter?.(movie, triggerRef.current)
      }}
      onMouseLeave={(event) => onCardLeave?.(event.relatedTarget)}
      onFocus={() => onCardFocus?.(movie, triggerRef.current)}
      onBlur={handleRootBlur}
      onClick={handleNavigate}
      onKeyDown={handleKeyDown}
    >
      <Card
        hoverPhase={hoverPhase}
        width={width}
        height={height}
        expandedWidth={expandedWidth}
        expandedHeight={expandedHeight}
        dimmed={dimmed}
        siblingOffset={siblingOffset}
        reducedMotion={reducedMotion}
        expandAlign={expandAlign}
      >
        <AnimatePresence initial={false}>
          {isExpanded ? (
            <motion.div
              key="expanded"
              initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.985 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.985 }}
              transition={shellTransition}
              className="relative flex h-full w-full flex-col overflow-hidden"
              style={{
                background:
                  'linear-gradient(180deg, rgba(12, 8, 18, 0.98) 0%, rgba(20, 11, 30, 0.99) 54%, rgba(9, 6, 14, 1) 100%)',
              }}
            >
              <div className="relative overflow-hidden" style={{ height: heroHeight }}>
                {!backdropLoaded ? <div className="skeleton absolute inset-0" aria-hidden="true" /> : null}
                <img
                  src={meta.backdrop}
                  alt=""
                  aria-hidden="true"
                  loading="eager"
                  className="h-full w-full object-cover"
                  style={{
                    opacity: backdropLoaded ? 1 : 0,
                    objectPosition: 'center 28%',
                    transition: reducedMotion ? 'opacity 100ms linear' : 'opacity 240ms ease',
                  }}
                  onLoad={() => setBackdropLoaded(true)}
                />

                <div
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background:
                      'linear-gradient(180deg, rgba(18, 10, 30, 0.62) 0%, rgba(30, 18, 46, 0.28) 28%, rgba(56, 34, 77, 0.08) 52%, rgba(18, 12, 28, 0.88) 100%)',
                  }}
                />

                <div
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background:
                      'radial-gradient(circle at 14% 92%, rgba(216, 86, 255, 0.34) 0%, transparent 34%), radial-gradient(circle at 84% 9%, rgba(236, 72, 153, 0.12) 0%, transparent 20%), linear-gradient(118deg, rgba(236,72,153,0.12) 0%, transparent 38%)',
                  }}
                />

                <div
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-24"
                  style={{
                    background:
                      'linear-gradient(180deg, rgba(168, 85, 247, 0) 0%, rgba(110, 58, 165, 0.16) 42%, rgba(13, 9, 22, 0.9) 100%)',
                  }}
                />

                <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
                  {meta.eyebrow ? (
                    <motion.span
                      initial={reducedMotion ? false : { opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ ...contentTransition, delay: reducedMotion ? 0 : 0.04 }}
                      className="inline-flex max-w-[68%] truncate rounded-full px-2.5 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.14em]"
                      style={{
                        color: 'rgba(248, 250, 252, 0.96)',
                        background: 'linear-gradient(180deg, rgba(102, 55, 153, 0.96) 0%, rgba(83, 44, 126, 0.98) 100%)',
                        border: '1px solid rgba(248, 250, 252, 0.14)',
                        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)',
                        backdropFilter: 'var(--blur-md)',
                        fontFamily: 'var(--font-body)',
                      }}
                    >
                      <span className="truncate">{meta.eyebrow}</span>
                    </motion.span>
                  ) : (
                    <span />
                  )}
                  {meta.rating ? (
                    <motion.span
                      initial={reducedMotion ? false : { opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ ...contentTransition, delay: reducedMotion ? 0 : 0.06 }}
                      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[0.72rem] font-semibold"
                      style={{
                        color: 'var(--color-text)',
                        background: 'rgba(107, 114, 128, 0.78)',
                        border: '1px solid rgba(248, 250, 252, 0.22)',
                        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
                        backdropFilter: 'var(--blur-md)',
                        fontFamily: 'var(--font-body)',
                      }}
                    >
                      <Star
                        className="h-3.5 w-3.5"
                        style={{ fill: 'var(--amber-400)', color: 'var(--amber-400)' }}
                      />
                      {meta.rating}
                    </motion.span>
                  ) : null}
                </div>

                <div className="absolute inset-x-0 bottom-0 p-3">
                  <motion.div
                    initial={reducedMotion ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...contentTransition, delay: reducedMotion ? 0 : 0.08 }}
                    className="mb-2 h-[2px] w-10 rounded-full"
                    style={{ background: 'linear-gradient(90deg, rgba(216, 86, 255, 0.96) 0%, rgba(196, 141, 255, 0.65) 62%, transparent 100%)' }}
                  />
                  <motion.h3
                    initial={reducedMotion ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...contentTransition, delay: reducedMotion ? 0 : 0.1 }}
                    className="max-w-[80%] text-[clamp(1.0rem,1.15vw,1.25rem)] font-bold leading-[1.1] tracking-[-0.02em]"
                    style={{
                      color: 'var(--color-text)',
                      fontFamily: 'var(--font-body)',
                      textShadow: '0 12px 32px rgba(0,0,0,0.34)',
                    }}
                  >
                    {movie.title}
                  </motion.h3>
                </div>
              </div>

              <div
                className="relative flex flex-1 flex-col px-3.5 pb-3.5 pt-3"
                style={{
                  background:
                    'linear-gradient(180deg, rgba(50, 23, 73, 0.92) 0%, rgba(24, 12, 36, 0.98) 36%, rgba(11, 8, 17, 1) 100%)',
                }}
              >
                <div
                  className="pointer-events-none absolute inset-x-0 top-0 h-px"
                  style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(216, 180, 254, 0.5) 18%, rgba(248,250,252,0.12) 82%, transparent 100%)' }}
                />
                <div
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-16"
                  style={{
                    background:
                      'radial-gradient(circle at 0% 100%, rgba(168, 85, 247, 0.16) 0%, transparent 38%), radial-gradient(circle at 92% 100%, rgba(236, 72, 153, 0.1) 0%, transparent 28%)',
                  }}
                />
                <motion.div
                  initial={reducedMotion ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...contentTransition, delay: reducedMotion ? 0 : 0.12 }}
                  className="flex flex-wrap items-center gap-2.5"
                >
                  <div className="flex min-w-0 flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      aria-label={`View details for ${movie.title}`}
                      onClick={(event) => {
                        event.stopPropagation()
                        handleNavigate()
                      }}
                      className="inline-flex h-8 items-center gap-1.5 rounded-full px-4 text-[0.8rem] font-semibold"
                      style={{
                        color: 'var(--text)',
                        background: 'var(--gradient-primary)',
                        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.14)',
                        fontFamily: 'var(--font-body)',
                      }}
                    >
                      View details
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>

                    {user ? (
                      <>
                        <ActionButton
                          label={isInWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}
                          onClick={toggleWatchlist}
                          icon={Plus}
                          activeIcon={Check}
                          active={isInWatchlist}
                          loading={actionLoading.watchlist}
                        />
                        <ActionButton
                          label={isWatched ? 'Mark unwatched' : 'Mark watched'}
                          onClick={toggleWatched}
                          icon={EyeOff}
                          activeIcon={Eye}
                          active={isWatched}
                          loading={actionLoading.watched}
                        />
                      </>
                    ) : null}

                    <WatchProviders movieId={tmdbId} enabled={isExpanded} variant="pill" />
                  </div>
                </motion.div>

                <motion.div
                  initial={reducedMotion ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...contentTransition, delay: reducedMotion ? 0 : 0.15 }}
                  className="mt-2 flex flex-wrap items-center gap-2 text-[0.74rem] font-medium tracking-[-0.01em]"
                  style={{ color: 'rgba(248, 250, 252, 0.72)', fontFamily: 'var(--font-body)' }}
                >
                  {meta.year ? <span>{meta.year}</span> : null}
                  {meta.year && meta.runtime ? <MetaDot /> : null}
                  {meta.runtime ? <span>{meta.runtime}</span> : null}
                  {(meta.year || meta.runtime) && meta.genres.slice(0, 2).length ? <MetaDot /> : null}
                  {meta.genres.slice(0, 2).map((genre, genreIndex) => (
                    <span key={genre} className="inline-flex items-center gap-3">
                      {genreIndex > 0 ? <MetaDot /> : null}
                      {genre}
                    </span>
                  ))}
                </motion.div>

                <motion.div
                  initial={reducedMotion ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...contentTransition, delay: reducedMotion ? 0 : 0.18 }}
                  className="mt-2 flex-1 overflow-hidden"
                >
                  <div className="relative h-full">
                    <p
                      className="max-w-[94%] text-[0.76rem] leading-[1.5]"
                      style={{
                        color: 'rgba(248, 250, 252, 0.78)',
                        fontFamily: 'var(--font-body)',
                      }}
                    >
                      {meta.overview}
                    </p>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="collapsed"
              initial={reducedMotion ? { opacity: 0 } : { opacity: 0.92 }}
              animate={{ opacity: 1 }}
              exit={reducedMotion ? { opacity: 0 } : { opacity: 0 }}
              transition={shellTransition}
              className="relative h-full w-full overflow-hidden"
            >
              {!posterLoaded ? <div className="skeleton absolute inset-0" aria-hidden="true" /> : null}
              <img
                src={tmdbImg(movie.poster_path, 'w500')}
                alt={movie.title}
                loading={priority ? 'eager' : 'lazy'}
                fetchPriority={priority && index < 3 ? 'high' : undefined}
                className="h-full w-full object-cover"
                style={{
                  opacity: posterLoaded ? 1 : 0,
                  transform: `scale(${collapsedImageScale})`,
                  filter: collapsedImageFilter,
                  transition: reducedMotion
                    ? 'opacity 100ms linear'
                    : 'opacity 220ms ease, transform 380ms cubic-bezier(0.22, 1, 0.36, 1), filter 280ms ease',
                }}
                onLoad={() => setPosterLoaded(true)}
              />
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    hoverPhase === 'peek'
                      ? 'linear-gradient(to bottom, rgba(15, 23, 42, 0.02) 0%, rgba(25, 17, 42, 0.18) 44%, rgba(15, 23, 42, 0.82) 100%)'
                      : 'linear-gradient(to bottom, rgba(15, 23, 42, 0) 0%, rgba(15, 23, 42, 0.22) 100%)',
                }}
              />
              <div
                className="pointer-events-none absolute inset-x-0 bottom-0 h-24 transition-opacity duration-300"
                style={{
                  background:
                    'radial-gradient(circle at 50% 110%, rgba(168, 85, 247, 0.42) 0%, rgba(236, 72, 153, 0.18) 35%, transparent 72%)',
                  opacity: hoverPhase === 'peek' ? 1 : 0.25,
                }}
              />
              {meta.rating ? (
                <span
                  className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[0.78rem] font-semibold"
                  style={{
                        color: 'var(--color-text)',
                    background: hoverPhase === 'peek' ? 'rgba(49, 27, 73, 0.74)' : 'rgba(15, 23, 42, 0.72)',
                    border: hoverPhase === 'peek' ? '1px solid rgba(216, 180, 254, 0.22)' : '1px solid rgba(248, 250, 252, 0.12)',
                    backdropFilter: 'var(--blur-md)',
                  }}
                >
                  <Star
                    className="h-3.5 w-3.5"
                    style={{ fill: 'var(--amber-400)', color: 'var(--amber-400)' }}
                  />
                  {meta.rating}
                </span>
              ) : null}
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      <motion.div
        animate={{
          opacity: collapsedTitleHidden ? 0 : dimmed ? 0.6 : 1,
          y: collapsedTitleHidden ? -6 : 0,
          height: collapsedTitleHidden ? 0 : 48,
          marginTop: collapsedTitleHidden ? 0 : 12,
        }}
        transition={contentTransition}
        className="pointer-events-none overflow-hidden px-0.5"
      >
        <p
          className="line-clamp-1 text-[0.92rem] font-semibold leading-tight"
          style={{ color: 'var(--color-text)' }}
        >
          {movie.title}
        </p>
        <div
          className="mt-1 flex items-center gap-1.5 text-[0.82rem]"
          style={{ color: 'var(--color-text-muted)' }}
        >
          {meta.year ? <span>{meta.year}</span> : null}
          {meta.year && meta.rating ? <span>•</span> : null}
          {meta.rating ? (
            <span className="inline-flex items-center gap-1">
              <Star
                className="h-3 w-3"
                style={{ fill: 'var(--amber-400)', color: 'var(--amber-400)' }}
              />
              {meta.rating}
            </span>
          ) : null}
        </div>
      </motion.div>
    </div>
  )
})

MovieCard.displayName = 'MovieCard'
