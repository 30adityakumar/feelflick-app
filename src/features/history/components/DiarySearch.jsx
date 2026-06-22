// src/features/history/components/DiarySearch.jsx
// Local search over the user's own content (title / director / review). Private LOCAL state only —
// never URL/storage/analytics. Escape clears; explicit clear button when there's a value.

export default function DiarySearch({ value, onChange, onClear }) {
  return (
    <div className="ff-diary-search">
      <svg className="ff-diary-search__icon" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
      </svg>
      <input
        type="search"
        className="ff-diary-search__input"
        value={value}
        aria-label="Search the Diary"
        placeholder="Search title, filmmaker, or review"
        autoComplete="off"
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Escape' && value) { e.preventDefault(); onClear() } }}
      />
      {value ? (
        <button type="button" className="ff-diary-search__clear" aria-label="Clear search" onClick={onClear}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M7 7l10 10M17 7 7 17" /></svg>
        </button>
      ) : null}
    </div>
  )
}
