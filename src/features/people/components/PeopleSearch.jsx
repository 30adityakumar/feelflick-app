// src/features/people/components/PeopleSearch.jsx
// Sticky name-search band. Authenticated NAME search only — never taste-match discovery, never
// private activity. Query is local (no URL/storage/analytics text). Escape + Clear reset to
// discovery. Disclosure copy makes the separate-from-taste-match scope explicit.

export default function PeopleSearch({ query, onChange, onClear }) {
  return (
    <div className="ff-people-searchbar">
      <div className="ff-people-section ff-people-searchbar__shell">
        <div className="ff-people-searchbar__inner">
          <span className="ff-people-search-field">
            <svg className="ff-people-search-icon" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
            <input
              type="search"
              className="ff-people-search-input"
              value={query}
              aria-label="Search people by name"
              placeholder="Search people by name"
              autoComplete="off"
              style={{ minHeight: 44 }}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Escape' && query) { e.preventDefault(); onClear() } }}
            />
            {query ? (
              <button type="button" className="ff-people-search-clear" aria-label="Clear search" onClick={onClear}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M7 7l10 10M17 7 7 17" /></svg>
              </button>
            ) : null}
          </span>
          <span className="ff-people-search-note">Name search only</span>
        </div>
      </div>
    </div>
  )
}
