// src/app/pages/discover/components/TopPickCard.jsx
import { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Bookmark, BookmarkCheck, Check, Eye, Play } from 'lucide-react'

import { tmdbImg } from '@/shared/api/tmdb'
import Button from '@/shared/ui/Button'

/**
 * Format runtime in hours + minutes.
 * @param {number|null} runtime
 * @returns {string}
 */
function formatRuntime(runtime) {
  if (!runtime) return ''
  const h = Math.floor(runtime / 60)
  const m = runtime % 60
  if (h === 0) return `${m}m`
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

/**
 * Animated circular match % ring indicator.
 * @param {{ percent: number, size?: number }} props
 */
function MatchRing({ percent, size = 72 }) {
  const r = (size - 6) / 2
  const circumference = 2 * Math.PI * r
  const offset = circumference - (percent / 100) * circumference

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={3} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke="url(#match-gradient)" strokeWidth={3} strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          strokeDasharray={circumference}
        />
        <defs>
          <linearGradient id="match-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold tabular-nums text-white leading-none">{percent}</span>
        <span className="text-[8px] uppercase tracking-wider text-white/40 mt-0.5">match</span>
      </div>
    </div>
  )
}

/**
 * Cinematic hero top pick card for Discover results.
 * Full-bleed backdrop, floating poster, match% ring, optimistic button state.
 *
 * @param {{
 *   film: Object,
 *   isWatchlisted?: boolean,
 *   isSeen?: boolean,
 *   onOpenDetail: (film: Object) => void,
 *   onAddWatchlist: (film: Object) => void,
 *   onMarkSeen: (film: Object) => void,
 * }} props
 */
export default function TopPickCard({ film, isWatchlisted, isSeen, onOpenDetail, onAddWatchlist, onMarkSeen }) {
  const [backdropLoaded, setBackdropLoaded] = useState(false)
  const [posterLoaded, setPosterLoaded] = useState(false)
  const revealTimerRef = useRef(null)
  const [revealed, setRevealed] = useState(false)

  // Progressive reveal
  useEffect(() => {
    if (backdropLoaded || posterLoaded) {
      revealTimerRef.current = setTimeout(() => setRevealed(true), 80)
    }
    const forceTimer = setTimeout(() => setRevealed(true), 300)
    return () => {
      clearTimeout(revealTimerRef.current)
      clearTimeout(forceTimer)
    }
  }, [backdropLoaded, posterLoaded])

  const handleClick = useCallback(() => onOpenDetail(film), [film, onOpenDetail])

  const genre = film.primary_genre || film.genres?.[0]?.name || ''
  const matchPct = film.match_percentage ?? 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="relative rounded-2xl overflow-hidden mb-8"
    >
      {/* Full-bleed backdrop */}
      <div className="absolute inset-0">
        {film.backdrop_path ? (
          <img
            src={tmdbImg(film.backdrop_path, 'w1280')}
            alt=""
            className={`w-full h-full object-cover transition-opacity duration-700 ${revealed ? 'opacity-30' : 'opacity-0'}`}
            style={{ filter: 'blur(1px)' }}
            onLoad={() => setBackdropLoaded(true)}
          />
        ) : (
          <div className="w-full h-full bg-neutral-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/85 to-neutral-950/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-neutral-950/50" />
      </div>

      {/* Content */}
      <div className="relative grid grid-cols-[auto_1fr] gap-5 sm:gap-8 p-6 sm:p-10">
        {/* Floating poster */}
        <button
          type="button"
          onClick={handleClick}
          className="block w-32 sm:w-40 flex-shrink-0"
          aria-label={`View details for ${film.title}`}
        >
          {film.poster_path ? (
            <img
              src={tmdbImg(film.poster_path, 'w342')}
              alt={film.title}
              className={`w-full aspect-[2/3] rounded-xl object-cover shadow-2xl shadow-black/60 ring-1 ring-white/10 transition-all duration-700 ${revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
              onLoad={() => setPosterLoaded(true)}
            />
          ) : (
            <div className="w-full aspect-[2/3] rounded-xl bg-neutral-800 ring-1 ring-white/10 flex items-center justify-center">
              <Play className="h-8 w-8 text-white/30" />
            </div>
          )}
        </button>

        {/* Info panel */}
        <div className="flex flex-col justify-center min-w-0 py-1">
          {/* Top Pick + Match ring row */}
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-purple-400/70">
              Top Pick
            </p>
            <MatchRing percent={matchPct} />
          </div>

          {/* Title */}
          <button type="button" onClick={handleClick} className="text-left mb-2">
            <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight tracking-tight hover:text-purple-200 transition-colors">
              {film.title}
            </h2>
          </button>

          {/* Meta row */}
          <div className="flex items-center gap-2 text-sm text-white/50 mb-3 flex-wrap">
            {film.release_year && <span className="tabular-nums">{film.release_year}</span>}
            {genre && (
              <>
                <span aria-hidden="true">&middot;</span>
                <span>{genre}</span>
              </>
            )}
            {film.runtime && (
              <>
                <span aria-hidden="true">&middot;</span>
                <span className="tabular-nums">{formatRuntime(film.runtime)}</span>
              </>
            )}
          </div>

          {/* Reason text */}
          {film._briefReason && (
            <p className="text-sm italic leading-relaxed mb-4 bg-gradient-to-r from-purple-300/80 to-pink-300/60 bg-clip-text text-transparent">
              {film._briefReason}
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="primary"
              size="sm"
              onClick={handleClick}
              aria-label={`View details for ${film.title}`}
              className="min-h-[44px] sm:min-h-0"
            >
              <Play className="h-3.5 w-3.5" />
              Details
            </Button>
            <Button
              variant={isWatchlisted ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => onAddWatchlist(film)}
              disabled={isWatchlisted}
              aria-label={isWatchlisted ? `${film.title} added to watchlist` : `Add ${film.title} to watchlist`}
              className="min-h-[44px] sm:min-h-0"
            >
              {isWatchlisted ? <BookmarkCheck className="h-3.5 w-3.5" /> : <Bookmark className="h-3.5 w-3.5" />}
              {isWatchlisted ? 'Added' : 'Watchlist'}
            </Button>
            <Button
              variant={isSeen ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => onMarkSeen(film)}
              disabled={isSeen}
              aria-label={isSeen ? `${film.title} marked as seen` : `Mark ${film.title} as seen`}
              className="min-h-[44px] sm:min-h-0"
            >
              {isSeen ? <Eye className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
              {isSeen ? 'Seen' : 'Seen it'}
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
