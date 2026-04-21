// src/app/pages/onboarding/RatingStep.jsx
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
  { key: 'loved', label: '❤️ Loved it',   rating: 9, color: 'from-purple-500 to-pink-500'    },
  { key: 'liked', label: '👍 Liked it',   rating: 7, color: 'from-purple-400/60 to-blue-400/60' },
  { key: 'okay',  label: '😐 It was okay', rating: 5, color: 'from-white/10 to-white/5'        },
]

/**
 * A film card with three sentiment buttons.
 * Only one film + one sentiment can be active at a time.
 */
function FilmRatingCard({ movie, pick, onRate, isSelected }) {
  const [posterLoaded, setPosterLoaded] = useState(false)
  const year = movie.release_date ? new Date(movie.release_date).getFullYear() : null

  return (
    <motion.div
      layout
      className={`flex-none w-36 sm:w-40 rounded-2xl overflow-hidden transition-all duration-200 ${
        isSelected ? 'ring-2 ring-purple-400 shadow-lg shadow-purple-500/20' : 'ring-1 ring-white/10'
      }`}
    >
      {/* Poster */}
      <div className="relative aspect-[2/3]">
        {!posterLoaded && <div className="absolute inset-0 bg-white/[0.04] animate-pulse" />}
        <img
          src={tmdbImg(movie.poster_path, 'w342')}
          alt={movie.title}
          loading="eager"
          className={`w-full h-full object-cover transition-opacity duration-300 ${posterLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setPosterLoaded(true)}
        />
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent px-2 pt-6 pb-2">
          <p className="text-[11px] font-bold text-white leading-tight line-clamp-2">{movie.title}</p>
          {year && <p className="text-[10px] text-white/40 mt-0.5">{year}</p>}
        </div>
      </div>

      {/* Sentiment buttons */}
      <div className="bg-neutral-900 p-2 flex flex-col gap-1.5">
        {SENTIMENTS.map(({ key, label, color }) => {
          const isActive = pick?.tmdbId === movie.id && pick?.sentiment === key
          return (
            <button
              key={key}
              type="button"
              onClick={() => onRate(movie, key)}
              aria-pressed={isActive}
              className={`w-full rounded-lg px-2 py-1.5 text-[10px] sm:text-[11px] font-semibold text-white text-left transition-all duration-150 active:scale-95 ${
                isActive
                  ? `bg-gradient-to-r ${color} shadow`
                  : 'bg-white/[0.06] hover:bg-white/[0.12]'
              }`}
            >
              {label}
            </button>
          )
        })}
      </div>
    </motion.div>
  )
}

/**
 * Onboarding step 3: rating anchor.
 * User picks ONE of their 5 films and rates it with a sentiment.
 * This single rating becomes the strongest signal for first-run recommendations.
 *
 * @param {{
 *   favoriteMovies: object[],
 *   pick: { tmdbId: number, sentiment: string, rating: number } | null,
 *   onRate: (movie: object, sentiment: string) => void,
 *   onBack: () => void,
 *   onFinish: () => void,
 *   loading: boolean,
 *   error: string,
 * }} props
 */
export default function RatingStep({ favoriteMovies, pick, onRate, onBack, onFinish, loading, error }) {
  const canFinish = pick !== null

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
        <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">
          Rate the one you loved most.
        </h2>
        <p className="text-sm text-white/40 mt-2 leading-relaxed">
          One rating is all it takes — we&apos;ll use it to tune your first recommendations.
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
                pick={pick}
                onRate={onRate}
                isSelected={pick?.tmdbId === movie.id}
              />
            ))}
          </AnimatePresence>
        </div>

        {/* Selected state summary */}
        <AnimatePresence>
          {pick && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="mt-2 mb-4 text-center text-sm text-purple-300/80"
            >
              Using <strong className="text-white">{favoriteMovies.find(m => m.id === pick.tmdbId)?.title}</strong> as your taste anchor ✓
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="flex-none px-6 pb-8 pt-4 border-t border-white/[0.06]">
        <div className="max-w-sm mx-auto flex flex-col items-center gap-3">
          {!canFinish && (
            <p className="text-xs font-medium text-white/30">
              Tap a sentiment on any film to continue
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
