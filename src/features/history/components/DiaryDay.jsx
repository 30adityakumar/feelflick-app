// src/features/history/components/DiaryDay.jsx
// A single day within the chronological timeline: a header (date · weekday · visible film count ·
// visible runtime) and a labelled list of that day's entries. Counts/hours describe the VISIBLE
// (filtered) result, once per canonical film.

import DiaryRow from './DiaryRow'

export default function DiaryDay({ dateLabel, weekday, entries, onRemove, isRemoving }) {
  const films = entries.length
  const minutes = entries.reduce((s, e) => s + (e.runtime || 0), 0)
  const hours = Math.round(minutes / 60)
  const meta = [
    dateLabel,
    weekday,
    `${films} ${films === 1 ? 'film' : 'films'}`,
    hours > 0 ? `${hours}h` : null,
  ].filter(Boolean).join(' · ')

  return (
    <div className="ff-diary-day">
      <p className="ff-diary-day__head">{meta}</p>
      <div role="list" aria-label={`Films watched ${dateLabel}`} className="ff-diary-day__list">
        {entries.map((e) => (
          <DiaryRow key={e.id} entry={e} onRemove={onRemove} isRemoving={isRemoving(e.id)} />
        ))}
      </div>
    </div>
  )
}
