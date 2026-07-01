// Accessible highlight/story viewer (built on the shared Modal: focus trap, Escape, restore).
// Next/previous cycle through the available highlights; real posters only.
import Modal from '@/shared/ui/Modal'
import { tmdbImg } from '@/shared/api/tmdb'

export default function DnaHighlightViewer({ open, highlights = [], index = 0, onIndex, onClose }) {
  const h = highlights[index]
  if (!h) return null
  const label = h.title || h.label
  const go = (delta) => {
    const n = (index + delta + highlights.length) % highlights.length
    onIndex(n)
  }
  return (
    <Modal open={open} onClose={onClose} label={`Highlight: ${label}`} size="md">
      <div className="dna-dialog">
        <div className="dna-dialog__head">
          <h3>{label}</h3>
          <button type="button" className="dna-iconbtn" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="dna-story">
          <div className="dna-story__bars" aria-hidden="true">
            {highlights.map((_, i) => <i key={i} className={i === index ? 'is-active' : ''} />)}
          </div>
          <div>
            <p className="dna__eyebrow">{h.items?.length || 0} film{(h.items?.length || 0) === 1 ? '' : 's'}</p>
            <h4>{label}</h4>
            <div className="dna-story__posters">
              {(h.items || []).slice(0, 8).map((m) => (
                <div className="dna-poster" key={m.id}>
                  {m.posterPath ? <img src={tmdbImg(m.posterPath, 'w342')} alt={m.title} loading="lazy" /> : <span className="dna-poster__fallback">{m.title}</span>}
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
            <button type="button" className="dna-btn dna-btn--secondary" onClick={() => go(-1)} disabled={highlights.length < 2}>Previous</button>
            <button type="button" className="dna-btn dna-btn--secondary" onClick={() => go(1)} disabled={highlights.length < 2}>Next</button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
