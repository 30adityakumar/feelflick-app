// src/features/browse/components/BrowseActiveFilters.jsx
// The horizontally-scrollable row of active-scope chips + "Clear all".
// Each chip removes one filter. In TMDB text-search mode, filters TMDB can't
// honour are marked "paused" (dimmed, labelled) rather than pretending they
// still constrain results.

export default function BrowseActiveFilters({ chips = [], onClearAll }) {
  if (chips.length === 0) return null
  return (
    <div className="ff-browse-chips-row">
      <div className="ff-browse-chips" role="list" aria-label="Active filters">
        {chips.map((chip) => (
          <span key={chip.key} className={`ff-browse-chip${chip.paused ? ' is-paused' : ''}`} role="listitem">
            {chip.paused ? <span className="ff-browse-chip__tag" title="Paused while searching text">paused</span> : null}
            <span className="ff-browse-chip__label">{chip.label}</span>
            <button type="button" aria-label={`Remove ${chip.label}`} onClick={chip.onRemove}>×</button>
          </span>
        ))}
      </div>
      <button type="button" className="ff-browse-clear" onClick={onClearAll}>Clear all</button>
    </div>
  )
}
