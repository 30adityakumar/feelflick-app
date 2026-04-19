// src/app/pages/MovieDetail/RatingBreakdown.jsx

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

import { usePersonalRating } from '@/shared/hooks/usePersonalRating'

/**
 * Expandable panel showing all ff_* scores + personal rating components.
 * Collapses by default; expands on tap/click.
 * @param {object} props
 * @param {object|null} props.movie - DB movie row with ff_* columns
 */
export default function RatingBreakdown({ movie }) {
  const [expanded, setExpanded] = useState(false)
  const { personalRating } = usePersonalRating(movie)

  if (!movie) return null

  const rows = []

  if (personalRating?.rating != null && personalRating.confidence >= 50) {
    rows.push({
      key: 'personal',
      label: 'Your Match',
      value: personalRating.rating,
      confidence: personalRating.confidence,
      note: 'Based on your taste',
      primary: true,
    })
  }

  if (movie.ff_critic_rating != null) {
    rows.push({
      key: 'critic',
      label: 'Critics',
      value: movie.ff_critic_rating,
      confidence: movie.ff_critic_confidence,
      note: confidenceNote(movie.ff_critic_confidence, 'critic consensus'),
    })
  }

  if (movie.ff_audience_rating != null) {
    rows.push({
      key: 'audience',
      label: 'Audience',
      value: movie.ff_audience_rating,
      confidence: movie.ff_audience_confidence,
      note: confidenceNote(movie.ff_audience_confidence, 'audience vote'),
    })
  }

  if (movie.ff_community_rating != null && (movie.ff_community_confidence ?? 0) >= 60) {
    rows.push({
      key: 'community',
      label: 'FeelFlick Users',
      value: movie.ff_community_rating,
      confidence: movie.ff_community_confidence,
      note: `${movie.ff_community_votes ?? 0} ratings`,
    })
  } else if (movie.ff_community_confidence != null) {
    rows.push({
      key: 'community',
      label: 'FeelFlick Users',
      value: null,
      note: `Gathering ratings\u2026 ${movie.ff_community_votes ?? 0} so far`,
    })
  }

  // No rows at all — nothing to show
  if (rows.length === 0) return null

  // Genre excellence badge
  const genreNorm = movie.ff_rating_genre_normalized
  // ASSUMPTION: threshold 8.0 instead of 8.5 — current data tops out at 8.4
  const genreBadge = genreNorm != null && genreNorm >= 8.0
    ? `Exceptional for ${movie.primary_genre || 'its genre'}`
    : null

  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.02] overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/[0.03] transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-white">The Numbers</span>
          {genreBadge && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/15 text-purple-300 border border-purple-500/25">
              {genreBadge}
            </span>
          )}
        </div>
        <ChevronDown className={`h-4 w-4 text-white/40 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-3">
          {rows.map(r => (
            <div key={r.key} className="flex items-center gap-3">
              <span className="w-32 text-xs text-white/60 flex-shrink-0">{r.label}</span>
              <div className="flex-1 flex items-center gap-2">
                {r.value != null ? (
                  <>
                    <span className={`text-lg font-bold tabular-nums ${r.primary ? 'text-purple-300' : 'text-white'}`}>
                      {r.value}
                    </span>
                    <span className="text-[11px] text-white/30">/100</span>
                    <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden ml-2">
                      <div
                        className={`h-full rounded-full ${r.primary ? 'bg-purple-400' : 'bg-white/30'}`}
                        style={{ width: `${r.value}%` }}
                      />
                    </div>
                  </>
                ) : (
                  <span className="text-xs text-white/30 italic">&mdash;</span>
                )}
              </div>
              <span className="text-[11px] text-white/35 w-28 text-right flex-shrink-0">{r.note}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * @param {number|null} conf
 * @param {string} label
 * @returns {string}
 */
function confidenceNote(conf, label) {
  if (conf == null) return ''
  if (conf >= 85) return `High-confidence ${label}`
  if (conf >= 70) return label.charAt(0).toUpperCase() + label.slice(1)
  if (conf >= 55) return `Limited ${label}`
  return `Low-confidence ${label}`
}
