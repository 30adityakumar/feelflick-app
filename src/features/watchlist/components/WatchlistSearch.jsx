// src/features/watchlist/components/WatchlistSearch.jsx
// Local search input over the saved collection (title + director + primary mood). Search text is
// private LOCAL state only (never URL/storage/analytics). Escape clears; an explicit clear button
// appears when there's a value. type="search" + an accessible label.

export default function WatchlistSearch({ value, onChange, onClear }) {
  return (
    <div className="ff-wl-search">
      <svg className="ff-wl-search__icon" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
      </svg>
      <input
        type="search"
        className="ff-wl-search__input"
        value={value}
        aria-label="Search Watchlist"
        placeholder="Search Watchlist"
        autoComplete="off"
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Escape' && value) { e.preventDefault(); onClear() } }}
      />
      {value ? (
        <button type="button" className="ff-wl-search__clear" aria-label="Clear search" onClick={onClear}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M7 7l10 10M17 7 7 17" /></svg>
        </button>
      ) : null}
    </div>
  )
}
