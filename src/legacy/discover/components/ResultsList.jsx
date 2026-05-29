// src/app/pages/discover/components/ResultsList.jsx
import { useCallback, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'

import { supabase } from '@/shared/lib/supabase/client'
import { useAuthSession } from '@/shared/hooks/useAuthSession'
import { addToWatchlist } from '@/shared/services/watchlist'
import { submitRecommendationFeedback } from '@/shared/services/feedback'
import Button from '@/shared/ui/Button'

import TopPickCard from './TopPickCard'
import AlternateCard from './AlternateCard'

/** Initial number of alternates shown (films[1] through films[4]). */
const INITIAL_ALTERNATES = 4

/** Number of additional films revealed per "More like this" click. */
const MORE_BATCH = 5

/**
 * Discover results layout: TopPickCard hero for films[0],
 * 2-column grid of AlternateCards for films[1-4],
 * "More like this" expands next 5, repeat.
 *
 * @param {{ films: Array, onOpenDetail: (film: object) => void,
 *           onTrackWatchlist?: Function, onTrackSeen?: Function, onTrackDismiss?: Function }} props
 */
export default function ResultsList({ films, onOpenDetail, onTrackWatchlist, onTrackSeen, onTrackDismiss }) {
  const { userId } = useAuthSession()
  const [dismissedIds, setDismissedIds] = useState(new Set())
  const [watchlistedIds, setWatchlistedIds] = useState(new Set())
  const [seenIds, setSeenIds] = useState(new Set())
  const [revealedCount, setRevealedCount] = useState(INITIAL_ALTERNATES)

  const handleAddWatchlist = useCallback(async (film) => {
    if (!userId) return
    setWatchlistedIds((prev) => new Set([...prev, film.movie_id]))
    await addToWatchlist(userId, film.movie_id || film.tmdb_id)
    onTrackWatchlist?.(film.movie_id)
  }, [userId, onTrackWatchlist])

  const handleMarkSeen = useCallback(async (film) => {
    if (!userId) return
    setSeenIds((prev) => new Set([...prev, film.movie_id]))

    try {
      await supabase.from('user_history').insert({
        user_id: userId,
        movie_id: film.movie_id,
        source: 'discover',
      })
    } catch (err) {
      console.error('[ResultsList] user_history insert failed:', err)
    }

    try {
      await addToWatchlist(userId, film.movie_id || film.tmdb_id, { status: 'watched', source: 'discover' })
    } catch (err) {
      console.error('[ResultsList] addToWatchlist failed:', err)
    }

    onTrackSeen?.(film.movie_id)
  }, [userId, onTrackSeen])

  const handleDismiss = useCallback(async (film) => {
    if (!userId) return
    setDismissedIds((prev) => new Set([...prev, film.movie_id]))
    await submitRecommendationFeedback(userId, film.movie_id || film.tmdb_id, -1, 'discover_brief')
    onTrackDismiss?.(film.movie_id)
  }, [userId, onTrackDismiss])

  // Sort by match_percentage DESC, filter dismissed
  const sorted = [...films]
    .filter((f) => !dismissedIds.has(f.movie_id))
    .sort((a, b) => (b.match_percentage ?? 0) - (a.match_percentage ?? 0))

  if (sorted.length === 0) return null

  const topPick = sorted[0]
  const alternates = sorted.slice(1, 1 + revealedCount)
  const hasMore = sorted.length > 1 + revealedCount

  return (
    <div>
      {/* Hero top pick */}
      <TopPickCard
        film={topPick}
        isWatchlisted={watchlistedIds.has(topPick.movie_id)}
        isSeen={seenIds.has(topPick.movie_id)}
        onOpenDetail={onOpenDetail}
        onAddWatchlist={handleAddWatchlist}
        onMarkSeen={handleMarkSeen}
      />

      {/* Alternates section header */}
      {alternates.length > 0 && (
        <div className="flex items-center gap-3 mb-4 mt-2">
          <div className="w-[3px] h-5 rounded-full bg-gradient-to-b from-purple-400 to-pink-500" />
          <h2 className="text-[1.05rem] sm:text-[1.15rem] font-bold text-white tracking-tight whitespace-nowrap">
            Also great for this brief
          </h2>
          <div className="h-px flex-1 bg-gradient-to-r from-purple-400/20 via-white/5 to-transparent" />
        </div>
      )}

      {/* Alternates grid */}
      <AnimatePresence>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {alternates.map((film, i) => (
            <AlternateCard
              key={film.movie_id}
              film={film}
              index={i}
              isWatchlisted={watchlistedIds.has(film.movie_id)}
              isSeen={seenIds.has(film.movie_id)}
              onOpenDetail={onOpenDetail}
              onAddWatchlist={handleAddWatchlist}
              onMarkSeen={handleMarkSeen}
              onDismiss={handleDismiss}
            />
          ))}
        </div>
      </AnimatePresence>

      {/* More like this */}
      {hasMore && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex justify-center mt-6"
        >
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setRevealedCount((c) => c + MORE_BATCH)}
            aria-label="Show more recommendations"
          >
            <ChevronDown className="h-4 w-4" />
            More like this
          </Button>
        </motion.div>
      )}
    </div>
  )
}
