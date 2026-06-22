// src/features/history/components/DiaryRow.jsx
// One canonical Diary entry (one film, latest valid watch). Exactly ONE Film File link and ONE
// Remove action per row.
//
// The Film File link combines poster + title: the title is the real <Link> (accessible name
// "Open <title>"), and a stretched ::after extends its hit area across the poster + entry body
// (see history.css). The interactive body bits (none here) and the end controls are lifted above
// that overlay so Remove stays clickable. When there's no TMDB id the row renders non-interactively
// (poster + title as plain text) but keeps Remove.

import { Link } from 'react-router-dom'
import MoodPill from '@/shared/components/MoodPill'

function Stars({ n }) {
  if (!n) return null
  return (
    <span className="ff-diary-row__stars" role="img" aria-label={`${n} of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width="13" height="13" viewBox="0 0 24 24" aria-hidden="true"
          fill={i <= n ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6">
          <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 17.9 6.8 19.6l1-5.8-4.3-4.1 5.9-.9z" />
        </svg>
      ))}
    </span>
  )
}

function formatRuntime(min) {
  if (!min || min <= 0) return ''
  const h = Math.floor(min / 60)
  const m = min % 60
  return h ? `${h}h ${m}m` : `${m}m`
}

export default function DiaryRow({ entry, onRemove, isRemoving, showWatchedDate = false }) {
  const e = entry
  const runtime = formatRuntime(e.runtime)
  const poster = e.poster ? (
    <img className="ff-diary-row__img" src={e.poster} alt="" loading="lazy" decoding="async" width="64" height="96" />
  ) : (
    <span className="ff-diary-row__img ff-diary-row__img--empty" aria-hidden="true" />
  )
  const sub = [e.year, e.dir && e.dir !== '—' ? e.dir : null].filter(Boolean).join(' · ')

  return (
    <article role="listitem" className="ff-diary-row">
      <div className="ff-diary-row__poster">{poster}</div>
      <div className="ff-diary-row__main">
        {e.tmdbId ? (
          <Link to={`/movie/${e.tmdbId}`} className="ff-diary-row__title-link" aria-label={`Open ${e.title}`}>
            <h3 className="ff-diary-row__title">{e.title}</h3>
          </Link>
        ) : (
          <h3 className="ff-diary-row__title ff-diary-row__title--static">{e.title}</h3>
        )}
        {sub ? <p className="ff-diary-row__sub">{sub}</p> : null}
        {(e.rating > 0 || e.filmMood) ? (
          <div className="ff-diary-row__signals">
            <Stars n={e.rating} />
            {e.filmMood ? (
              <MoodPill label={e.filmMood} color={e.moodHex} dot role="img" aria-label={`Film mood: ${e.filmMood}`} />
            ) : null}
          </div>
        ) : null}
        {e.review ? (
          <div className="ff-diary-row__review">
            <span className="ff-diary-row__review-label">Your review</span>
            <blockquote className="ff-diary-row__review-text">{e.review}</blockquote>
          </div>
        ) : null}
        {showWatchedDate ? <p className="ff-diary-row__watched">{e.watchedLabel}</p> : null}
      </div>
      <div className="ff-diary-row__end">
        {runtime ? <span className="ff-diary-row__runtime">{runtime}</span> : null}
        <button
          type="button"
          className="ff-diary-row__remove"
          style={{ minWidth: 44, minHeight: 44 }}
          aria-label={isRemoving ? `Removing ${e.title}` : `Remove ${e.title} from Diary`}
          aria-busy={isRemoving || undefined}
          disabled={isRemoving}
          data-library-action="remove"
          data-library-item-id={e.id}
          data-library-view="diary"
          onClick={() => onRemove(e)}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
            <path d="M4 7h16M9 7V5h6v2M7 7l1 13h8l1-13" />
          </svg>
        </button>
      </div>
    </article>
  )
}
