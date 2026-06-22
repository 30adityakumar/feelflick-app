// src/features/history/components/DiaryTimeline.jsx
// Chronological presentation for the "Most recent" sort: groups the (already date-desc sorted)
// visible entries into month → day, preserving order. Used ONLY for Most recent — the flat sorts
// use DiaryFlatList so chronological containers never imply a false order.

import { WEEKDAY_NAMES } from '../derive/historyDerive'
import DiaryMonth from './DiaryMonth'

function groupByMonthThenDay(entries) {
  const months = []
  const monthIndex = new Map()
  for (const e of entries) {
    let m = monthIndex.get(e.month)
    if (!m) {
      m = { month: e.month, count: 0, days: [], dayIndex: new Map() }
      monthIndex.set(e.month, m)
      months.push(m)
    }
    m.count += 1
    let d = m.dayIndex.get(e.date)
    if (!d) {
      d = { dateLabel: e.date, weekday: WEEKDAY_NAMES[new Date(e.watchedAt).getDay()], entries: [] }
      m.dayIndex.set(e.date, d)
      m.days.push(d)
    }
    d.entries.push(e)
  }
  return months
}

export default function DiaryTimeline({ entries, onRemove, isRemoving }) {
  const months = groupByMonthThenDay(entries)
  return (
    <div className="ff-diary-timeline">
      {months.map((m) => (
        <DiaryMonth
          key={m.month}
          month={m.month}
          days={m.days}
          count={m.count}
          onRemove={onRemove}
          isRemoving={isRemoving}
        />
      ))}
    </div>
  )
}
