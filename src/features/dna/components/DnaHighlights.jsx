// Horizontal cinematic Highlights — each opens an accessible story viewer. Only real-backed
// categories are shown (the hook filters to categories with backing rows).
import { tmdbImg } from '@/shared/api/tmdb'

export default function DnaHighlights({ highlights = [], onOpen }) {
  if (!highlights.length) return null
  return (
    <section className="dna__section" style={{ borderTop: 0, paddingBlock: 20 }} aria-label="Highlights">
      <div className="dna__shell">
        <div className="dna-highlights">
          {highlights.map((h) => {
            const cover = h.items?.find((it) => it.posterPath)
            const label = h.title || h.label
            return (
              <button key={h.key} type="button" className="dna-highlight" onClick={() => onOpen(h)} aria-label={`Open highlight: ${label}`}>
                <span className="dna-highlight__ring">
                  <span className="dna-highlight__inner">
                    {cover ? <img src={tmdbImg(cover.posterPath, 'w154')} alt="" loading="lazy" /> : <span aria-hidden="true">{(label || '?').charAt(0)}</span>}
                  </span>
                </span>
                <span>{label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}
