// src/features/history/components/DiaryMonth.jsx
// A month section in the chronological timeline. The month heading is an <h2> and sticks below the
// retrieval bar on desktop/tablet (non-sticky ≤760px — see history.css). Count = visible films.

import DiaryDay from './DiaryDay'

export default function DiaryMonth({ month, days, count, onRemove, isRemoving }) {
  return (
    <section className="ff-diary-month">
      <div className="ff-diary-month__head">
        <h2 className="ff-diary-month__title">{month}</h2>
        <span className="ff-diary-month__count">{count} {count === 1 ? 'film' : 'films'}</span>
      </div>
      {days.map((d) => (
        <DiaryDay
          key={d.dateLabel}
          dateLabel={d.dateLabel}
          weekday={d.weekday}
          entries={d.entries}
          onRemove={onRemove}
          isRemoving={isRemoving}
        />
      ))}
    </section>
  )
}
