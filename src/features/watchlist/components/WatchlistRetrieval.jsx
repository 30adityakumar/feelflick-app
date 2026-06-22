// src/features/watchlist/components/WatchlistRetrieval.jsx
// Sticky retrieval surface: [ search | mood filters | sort ]. Sticks below the canonical Header
// using the real --hdr-h token (never the prototype's hard-coded 62px); its z-index sits below
// Header/AvatarMenu/dialogs/toasts and above collection content (see watchlist.css).

import WatchlistSearch from './WatchlistSearch'
import WatchlistMoodFilters from './WatchlistMoodFilters'
import WatchlistSort from './WatchlistSort'

export default function WatchlistRetrieval({ search, onSearch, onClearSearch, availableMoods, mood, onMood, sort, onSort }) {
  return (
    <div className="ff-wl-retrieval">
      <div className="ff-wl-section ff-wl-retrieval__shell">
        <div className="ff-wl-retrieval__inner">
          <WatchlistSearch value={search} onChange={onSearch} onClear={onClearSearch} />
          <WatchlistMoodFilters availableMoods={availableMoods} activeMood={mood} onSelect={onMood} />
          <WatchlistSort value={sort} onChange={onSort} />
        </div>
      </div>
    </div>
  )
}
