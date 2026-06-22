// src/features/watchlist/components/WatchlistGrid.jsx
// The saved-film collection: one labelled list, one list item per film.

import WatchlistCard from './WatchlistCard'

export default function WatchlistGrid({ items, onRemove, isRemoving }) {
  return (
    <div className="ff-wl-grid" role="list" aria-label="Saved films">
      {items.map((f) => <WatchlistCard key={f.id} f={f} onRemove={onRemove} isRemoving={isRemoving} />)}
    </div>
  )
}
