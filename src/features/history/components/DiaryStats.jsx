// src/features/history/components/DiaryStats.jsx
// Compact, factual Diary stats line (replaces the four large cards). Always describes the COMPLETE
// Diary, not the current search/filter result. No streaks, achievements, or tooltips.
//   • Films logged  — canonical unique films (not history-event count)
//   • Runtime logged — total runtime once per canonical film (not lifetime viewing; no rewatches)
//   • Avg rating     — rated canonical Diary films only, on the 5-star scale, one decimal
//   • This month     — canonical films whose latest valid watch is in the current month

export default function DiaryStats({ stats }) {
  const items = [
    { label: 'Films logged', value: stats.totalLogged },
    { label: 'Runtime logged', value: `${stats.totalHours}h` },
    { label: 'Avg rating', value: stats.avgRating ? stats.avgRating.toFixed(1) : '—' },
    { label: 'This month', value: stats.thisMonthCount },
  ]
  return (
    <section className="ff-diary-section ff-diary-stats" aria-label="Diary statistics">
      <dl className="ff-diary-stats__row">
        {items.map((s) => (
          <div key={s.label} className="ff-diary-stat">
            <dt className="ff-diary-stat__label">{s.label}</dt>
            <dd className="ff-diary-stat__value">{s.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
