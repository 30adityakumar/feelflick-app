// src/features/history/components/DiaryFlatList.jsx
// Flat presentation for the non-chronological sorts (Highest rated / Runtime). No month/day
// containers — those would falsely imply chronological order. Each row shows its own watched-date
// context (DiaryRow showWatchedDate). A quiet "Sorted results" heading aids orientation.

import DiaryRow from './DiaryRow'

const HEADINGS = { rating: 'By highest rated', runtime: 'By runtime' }

export default function DiaryFlatList({ entries, sort, onRemove, isRemoving }) {
  return (
    <div className="ff-diary-flat">
      <h2 className="ff-diary-flat__head">{HEADINGS[sort] || 'Sorted results'}</h2>
      <div role="list" aria-label="Diary entries, sorted" className="ff-diary-flat__list">
        {entries.map((e) => (
          <DiaryRow key={e.id} entry={e} onRemove={onRemove} isRemoving={isRemoving(e.id)} showWatchedDate />
        ))}
      </div>
    </div>
  )
}
