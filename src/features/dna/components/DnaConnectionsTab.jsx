// Connections tab — real taste-similar people + following. Gated by connectionsPublic for visitors.
import { Link } from 'react-router-dom'

function Avatar({ name }) {
  return <div className="dna-conn-card__avatar" aria-hidden="true">{(name || '?').charAt(0).toUpperCase()}</div>
}

export default function DnaConnectionsTab({ connections = {}, visible = true, isOwner }) {
  if (!visible && !isOwner) return <div className="dna__shell dna__section"><p className="dna-empty">This member’s connections are private.</p></div>
  const strongest = connections.strongest || []
  const following = connections.following || []
  return (
    <section className="dna__section">
      <div className="dna__shell">
        <div className="dna__section-head"><div><p className="dna__eyebrow">Connections</p><h2>People near this taste.</h2></div><p>Similarity is useful when it creates shared films and better conversations.</p></div>

        {strongest.length === 0 && following.length === 0 ? (
          <p className="dna-empty">No connections to show yet.</p>
        ) : (
          <>
            {strongest.length > 0 && (
              <>
                <p className="dna__eyebrow" style={{ marginBottom: 12 }}>Closest in taste</p>
                <div className="dna-conngrid">
                  {strongest.map((p) => (
                    <Link to={`/profile/${p.id}`} className="dna-conn-card" key={p.id}>
                      <Avatar name={p.name} />
                      <div><strong style={{ fontSize: '.85rem' }}>{p.name}</strong>{p.filmsInCommon != null ? <p className="dna__muted" style={{ fontSize: '.66rem', margin: '3px 0 0' }}>{p.filmsInCommon} films in common</p> : null}</div>
                      {p.overlap != null ? <span className="dna-conn-card__match">{p.overlap}%</span> : null}
                    </Link>
                  ))}
                </div>
              </>
            )}
            {following.length > 0 && (
              <>
                <p className="dna__eyebrow" style={{ margin: '22px 0 12px' }}>Following</p>
                <div className="dna-conngrid">
                  {following.map((p) => (
                    <Link to={`/profile/${p.id}`} className="dna-conn-card" key={p.id}>
                      <Avatar name={p.name} />
                      <div><strong style={{ fontSize: '.85rem' }}>{p.name}</strong></div>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </section>
  )
}
