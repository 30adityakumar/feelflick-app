// src/shared/components/MovieCardRating.jsx

import { Sparkles } from 'lucide-react'

/**
 * Card-level rating pill. Priority: personal (if provided) > audience > critic > null.
 * Personal rating gets a sparkle icon + "MATCH" label.
 * Optional "TOP" badge for genre-exceptional films.
 *
 * @param {object} props
 * @param {object} props.movie - needs ff_audience_rating, ff_audience_confidence,
 *   ff_critic_rating, ff_critic_confidence, ff_rating_genre_normalized, primary_genre
 * @param {number} [props.personalRating] - pre-computed personal rating (0-100)
 * @param {boolean} [props.showGenreBadge=false]
 * @param {'sm'|'md'} [props.size='sm']
 */
export default function MovieCardRating({ movie, personalRating, showGenreBadge = false, size = 'sm' }) {
  let value = null
  let isPersonal = false

  if (personalRating != null) {
    value = personalRating
    isPersonal = true
  } else if (movie?.ff_audience_rating != null && (movie.ff_audience_confidence ?? 0) >= 50) {
    value = movie.ff_audience_rating
  } else if (movie?.ff_critic_rating != null && (movie.ff_critic_confidence ?? 0) >= 50) {
    value = movie.ff_critic_rating
  }

  if (value == null) return null

  // ASSUMPTION: threshold 8.0 instead of 8.5 — current data tops out at 8.4
  const genreExcellent = showGenreBadge && (movie.ff_rating_genre_normalized ?? 0) >= 8.0
  const textSize = size === 'md' ? 'text-sm' : 'text-[0.68rem]'
  const iconSize = size === 'md' ? 'h-3 w-3' : 'h-2.5 w-2.5'

  return (
    <div className="flex items-center gap-1.5">
      <div
        className="flex items-center gap-1 rounded-full px-1.5 py-0.5 backdrop-blur-sm"
        style={{
          background: 'rgba(0,0,0,0.72)',
          border: isPersonal
            ? '1px solid rgba(192,132,252,0.35)'
            : '1px solid rgba(248,250,252,0.12)',
        }}
      >
        {isPersonal && <Sparkles className={`${iconSize} text-purple-300`} />}
        <span className={`${textSize} font-bold ${isPersonal ? 'text-purple-100' : 'text-white'} tabular-nums`}>
          {value}
        </span>
        {isPersonal && <span className="text-[0.55rem] font-normal text-purple-300/70">MATCH</span>}
      </div>
      {genreExcellent && (
        <div
          className="rounded-full px-1.5 py-0.5 backdrop-blur-sm"
          style={{
            background: 'rgba(192,132,252,0.15)',
            border: '1px solid rgba(192,132,252,0.3)',
          }}
          title={`Exceptional for ${movie.primary_genre || 'genre'}`}
        >
          <span className="text-[0.55rem] font-bold text-purple-200 uppercase tracking-wider">Top</span>
        </div>
      )}
    </div>
  )
}
