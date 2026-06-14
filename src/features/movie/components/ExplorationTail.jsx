// src/features/movie/components/ExplorationTail.jsx
// F5.6 — consolidates the two exploration shelves (Pairs With + Director Shelf) into
// ONE restrained, collapsed-by-default disclosure. Browse stays the primary
// exploration surface; this is a quiet "a few nearby films" tail.
//
// Removed vs the old PairsWith: the seeded reshuffle / "Show me more" / circular
// cycling / per-card entry animation. We render a DETERMINISTIC bounded set in the
// source array's existing order — no randomise / seed / re-rank / mutate / sort.
// No match percentages, no recommendation-confidence labels. The underlying similar
// + director arrays + their ordering are unchanged (presentation only).

import FilmFileDisclosure from './FilmFileDisclosure'
import { HP, ROSE, RADIUS } from '../data'

const MAX = 4

function PosterButton({ title, year, dir, why, yourRating, poster, tmdbId, onOpenMovie }) {
  return (
    <button
      type="button"
      onClick={() => onOpenMovie?.(tmdbId)}
      aria-label={`Open ${title}${year ? ` (${year})` : ''}`}
      className="ff-movie-explore-card"
    >
      <div style={{ position: 'relative', borderRadius: RADIUS.sm, overflow: 'hidden', marginBottom: 12, boxShadow: '0 12px 28px -10px rgba(0,0,0,0.5)' }}>
        {/* poster is decorative — the title is adjacent + the button is named */}
        <img src={poster} alt="" style={{ width: '100%', aspectRatio: '2/3', objectFit: 'cover', display: 'block' }} onError={(e) => { e.currentTarget.style.display = 'none' }} />
        {Number.isFinite(yourRating) && yourRating > 0 && (
          <div aria-label={`Your rating: ${yourRating} out of 5`} style={{ position: 'absolute', top: 8, right: 8, padding: '3px 7px', borderRadius: 3, background: 'rgba(0,0,0,0.85)', border: `1px solid ${HP.amber}55`, fontSize: 9, fontWeight: 700, color: HP.amber, fontFamily: 'Inter, sans-serif', letterSpacing: '0.06em' }}>{yourRating}★ YOU</div>
        )}
      </div>
      <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: HP.text, letterSpacing: '-0.015em' }}>{title}</div>
      <div style={{ fontSize: 11, color: HP.textMuted, fontFamily: 'Inter, sans-serif', letterSpacing: '0.04em', marginTop: 3 }}>
        {year}{dir ? ` · ${dir}` : ''}
      </div>
      {why && (
        <span style={{ display: 'block', marginTop: 8, fontSize: 12, lineHeight: 1.5, color: HP.textSoft, fontFamily: 'Inter, sans-serif', fontStyle: 'italic' }}>{why}</span>
      )}
    </button>
  )
}

function Subsection({ kicker, children }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: ROSE, margin: '0 0 16px 0' }}>{kicker}</div>
      <div className="ff-movie-explore-grid">{children}</div>
    </div>
  )
}

/**
 * @param {object} props
 * @param {Array} [props.similar]         similar-film entries (existing order)
 * @param {Array} [props.directorFilms]   director-shelf entries (existing order)
 * @param {string} [props.directorName]
 * @param {string|number|null} [props.directorId]
 * @param {function} props.onOpenMovie
 */
export default function ExplorationTail({ similar = [], directorFilms = [], directorName, directorId, onOpenMovie }) {
  const sims = Array.isArray(similar) ? similar.slice(0, MAX) : []
  const dirs = Array.isArray(directorFilms) ? directorFilms.slice(0, MAX) : []
  if (sims.length === 0 && dirs.length === 0) return null

  const directorHeading = directorName && directorName !== '—'
    ? `More from ${directorName}`
    : 'More from the director'

  return (
    <FilmFileDisclosure
      className="ff-movie-exploration-tail"
      heading="Explore from here"
      copy="A few nearby films—similar in spirit or from the same director."
      defaultOpen={false}
    >
      {sims.length > 0 && (
        <Subsection kicker="Similar in spirit">
          {sims.map((s) => (
            <PosterButton key={s.key ?? s.tmdbId} title={s.title} year={s.year} dir={s.dir} why={s.why} poster={s.poster} tmdbId={s.tmdbId} onOpenMovie={onOpenMovie} />
          ))}
        </Subsection>
      )}

      {dirs.length > 0 && (
        <Subsection kicker={directorHeading}>
          {dirs.map((f) => (
            <PosterButton key={f.tmdbId} title={f.title} year={f.year} poster={f.poster} yourRating={f.yourRating} tmdbId={f.tmdbId} onOpenMovie={onOpenMovie} />
          ))}
        </Subsection>
      )}

      {/* F5.6: the "NEW TO YOU" badge was dropped — its source (no rating row) is not
          a genuine watch-history signal, so it could mislead. Deferred until a
          history-backed seen/unseen field exists (documented in the policy doc). */}

      {directorId && (
        <a
          href={`https://www.themoviedb.org/person/${directorId}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: 'inline-flex', marginTop: 8, padding: '9px 16px', borderRadius: RADIUS.pill, background: 'transparent', border: `1px solid ${HP.border}`, color: HP.textSoft, fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', textDecoration: 'none' }}
        >
          Full filmography <span aria-hidden="true"> ↗</span><span className="sr-only"> (opens in a new tab)</span>
        </a>
      )}
    </FilmFileDisclosure>
  )
}
