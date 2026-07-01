// Films tab — real canonical watched-film grid with poster/title/rating + a simple sort.
import { useMemo, useState } from 'react'
import DnaPoster from './DnaPoster'

export default function DnaFilmsTab({ films = [], visible = true, isOwner }) {
  const [sort, setSort] = useState('recent')
  const sorted = useMemo(() => {
    const arr = [...films]
    if (sort === 'rating') arr.sort((a, b) => (b.rating ?? -1) - (a.rating ?? -1))
    else arr.sort((a, b) => new Date(b.watchedAt || 0) - new Date(a.watchedAt || 0))
    return arr
  }, [films, sort])

  if (!visible && !isOwner) return <div className="dna__shell dna__section"><p className="dna-empty">This member’s films are private.</p></div>
  return (
    <section className="dna__section">
      <div className="dna__shell">
        <div className="dna__section-head">
          <div><p className="dna__eyebrow">{films.length} watched</p><h2>The film library.</h2></div>
          <div>
            <label className="dna__muted" style={{ fontSize: '.72rem', marginRight: 8 }} htmlFor="dna-films-sort">Sort</label>
            <select id="dna-films-sort" value={sort} onChange={(e) => setSort(e.target.value)} style={{ padding: '8px 10px', borderRadius: 10, background: 'var(--color-surface-2,#222427)', color: 'var(--color-text-primary,#f5f2eb)', border: '1px solid var(--color-border-subtle,#3a3d41)' }}>
              <option value="recent">Recently watched</option>
              <option value="rating">Highest rated</option>
            </select>
          </div>
        </div>
        {sorted.length === 0 ? <p className="dna-empty">No films logged yet.</p> : (
          <div className="dna-filmgrid">
            {sorted.map((m) => <DnaPoster key={m.id} movie={m} showRating showTitle />)}
          </div>
        )}
      </div>
    </section>
  )
}
