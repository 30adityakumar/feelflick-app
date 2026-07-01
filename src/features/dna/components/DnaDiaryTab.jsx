// Diary tab — chronological watch trail. Gated by diaryPublic for visitors.
import { Link } from 'react-router-dom'
import { tmdbImg } from '@/shared/api/tmdb'
import { starString } from './DnaPoster'

function fmtDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function DnaDiaryTab({ diary = [], visible = true, isOwner }) {
  if (!visible && !isOwner) return <div className="dna__shell dna__section"><p className="dna-empty">This member’s diary is private.</p></div>
  return (
    <section className="dna__section">
      <div className="dna__shell">
        <div className="dna__section-head"><div><p className="dna__eyebrow">Diary</p><h2>The recent watch trail.</h2></div><p>A chronological record of films and ratings.</p></div>
        {diary.length === 0 ? <p className="dna-empty">No films logged yet.</p> : (
          <div>
            {diary.slice(0, 100).map((m) => (
              <div className="dna-diary__row" key={`${m.id}-${m.watchedAt}`}>
                <span className="dna-diary__date">{fmtDate(m.watchedAt)}</span>
                <Link to={m.id != null ? `/movie/${m.id}` : '#'} className="dna-poster" style={{ width: 42 }} aria-label={m.title}>
                  {m.posterPath ? <img src={tmdbImg(m.posterPath, 'w154')} alt="" loading="lazy" /> : <span className="dna-poster__fallback">{m.title}</span>}
                </Link>
                <div><strong style={{ fontSize: '.85rem' }}>{m.title}</strong>{m.year ? <span className="dna__muted" style={{ fontSize: '.66rem', display: 'block' }}>{m.year}</span> : null}</div>
                <span className="dna-stars">{m.rating != null ? starString(Math.round((m.rating / 2) * 2) / 2) : ''}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
