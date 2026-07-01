// Lists tab — real lists. Visitors only receive public lists (filtered in the data hook). Shows
// real save counts + a save button (visitor). Saves reuse user_list_follows. No fabricated saves.
import { Link } from 'react-router-dom'
import { tmdbImg } from '@/shared/api/tmdb'

export default function DnaListsTab({ lists = [], visible = true, isOwner, social }) {
  if (!visible && !isOwner) return <div className="dna__shell dna__section"><p className="dna-empty">This member’s lists are private.</p></div>
  return (
    <section className="dna__section">
      <div className="dna__shell">
        <div className="dna__section-head"><div><p className="dna__eyebrow">Curated</p><h2>Lists with a point of view.</h2></div><p>Not shelves — small arguments about cinema.</p></div>
        {lists.length === 0 ? <p className="dna-empty">No {isOwner ? '' : 'public '}lists yet.</p> : (
          <div className="dna-listgrid">
            {lists.map((l) => {
              const save = social?.saveFor?.(l.id) || { count: 0, mine: false }
              return (
                <Link to={`/lists/${l.id}`} className="dna-list-card" key={l.id}>
                  {l.posters?.length ? (
                    <div className="dna-list-card__posters" aria-hidden="true">
                      {l.posters.slice(0, 4).map((p, i) => p ? <img key={i} src={tmdbImg(p, 'w185')} alt="" loading="lazy" /> : <span key={i} />)}
                    </div>
                  ) : null}
                  <div className="dna-list-card__scrim" aria-hidden="true" />
                  <div className="dna-list-card__copy">
                    <h3>{l.title}</h3>
                    <p>
                      <span>{l.count} film{l.count === 1 ? '' : 's'}{isOwner ? ` · ${l.isPublic ? 'Public' : 'Private'}` : ''}</span>
                      {social?.canAct
                        ? <button type="button" className={`dna-count-btn${save.mine ? ' is-on' : ''}`} aria-pressed={save.mine} onClick={(e) => { e.preventDefault(); social.toggleListSave(l.id) }}>{save.mine ? 'Saved' : 'Save'} · {save.count}</button>
                        : (save.count > 0 ? <span>{save.count} saved</span> : null)}
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
