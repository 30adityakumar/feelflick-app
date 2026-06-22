// src/features/watchlist/components/WatchlistSort.jsx
// Saved-intent sort (no recommendation rank). Options + accessible label are a locked contract.

export default function WatchlistSort({ value, onChange }) {
  return (
    <label className="ff-wl-sort">
      <span className="ff-wl-sort__label">Sort</span>
      <select
        className="ff-wl-sort__select"
        value={value}
        aria-label="Sort saved films"
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="recent">Recently saved</option>
        <option value="oldest">Oldest saved</option>
        <option value="runtime">Runtime</option>
        <option value="title">Title</option>
      </select>
    </label>
  )
}
