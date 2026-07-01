// Compact Cinematic DNA strip — archetype (or honest forming state), grounded tags, evidence
// counts, a button to open the DNA tab, and (owner only) a link to the full /DNA dossier.
import { Link } from 'react-router-dom'

export default function DnaSignature({ dna, stats, isOwner, onOpenDna }) {
  const title = dna.forming
    ? (dna.title?.lead || 'Cinematic DNA still forming')
    : [dna.archetype?.[0], dna.archetype?.[1]].filter(Boolean).join(' · ') || 'Cinematic DNA'
  const sub = dna.forming
    ? 'Not enough films logged yet — the portrait sharpens as more are watched and rated.'
    : (dna.line || 'A portrait built from real watches and ratings.')
  return (
    <section className="dna__section" style={{ borderTop: 0, paddingTop: 22 }} aria-label="Cinematic DNA summary">
      <div className="dna__shell">
        <div className="dna-strip">
          <div className="dna-strip__mark" aria-hidden="true">DNA</div>
          <div>
            <div className="dna-strip__title">{title}</div>
            <p className="dna-strip__sub">{sub}</p>
            {!dna.forming && dna.tags?.length ? (
              <div className="dna-strip__tags">{dna.tags.map((t) => <span key={t} className="dna-tag">{t}</span>)}</div>
            ) : null}
            <p className="dna-strip__sub" style={{ marginTop: 8 }}>
              {stats.filmsWatched} watched · {stats.reviews} reviews
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button type="button" className="dna-btn dna-btn--secondary" onClick={onOpenDna}>View Cinematic DNA</button>
            {isOwner ? <Link className="dna-btn dna-btn--ghost" to="/DNA">Full Cinematic DNA</Link> : null}
          </div>
        </div>
      </div>
    </section>
  )
}
