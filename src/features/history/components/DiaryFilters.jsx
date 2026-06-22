// src/features/history/components/DiaryFilters.jsx
// All / Loved · 9–10 toggle group. "Loved" is derived from the raw stored rating (9 or 10), not a
// separate favourite flag — the label says so. aria-pressed toggle buttons (not radios).

export default function DiaryFilters({ filter, onSelect }) {
  const items = [{ v: 'all', l: 'All' }, { v: 'loved', l: 'Loved · 9–10' }]
  return (
    <div className="ff-diary-filters" role="group" aria-label="Filter diary">
      {items.map((f) => (
        <button
          key={f.v}
          type="button"
          className={`ff-diary-filter${filter === f.v ? ' ff-diary-filter--active' : ''}`}
          style={{ minHeight: 44 }}
          aria-pressed={filter === f.v}
          onClick={() => onSelect(f.v)}
        >{f.l}</button>
      ))}
    </div>
  )
}
