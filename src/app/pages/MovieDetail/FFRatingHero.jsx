// src/app/pages/MovieDetail/FFRatingHero.jsx

import { Sparkles } from 'lucide-react'

import { usePersonalRating } from '@/shared/hooks/usePersonalRating'

/**
 * Hero-level rating display for MovieDetail.
 * Priority: personal > audience > critic > fallback.
 * @param {object} props
 * @param {object|null} props.internalMovie - DB movie row with ff_* columns
 */
export default function FFRatingHero({ internalMovie }) {
  const { personalRating } = usePersonalRating(internalMovie)

  // Priority: personal > audience > critic > none
  let primary = null
  let primaryLabel = ''
  let secondaryLine = ''

  if (personalRating?.rating != null && personalRating.confidence >= 50) {
    primary = personalRating.rating
    primaryLabel = 'Your Match'
    secondaryLine = getTasteTier(personalRating.rating)
  } else if (internalMovie?.ff_audience_rating != null && (internalMovie.ff_audience_confidence ?? 0) >= 50) {
    primary = internalMovie.ff_audience_rating
    primaryLabel = 'Audience'
    secondaryLine = getQualityTier(primary)
  } else if (internalMovie?.ff_critic_rating != null && (internalMovie.ff_critic_confidence ?? 0) >= 50) {
    primary = internalMovie.ff_critic_rating
    primaryLabel = 'Critics'
    secondaryLine = getQualityTier(primary)
  }

  if (primary == null) {
    return <span className="text-white/40 text-sm">Rating pending</span>
  }

  return (
    <div className="inline-flex items-center gap-3">
      <div className="flex items-baseline gap-1.5">
        <Sparkles className="h-4 w-4 text-purple-400" />
        <span className="text-3xl font-black text-white tabular-nums">{primary}</span>
        <span className="text-sm text-white/40">/100</span>
      </div>
      <div className="flex flex-col">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-white/60">{primaryLabel}</span>
        <span className="text-xs text-white/70">{secondaryLine}</span>
      </div>
    </div>
  )
}

function getQualityTier(r) {
  if (r >= 90) return 'Masterwork'
  if (r >= 80) return 'Excellent'
  if (r >= 70) return 'Strong'
  if (r >= 60) return 'Worth watching'
  if (r >= 50) return 'Mixed'
  return 'Weak'
}

function getTasteTier(r) {
  if (r >= 90) return 'Perfect match'
  if (r >= 80) return 'Strong match'
  if (r >= 70) return 'Good match'
  if (r >= 60) return 'Decent match'
  return 'Weak match'
}
