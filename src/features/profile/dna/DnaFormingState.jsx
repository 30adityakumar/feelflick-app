// src/features/profile/dna/DnaFormingState.jsx
// Honest forming hero: no archetype, no signature prose, no director trust, no journey, no mature
// passport. Shows what is known (factual counts), what is still needed, and a route to Tonight.
// Keeps the cinematic composition with a sparse, honest state (not a generic empty card).

export default function DnaFormingState({ identity }) {
  const { facts } = identity
  return (
    <section className="ff-dna-hero" aria-labelledby="ff-dna-h1">
      <div className="ff-dna-hero__scrim" aria-hidden="true" />
      <div className="ff-dna-grain" aria-hidden="true" />
      <div className="ff-dna__shell ff-dna-forming">
        <div className="ff-dna-forming__inner">
          <div className="ff-dna-hero__status">
            <p className="ff-dna-eyebrow">Cinematic DNA</p>
            <span className="ff-dna-pill"><i className="ff-dna-private-dot" aria-hidden="true" />Private</span>
          </div>
          <h1 id="ff-dna-h1">Your Cinematic DNA is still forming.</h1>
          <p>Log and rate a few films, and FeelFlick starts reading your taste — the moods you return to, the filmmakers you trust, and how strongly you respond.</p>
          {facts.length > 0 ? (
            <div className="ff-dna-forming__facts">
              {facts.map((f) => <span key={f} className="ff-dna-pill">{f}</span>)}
            </div>
          ) : null}
          <div className="ff-dna-forming__need">
            What sharpens the portrait next: <strong style={{ color: 'var(--text-2)' }}>watch and log a few more films</strong>, rate the ones that moved you, and react to your nightly pick. The more evidence FeelFlick has, the more personal — never just &ldquo;more correct&rdquo; — your portrait becomes.
          </div>
          <div className="ff-dna-forming__actions">
            <a className="ff-dna-btn ff-dna-btn--primary" href="/home">See tonight&rsquo;s pick</a>
            <a className="ff-dna-btn ff-dna-btn--ghost" href="/browse">Browse films</a>
          </div>
        </div>
      </div>
    </section>
  )
}
