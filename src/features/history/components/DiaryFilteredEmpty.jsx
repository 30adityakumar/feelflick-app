// src/features/history/components/DiaryFilteredEmpty.jsx
// Constraint-aware empty result: the Diary HAS films, but the current search/Loved constraints match
// none. Copy names the active constraint(s); "Show all" clears search + Loved (preserving sort),
// removes ?filter, focuses the search field, and announces the restored count. role="status".

export default function DiaryFilteredEmpty({ hasSearch, loved, onShowAll }) {
  let title = 'No Diary entries match.'
  let body = 'Try a different search or show all logged films.'
  if (hasSearch && loved) {
    title = 'No loved Diary entries match your search.'
    body = 'Change your search or show all.'
  } else if (hasSearch) {
    title = 'No Diary entries match your search.'
    body = 'Try another title, filmmaker, or review.'
  } else if (loved) {
    title = 'No Diary entries are rated 9 or 10.'
    body = 'Show all logged films.'
  }

  return (
    <section className="ff-diary-filtered-empty" role="status">
      <h2 className="ff-diary-filtered-empty__title">{title}</h2>
      <p className="ff-diary-filtered-empty__body">{body}</p>
      <button type="button" className="ff-diary-filtered-empty__action" onClick={onShowAll}>Show all</button>
    </section>
  )
}
