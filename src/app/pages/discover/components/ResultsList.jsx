// src/app/pages/discover/components/ResultsList.jsx
import { useCallback, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

import { useAuthSession } from '@/shared/hooks/useAuthSession'
import { addToWatchlist } from '@/shared/services/watchlist'
import { submitRecommendationFeedback } from '@/shared/services/feedback'
import { buildWhyThis } from '@/shared/services/whyThis'
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
 * Vertical magazine-style list of 10 film results.
 *
 * @param {{ films: Array, brief: { answers: Record<string, any>, anchor?: object },
 *           onOpenDetail: (film: object) => void }} props
 */
export default function ResultsList({ films, brief, onOpenDetail }) {
  const { userId } = useAuthSession()
  const [dismissedIds, setDismissedIds] = useState(new Set())

  const handleAddWatchlist = useCallback(async (film) => {
    if (!userId) return
    await addToWatchlist(userId, film.movie_id || film.tmdb_id)
  }, [userId])

  const handleMarkSeen = useCallback(async (film) => {
    if (!userId) return
    // Mark as watched via watchlist with watched status
    await addToWatchlist(userId, film.movie_id || film.tmdb_id, { status: 'watched' })
  }, [userId])

  const handleDismiss = useCallback(async (film) => {
    if (!userId) return
    await submitRecommendationFeedback(userId, film.movie_id || film.tmdb_id, -1, 'discover_brief')
    setDismissedIds((prev) => new Set([...prev, film.movie_id]))
  }, [userId])

  // Sort by match_percentage DESC
  const sorted = [...films]
    .filter((f) => !dismissedIds.has(f.movie_id))
    .sort((a, b) => (b.match_percentage ?? 0) - (a.match_percentage ?? 0))

  return (
    <div>
      <AnimatePresence>
        {sorted.map((film, index) => (
          <motion.div
            key={film.movie_id}
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -40, transition: { duration: 0.3 } }}
            transition={{ duration: 0.4, delay: index * 0.05 }}
          >
            {/* Top Pick eyebrow for position 0 */}
            {index === 0 && (
              <p className="text-[10px] font-semibold uppercase tracking-widest text-purple-400/70 mb-1 -mt-2">
                Top Pick
              </p>
            )}

            <div className="grid grid-cols-[5rem_1fr_auto] sm:grid-cols-[6rem_1fr_auto] gap-5 py-6 border-b border-white/10 items-start group">
              {/* Poster */}
              <button
                type="button"
                onClick={() => onOpenDetail(film)}
                className="block"
                aria-label={`View details for ${film.title}`}
              >
                {film.poster_path ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w185${film.poster_path}`}
                    alt={film.title}
                    className="w-full aspect-[2/3] rounded-lg object-cover ring-1 ring-white/10 group-hover:ring-purple-400/40 transition-all"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full aspect-[2/3] rounded-lg bg-neutral-900 ring-1 ring-white/10 flex items-center justify-center">
                    <span className="text-2xl" aria-hidden="true">🎬</span>
                  </div>
                )}
              </button>

              {/* Content */}
              <div className="min-w-0">
                <div className="flex items-baseline gap-2 flex-wrap mb-1">
                  <button
                    type="button"
                    onClick={() => onOpenDetail(film)}
                    className="text-left"
                  >
                    <h3 className="text-lg font-bold text-white hover:text-purple-200 transition-colors">
                      {film.title}
                    </h3>
                  </button>
                  {film.release_year && (
                    <span className="text-xs text-white/40 tabular-nums">
                      {film.release_year}
                    </span>
                  )}
                  {film.runtime && (
                    <>
                      <span className="text-xs text-white/40" aria-hidden="true">·</span>
                      <span className="text-xs text-white/40 tabular-nums">
                        {formatRuntime(film.runtime)}
                      </span>
                    </>
                  )}
                </div>

                <p className="text-sm text-white/70 mb-3 leading-relaxed max-w-prose">
                  {buildWhyThis(film, brief)}
                </p>

                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleAddWatchlist(film)}
                    aria-label={`Add ${film.title} to watchlist`}
                  >
                    Watchlist
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMarkSeen(film)}
                    aria-label={`Mark ${film.title} as seen`}
                  >
                    Seen it
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDismiss(film)}
                    aria-label={`Dismiss ${film.title}`}
                  >
                    Not tonight
                  </Button>
                </div>
              </div>

              {/* Match % */}
              <div className="text-right">
                <p className="text-2xl font-light tabular-nums text-white">
                  {film.match_percentage ?? 0}
                  <span className="text-xs text-white/40 ml-0.5">%</span>
                </p>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-white/40">
                  match
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
