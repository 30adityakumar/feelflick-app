// src/features/browse/components/BrowseCuriosityPaths.jsx
// "Start somewhere" — meaningful entry points into the catalogue (NOT a
// recommendation feed). Presentational: the container derives the paths
// (useCuriosityPaths) and owns selection (each path writes filters to the URL).
// Personal paths carry a personal kicker; editorial paths a neutral one. Renders
// nothing when no credible path qualifies; renders fewer than six rather than
// fabricate.

import { tmdbImg } from '@/shared/api/tmdb'

export default function BrowseCuriosityPaths({ paths = [], loading = false, activeKey = null, onSelect }) {
  if (loading) {
    return (
      <section className="ff-browse-paths" aria-labelledby="ff-browse-paths-title">
        <header className="ff-browse-section-head">
          <h2 id="ff-browse-paths-title">Start somewhere</h2>
          <p>Entry points into the catalogue — not another recommendation row.</p>
        </header>
        <div className="ff-browse-path-grid" aria-hidden="true">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="ff-browse-path-card is-skeleton" />)}
        </div>
      </section>
    )
  }
  if (paths.length === 0) return null

  return (
    <section className="ff-browse-paths" aria-labelledby="ff-browse-paths-title">
      <header className="ff-browse-section-head">
        <h2 id="ff-browse-paths-title">Start somewhere</h2>
        <p>Entry points into the catalogue — not another recommendation row.</p>
      </header>
      <div className="ff-browse-path-grid">
        {paths.map((p) => (
          <button
            key={p.key}
            type="button"
            className={`ff-browse-path-card${activeKey === p.key ? ' is-active' : ''}`}
            aria-pressed={activeKey === p.key}
            onClick={() => onSelect?.(p)}
          >
            {p.poster
              ? <img src={tmdbImg(p.poster, 'w342')} alt="" aria-hidden="true" loading="lazy" className="ff-browse-path-card__img" />
              : null}
            <span className="ff-browse-path-card__scrim" aria-hidden="true" />
            <span className="ff-browse-path-card__kicker">{p.kicker}</span>
            <span className="ff-browse-path-card__title">{p.title}</span>
            <span className="ff-browse-path-card__sub">{p.sub}</span>
          </button>
        ))}
      </div>
    </section>
  )
}
