import { HP as HP_BASE, RADIUS } from '../data'

const HP = {
  ...HP_BASE,
  panel: 'var(--ts-surface-1, #1d1814)',
  border: 'var(--ts-border-subtle, #302c28)',
  borderStrong: 'var(--ts-border-strong, #46423d)',
  text: 'var(--ts-text-primary, #f3ecdf)',
  textSoft: 'var(--ts-text-secondary, #beb8ad)',
  textMuted: 'var(--ts-text-muted, #8d887f)',
  textFaint: 'var(--ts-text-muted, #8d887f)',
}

const MAX = 5

function PosterButton({ title, year, dir, why, yourRating, poster, tmdbId, onOpenMovie }) {
  return (
    <button
      type="button"
      onClick={() => onOpenMovie?.(tmdbId)}
      aria-label={`Open ${title}${year ? ` (${year})` : ''}`}
      className="ff-movie-explore-card"
    >
      <div style={{ position: 'relative', borderRadius: RADIUS.sm, overflow: 'hidden', marginBottom: 12, boxShadow: '0 12px 28px -10px rgba(0,0,0,0.5)' }}>
        <img src={poster} alt="" style={{ width: '100%', aspectRatio: '2/3', objectFit: 'cover', display: 'block' }} onError={(e) => { e.currentTarget.style.display = 'none' }} />
        {Number.isFinite(yourRating) && yourRating > 0 && (
          <div aria-label={`Your rating: ${yourRating} out of 10`} style={{ position: 'absolute', top: 8, right: 8, padding: '3px 7px', borderRadius: 3, background: 'rgba(0,0,0,0.85)', border: `1px solid ${HP.amber}55`, fontSize: 9, fontWeight: 700, color: HP.amber, fontFamily: 'Inter, sans-serif', letterSpacing: '0.06em' }}>{yourRating}★ YOU</div>
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

/**
 * @param {object} props
 * @param {Array} [props.similar]         similar-film entries (existing order)
 * @param {Array} [props.directorFilms]   director-shelf entries (existing order)
 * @param {string} [props.directorName]
 * @param {string|number|null} [props.directorId]
 * @param {function} props.onOpenMovie
 */
export default function ExplorationTail({ similar = [], directorFilms = [], onOpenMovie }) {
  const sims = Array.isArray(similar) ? similar.slice(0, MAX) : []
  const dirs = Array.isArray(directorFilms) ? directorFilms.slice(0, MAX - sims.length) : []
  const films = [...sims, ...dirs]
  if (films.length === 0) return null

  return (
    <section className="ff-movie-section ff-movie-exploration-tail" style={{ padding: '56px 88px', borderTop: `1px solid ${HP.border}` }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--ts-text-secondary, #beb8ad)', marginBottom: 14, display: 'inline-flex', alignItems: 'center', gap: 10 }}>
        <span style={{ height: 1, width: 22, background: 'var(--ts-border-strong, #46423d)', opacity: 0.6 }} />Continue the thread
      </div>
      <div className="ff-movie-explore-grid">
        {films.map((f, i) => (
          <PosterButton
            key={f.key ?? f.tmdbId ?? i}
            title={f.title}
            year={f.year}
            dir={f.dir}
            why={f.why}
            poster={f.poster}
            yourRating={f.yourRating}
            tmdbId={f.tmdbId}
            onOpenMovie={onOpenMovie}
          />
        ))}
      </div>
    </section>
  )
}
