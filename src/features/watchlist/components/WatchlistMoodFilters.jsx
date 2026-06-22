// src/features/watchlist/components/WatchlistMoodFilters.jsx
// Collection-derived mood filter: "All" + the top-N most-common moods as pills, the rest under a
// labelled "More" select. N = 3 (≥361px) or 2 (≤360px). Only moods present in the collection ever
// appear (no zero-result filter). The active mood is always represented, even after a resize.

import { useEffect, useState } from 'react'
import { splitMoods } from '../derive/watchlistDerive'

function useCompactPhone() {
  const q = '(max-width: 360px)'
  const get = () => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(q).matches : false)
  const [compact, setCompact] = useState(get)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined
    const mq = window.matchMedia(q)
    const on = () => setCompact(mq.matches)
    on(); mq.addEventListener?.('change', on)
    return () => mq.removeEventListener?.('change', on)
  }, [])
  return compact
}

export default function WatchlistMoodFilters({ availableMoods, activeMood, onSelect }) {
  const compact = useCompactPhone()
  const { primary, extra } = splitMoods(availableMoods, { topN: compact ? 2 : 3, activeMood: activeMood === 'all' ? null : activeMood })
  const extraActive = extra.includes(activeMood)

  return (
    <div className="ff-wl-filters" role="group" aria-label="Filter by film mood">
      <button
        type="button"
        className={`ff-wl-filter${activeMood === 'all' ? ' ff-wl-filter--active' : ''}`}
        aria-pressed={activeMood === 'all'}
        onClick={() => onSelect('all')}
      >All</button>
      {primary.map((mood) => (
        <button
          key={mood}
          type="button"
          className={`ff-wl-filter${activeMood === mood ? ' ff-wl-filter--active' : ''}`}
          aria-pressed={activeMood === mood}
          onClick={() => onSelect(mood)}
        >{mood}</button>
      ))}
      {extra.length ? (
        <label className="ff-wl-more">
          <span className="sr-only">More moods</span>
          <select
            className={`ff-wl-filter ff-wl-more__select${extraActive ? ' ff-wl-filter--active' : ''}`}
            aria-label="More moods"
            value={extraActive ? activeMood : ''}
            onChange={(e) => { if (e.target.value) onSelect(e.target.value) }}
          >
            <option value="">More</option>
            {extra.map((mood) => <option key={mood} value={mood}>{mood}</option>)}
          </select>
        </label>
      ) : null}
    </div>
  )
}
