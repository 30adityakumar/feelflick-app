// src/features/browse/components/BrowseFilmGrid.jsx
// Dense poster grid for /browse results. Pure presentation: it derives each
// card's objective evidence + (rare) badge from the active sort via
// browsePresentation, and delegates open/save/watched to container handlers
// (which own the real writes + TMDB-only routing).

import BrowseFilmCard from './BrowseFilmCard'
import { cardBadge } from '../browsePresentation'

export default function BrowseFilmGrid({
  films, sort, qualityLens = [], watchedSet, watchlistSet,
  onOpen, onToggleWatched, onToggleWatchlist,
}) {
  return (
    <div className="ff-browse-grid" role="list">
      {films.map((f) => (
        <div className="ff-browse-grid__cell" role="listitem" key={f.id}>
          <BrowseFilmCard
            film={f}
            badge={cardBadge(f, sort, qualityLens)}
            watched={watchedSet?.has(f.id)}
            inWatchlist={watchlistSet?.has(f.id)}
            onOpen={onOpen}
            onToggleWatched={onToggleWatched}
            onToggleWatchlist={onToggleWatchlist}
          />
        </div>
      ))}
    </div>
  )
}
