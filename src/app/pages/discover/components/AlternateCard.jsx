// src/app/pages/discover/components/AlternateCard.jsx
import { motion } from 'framer-motion'
import { Bookmark, BookmarkCheck, Check, Eye, X } from 'lucide-react'

import { tmdbImg } from '@/shared/api/tmdb'

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
 * Small circular match % ring.
 * @param {{ percent: number }} props
 */
function MiniMatchRing({ percent }) {
  const size = 40
  const r = (size - 4) / 2
  const circumference = 2 * Math.PI * r
  const offset = circumference - (percent / 100) * circumference

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={2} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke="url(#mini-match-grad)" strokeWidth={2} strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          strokeDasharray={circumference}
        />
        <defs>
          <linearGradient id="mini-match-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[11px] font-bold tabular-nums text-white/80">{percent}</span>
      </div>
    </div>
  )
}

/**
 * Glassmorphism alternate pick card with hover elevation and optimistic state.
 *
 * @param {{
 *   film: Object,
 *   index: number,
 *   isWatchlisted?: boolean,
 *   isSeen?: boolean,
 *   onOpenDetail: (film: Object) => void,
 *   onAddWatchlist: (film: Object) => void,
 *   onMarkSeen: (film: Object) => void,
 *   onDismiss: (film: Object) => void,
 * }} props
 */
export default function AlternateCard({ film, index, isWatchlisted, isSeen, onOpenDetail, onAddWatchlist, onMarkSeen, onDismiss }) {
  const matchPct = film.match_percentage ?? 0
  const genre = film.primary_genre || film.genres?.[0]?.name || ''

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.1 + index * 0.07, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className="group rounded-xl backdrop-blur-xl bg-white/[0.04] border border-white/[0.08] hover:border-purple-400/25 hover:bg-white/[0.06] hover:shadow-lg hover:shadow-purple-500/5 transition-all duration-200 overflow-hidden"
    >
      <div className="flex gap-3.5 p-3.5">
        {/* Poster */}
        <button
          type="button"
          onClick={() => onOpenDetail(film)}
          className="block w-[4.5rem] sm:w-20 flex-shrink-0"
          aria-label={`View details for ${film.title}`}
        >
          {film.poster_path ? (
            <img
              src={tmdbImg(film.poster_path, 'w185')}
              alt={film.title}
              className="w-full aspect-[2/3] rounded-lg object-cover ring-1 ring-white/10 shadow-md"
              loading="lazy"
            />
          ) : (
            <div className="w-full aspect-[2/3] rounded-lg bg-neutral-800 ring-1 ring-white/10" />
          )}
        </button>

        {/* Info */}
        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
          <div>
            {/* Title + match ring */}
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <button
                type="button"
                onClick={() => onOpenDetail(film)}
                className="text-left min-w-0"
              >
                <h3 className="text-sm font-bold text-white leading-tight truncate hover:text-purple-200 transition-colors">
                  {film.title}
                </h3>
              </button>
              <MiniMatchRing percent={matchPct} />
            </div>

            {/* Meta */}
            <div className="flex items-center gap-1.5 text-xs text-white/40 mb-1.5">
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

            {/* Reason */}
            {film._briefReason && (
              <p className="text-xs text-purple-300/50 italic leading-snug line-clamp-1">
                {film._briefReason}
              </p>
            )}
          </div>

          {/* Action row */}
          <div className="flex items-center gap-1.5 mt-2">
            <button
              onClick={() => onAddWatchlist(film)}
              disabled={isWatchlisted}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold transition-colors ${
                isWatchlisted
                  ? 'text-purple-300/60 border border-purple-400/30 bg-purple-500/10'
                  : 'text-purple-400 border border-purple-500/30 hover:border-purple-400/50 hover:text-purple-300'
              }`}
              aria-label={isWatchlisted ? `${film.title} saved` : `Save ${film.title}`}
            >
              {isWatchlisted ? <BookmarkCheck className="h-3 w-3" /> : <Bookmark className="h-3 w-3" />}
              {isWatchlisted ? 'Saved' : 'Save'}
            </button>
            <button
              onClick={() => onMarkSeen(film)}
              disabled={isSeen}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold transition-colors ${
                isSeen
                  ? 'text-white/40 border border-white/15 bg-white/5'
                  : 'text-white/50 border border-white/10 hover:border-white/20 hover:text-white/70'
              }`}
              aria-label={isSeen ? `${film.title} seen` : `Mark ${film.title} as seen`}
            >
              {isSeen ? <Eye className="h-3 w-3" /> : <Check className="h-3 w-3" />}
              {isSeen ? 'Seen' : 'Seen'}
            </button>
            <button
              onClick={() => onDismiss(film)}
              className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold text-white/25 border border-white/[0.05] hover:border-white/15 hover:text-white/50 transition-colors ml-auto"
              aria-label={`Dismiss ${film.title}`}
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
