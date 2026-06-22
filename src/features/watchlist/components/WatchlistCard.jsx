// src/features/watchlist/components/WatchlistCard.jsx
// One saved-film card = exactly ONE Film File link (poster + title, routed by TMDB id) + ONE
// Remove action (a poster-overlay control, a sibling of the link — never nested inside it).
// Rows without a TMDB id render non-interactively (no broken link). Mood colour is intentionally
// restrained (single ivory tone) per the Adaptive Editorial Cinema foundation.

import { Link } from 'react-router-dom'
import MoodPill from '@/shared/components/MoodPill'

const MOOD_TONE = 'var(--ts-text-secondary, #beb8ad)'

function Poster({ f }) {
  if (f.poster) {
    return <img className="ff-wl-card__img" src={f.poster} alt="" loading="lazy" decoding="async" />
  }
  return <span className="ff-wl-card__noart">{f.title}</span>
}

export default function WatchlistCard({ f, onRemove, isRemoving }) {
  const busy = isRemoving(f.id)
  const metaParts = [f.year || null, f.runtime ? `${f.runtime}m` : null, f.dir && f.dir !== '—' ? f.dir : null].filter(Boolean)
  const inner = (
    <>
      <span className="ff-wl-card__poster" aria-hidden="true"><Poster f={f} /></span>
      <h3 className="ff-wl-card__title">{f.title}</h3>
    </>
  )
  return (
    <article className="ff-wl-card" role="listitem">
      <div className="ff-wl-card__frame">
        {f.tmdbId ? (
          <Link to={`/movie/${f.tmdbId}`} className="ff-wl-card__link">{inner}</Link>
        ) : (
          <div className="ff-wl-card__link ff-wl-card__link--static">{inner}</div>
        )}
        <button
          type="button"
          data-library-action="remove"
          data-library-item-id={f.id}
          data-library-view="grid"
          disabled={busy}
          aria-busy={busy || undefined}
          aria-label={busy ? `Removing ${f.title}` : `Remove ${f.title} from Watchlist`}
          title="Remove from Watchlist"
          onClick={(e) => onRemove(f, e.currentTarget)}
          className="ff-wl-card__remove"
          style={{ minHeight: 44 }}
        >
          <span className="ff-wl-card__remove-chip" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M7 7l10 10M17 7 7 17" /></svg>
          </span>
        </button>
      </div>
      <div className="ff-wl-card__meta">
        {metaParts.length ? <span className="ff-wl-card__metaline">{metaParts.join(' · ')}</span> : null}
        <span className="ff-wl-card__tags">
          {f.mood && f.mood !== 'Mixed' ? <MoodPill label={f.mood} color={MOOD_TONE} dot role="img" aria-label={`Film mood: ${f.mood}`} /> : null}
          <span className="ff-wl-card__saved">{f.savedLabel}</span>
        </span>
      </div>
    </article>
  )
}
