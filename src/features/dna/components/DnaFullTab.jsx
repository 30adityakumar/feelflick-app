// DNA tab — the deeper portrait in the prototype's .dna-full layout: portrait card (archetype +
// line + real trait lines) + evidence-numbers sidebar. Reuses existing DNA derivations. Real only;
// omits any line that can't be derived. Owner gets a link to the full /DNA dossier.
import { Link } from 'react-router-dom'

export default function DnaFullTab({ dna, moods = [], directors = [], ratingLanguage, currentChapter, emergingEdge, stats, joinedAt, isOwner, firstName }) {
  const years = joinedAt ? Math.max(1, new Date().getFullYear() - new Date(joinedAt).getFullYear()) : null
  const lines = [
    dna.archetype?.length ? { k: 'Stable core', v: dna.archetype.slice(0, 3).join(' · ') } : null,
    currentChapter?.title ? { k: 'Current chapter', v: currentChapter.title } : null,
    emergingEdge ? { k: 'Emerging edge', v: emergingEdge } : null,
    directors[0] ? { k: 'Most returned to', v: `${directors[0].name} · ${directors[0].films} films` } : null,
  ].filter(Boolean)

  return (
    <section className="dna__section">
      <div className="dna__shell">
        <div className="dna__section-head"><div><p className="dna__eyebrow">Cinematic DNA</p><h2>{dna.forming ? 'Still forming.' : 'The deeper portrait.'}</h2></div><p>Built from real watches and ratings — always evolving and correctable.</p></div>

        {dna.forming ? (
          <p className="dna-empty">Not enough films logged yet — the portrait sharpens as more are watched and rated.</p>
        ) : (
          <div className="dna-full">
            <div className="dna-full__card">
              <p className="dna__eyebrow">{isOwner ? 'Your' : `${firstName || 'Their'}’s`} current portrait</p>
              <h2 className="dna-full__title">{[dna.archetype?.[0], dna.archetype?.[1]].filter(Boolean).join(' · ') || 'Cinematic DNA'}</h2>
              <p className="dna__muted" style={{ maxWidth: 620, lineHeight: 1.6, marginTop: 10 }}>{dna.line}</p>
              {moods.length ? <div className="dna-strip__tags" style={{ marginTop: 14 }}>{moods.slice(0, 6).map((m) => <span key={m.name} className="dna-tag">{m.name}</span>)}</div> : null}
              <div style={{ marginTop: 20 }}>
                {lines.map((l) => <div className="dna-line" key={l.k}><strong>{l.k}</strong><span>{l.v}</span></div>)}
              </div>
              {isOwner ? <div style={{ marginTop: 18 }}><Link className="dna-btn dna-btn--secondary" to="/DNA">Open Full Cinematic DNA</Link></div> : null}
            </div>
            <aside className="dna-full__card">
              <p className="dna__eyebrow">Built from</p>
              <div className="dna-evnum"><strong>{stats.filmsWatched}</strong><span>watched films</span></div>
              <div className="dna-evnum"><strong>{stats.reviews}</strong><span>reviews written</span></div>
              {years ? <div className="dna-evnum"><strong>{years} year{years === 1 ? '' : 's'}</strong><span>of remembered choices</span></div> : null}
              {ratingLanguage?.eligible ? <div className="dna-evnum"><strong>{ratingLanguage.averageStars.toFixed(1)}★</strong><span>average across {ratingLanguage.count} ratings — {ratingLanguage.interpret}</span></div> : null}
            </aside>
          </div>
        )}
      </div>
    </section>
  )
}
