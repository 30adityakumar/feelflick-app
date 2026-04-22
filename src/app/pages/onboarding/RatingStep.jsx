// src/app/pages/onboarding/RatingStep.jsx
import { useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { ChevronLeft } from 'lucide-react'

import { tmdbImg } from '@/shared/api/tmdb'
import Button from '@/shared/ui/Button'

// Sentiment → numeric rating mapping
export const SENTIMENT_RATINGS = {
  loved: 9,
  liked: 7,
  okay:  5,
}

const SENTIMENTS = [
  { key: 'loved', label: '❤️ Loved it',    gradient: 'from-purple-500 to-pink-500'       },
  { key: 'liked', label: '👍 Liked it',    gradient: 'from-purple-400/70 to-blue-400/70'  },
  { key: 'okay',  label: '😐 It was okay', gradient: 'from-white/15 to-white/5'           },
]

// === FILM CARD ===

function FilmRatingCard({ movie, activeSentiment, onRate }) {
  const [posterLoaded, setPosterLoaded] = useState(false)
  const prefersReducedMotion = useReducedMotion()
  const year = movie.release_date ? new Date(movie.release_date).getFullYear() : null
  const isRated = activeSentiment != null

  return (
    <div className={`flex-none w-44 sm:w-48 rounded-2xl overflow-hidden transition-shadow duration-200 ${
      isRated
        ? 'ring-2 ring-purple-400 shadow-[0_0_24px_rgba(168,85,247,0.4)]'
        : 'ring-1 ring-white/10'
    }`}>
      {/* Poster */}
      <div className="relative aspect-[2/3]">
        {!posterLoaded && <div className="absolute inset-0 bg-white/[0.04] animate-pulse" />}
        <img
          src={tmdbImg(movie.poster_path, 'w342')}
          alt={movie.title}
          loading="eager"
          className={`w-full h-full object-cover transition-all duration-300 ${posterLoaded ? 'opacity-100' : 'opacity-0'} ${isRated ? 'brightness-75' : ''}`}
          onLoad={() => setPosterLoaded(true)}
        />
        {isRated && <div className="absolute inset-0 bg-purple-600/15" />}
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent px-2.5 pt-8 pb-2.5">
          <p className="text-[11px] font-semibold text-white leading-tight line-clamp-2">{movie.title}</p>
          {year && <p className="text-[10px] text-white/40 mt-0.5">{year}</p>}
        </div>
      </div>

      {/* Sentiment buttons */}
      <div className="bg-neutral-900/80 p-2 flex flex-col gap-1.5">
        {SENTIMENTS.map(({ key, label, gradient }) => {
          const isActive = activeSentiment === key
          return (
            <motion.button
              key={key}
              type="button"
              onClick={() => onRate(movie, key)}
              aria-pressed={isActive}
              whileTap={prefersReducedMotion ? undefined : { scale: 0.94 }}
              animate={isActive ? { scale: [1, 1.04, 1] } : { scale: 1 }}
              transition={isActive ? { duration: 0.2 } : {}}
              className={`w-full rounded-lg px-2.5 py-1.5 text-[11px] sm:text-[12px] font-semibold text-white text-left transition-all duration-150 ${
                isActive
                  ? `bg-gradient-to-r ${gradient} shadow`
                  : 'bg-white/[0.07] hover:bg-white/[0.13]'
              }`}
            >
              {label}
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}

// === MAIN COMPONENT ===

/**
 * Onboarding step 3: rating anchor.
 * User can rate any or all of their 5 films. Min 1 required to continue.
 *
 * @param {{
 *   favoriteMovies: object[],
 *   ratings: Record<number, number>,
 *   onRate: (movie: object, sentiment: string) => void,
 *   onBack: () => void,
 *   onFinish: () => void,
 *   loading: boolean,
 *   error: string,
 * }} props
 */
export default function RatingStep({ favoriteMovies, ratings, onRate, onBack, onFinish, loading, error }) {
  const ratedCount = Object.keys(ratings).length
  const canFinish = ratedCount >= 1

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-none px-6 pt-6 pb-5">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-white/40 hover:text-white/70 transition-colors mb-4"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>
        <h2 className="text-5xl font-black tracking-tight text-white leading-[1.05]">
          Which ones hit?
        </h2>
        <p className="text-base text-white/60 mt-2 leading-relaxed">
          Rate at least one — the more you rate, the sharper we tune.
        </p>
      </div>

      {/* Film cards — horizontal scroll */}
      <div className="flex-1 min-h-0 overflow-y-auto px-6">
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm text-center">
            {error}
          </div>
        )}

        <div className="flex gap-3 pb-4 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <AnimatePresence initial={false}>
            {favoriteMovies.map(movie => (
              <FilmRatingCard
                key={movie.id}
                movie={movie}
                activeSentiment={(() => {
                  const r = ratings[movie.id]
                  if (r == null) return null
                  return r === 9 ? 'loved' : r === 7 ? 'liked' : 'okay'
                })()}
                onRate={onRate}
              />
            ))}
          </AnimatePresence>
        </div>

        {/* Status line */}
        <AnimatePresence>
          {ratedCount > 0 && (
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              className="mt-2 mb-4 text-center text-sm text-purple-300/80"
            >
              {ratedCount} rated ✓ — rate as many as you like
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="flex-none px-6 pb-8 pt-4 border-t border-white/[0.06]">
        <div className="max-w-sm mx-auto flex flex-col items-center gap-3">
          {!canFinish && (
            <p className="text-xs font-medium text-white/30">
              Rate at least one film to continue
            </p>
          )}
          <Button
            variant="primary"
            size="lg"
            onClick={onFinish}
            disabled={!canFinish || loading}
            fullWidth
          >
            {loading ? 'Building your profile…' : 'See my recommendations'}
          </Button>
        </div>
      </div>
    </div>
  )
}
