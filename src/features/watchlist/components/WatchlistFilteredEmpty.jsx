// src/features/watchlist/components/WatchlistFilteredEmpty.jsx
// Constraint-aware empty result for a non-empty collection. The copy reflects exactly which
// retrieval constraints are active (search / mood / both). role="status" so a keyboard/SR user
// who just changed a constraint learns the result is empty without losing their place. "Show all"
// clears search + mood (the shell preserves sort) and restores the collection.

const COPY = {
  search: { h: 'No saved films match your search.', p: 'Try another title, director, or mood.' },
  mood: { h: 'No saved films match this mood.', p: 'Choose another mood or show everything.' },
  both: { h: 'No saved films match this search and mood.', p: 'Change your search, choose another mood, or show everything.' },
}

export default function WatchlistFilteredEmpty({ hasSearch, hasMood, onShowAll }) {
  const key = hasSearch && hasMood ? 'both' : hasSearch ? 'search' : 'mood'
  const { h, p } = COPY[key]
  return (
    <section className="ff-wl-section ff-wl-collection ff-wl-empty" role="status">
      <div className="ff-wl-empty__inner">
        <h2 className="ff-wl-empty__title">{h}</h2>
        <p className="ff-wl-empty__sub">{p}</p>
        <button type="button" className="ff-wl-cta" onClick={onShowAll}>Show all</button>
      </div>
    </section>
  )
}
