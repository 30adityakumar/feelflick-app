// "Why follow …" — grounded reputation with REAL social proof (counts start at 0). Left: the
// member's DNA "known for" traits, each endorsable ("Trust too") with a real count. Right: real
// influence — endorsements/likes/saves received + followers. NO fabricated testimonials or
// recommendation-attribution numbers.
export default function DnaReputation({ firstName, isOwner, knownFor = [], directors = [], social, followers = 0 }) {
  const traits = knownFor.slice(0, 5)
  const totals = social?.totals || { endorsementsReceived: 0, reviewLikesReceived: 0, listSavesReceived: 0 }
  const eyebrow = isOwner ? 'Your taste reputation' : `Why follow ${firstName || 'them'}`
  const knownTitle = isOwner ? 'What you’re known for' : `What ${firstName || 'they'} is known for`
  return (
    <section className="dna__section dna__section--soft" aria-label="Reputation">
      <div className="dna__shell">
        <div className="dna__section-head">
          <div><p className="dna__eyebrow">{eyebrow}</p><h2>A taste people rely on.</h2></div>
          <p>Reputation comes from real members who endorse, like or save — not a hidden percentile.</p>
        </div>
        <div className="dna-rep">
          <div className="dna-rep__card">
            <h3>{knownTitle}</h3>
            {traits.length ? (
              <div className="dna-rep__list">
                {traits.map((trait) => {
                  const e = social?.endorseFor?.(trait) || { count: 0, mine: false }
                  return (
                    <div className="dna-rep__row" key={trait}>
                      <div><strong>{trait}</strong><span>{e.count} {e.count === 1 ? 'member endorses' : 'members endorse'} this</span></div>
                      {social?.canAct
                        ? <button type="button" className={`dna-endorse${e.mine ? ' is-on' : ''}`} aria-pressed={e.mine} onClick={() => social.toggleEndorse(trait)}>{e.mine ? 'Trusted' : 'Trust too'}</button>
                        : null}
                    </div>
                  )
                })}
              </div>
            ) : <p className="dna-empty">Their signature is still forming.</p>}
            {directors.slice(0, 3).length ? (
              <div style={{ marginTop: 16 }}>
                <p className="dna__eyebrow" style={{ marginBottom: 8 }}>Directors they return to</p>
                {directors.slice(0, 3).map((d) => (
                  <div className="dna-rep__row" key={d.name}><strong style={{ fontSize: '.85rem' }}>{d.name}</strong><span className="dna__muted" style={{ marginLeft: 'auto', fontSize: '.67rem' }}>{d.films} films{d.avg != null ? ` · ${d.avg.toFixed(1)}★` : ''}</span></div>
                ))}
              </div>
            ) : null}
          </div>
          <aside className="dna-rep__card">
            <h3>{isOwner ? 'Your' : 'Their'} cinematic influence</h3>
            <div className="dna-rep__grid">
              <div className="dna-rep__stat"><strong>{totals.endorsementsReceived}</strong><span>trait endorsements received</span></div>
              <div className="dna-rep__stat"><strong>{totals.reviewLikesReceived}</strong><span>review likes received</span></div>
              <div className="dna-rep__stat"><strong>{totals.listSavesReceived}</strong><span>list saves received</span></div>
              <div className="dna-rep__stat"><strong>{followers ?? 0}</strong><span>followers</span></div>
            </div>
            <p className="dna__muted" style={{ marginTop: 12, fontSize: '.64rem' }}>Real member activity — every count starts at zero and grows only from genuine endorsements, likes and saves.</p>
          </aside>
        </div>
      </div>
    </section>
  )
}
