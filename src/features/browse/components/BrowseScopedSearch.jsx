// src/features/browse/components/BrowseScopedSearch.jsx
// The masthead's scoped catalogue search. Distinct from the global header search
// (which finds a specific film/person and does NOT keep filters): this constrains
// the CURRENT Browse catalogue and keeps the active scope + sort. Submitting
// writes `q` to the URL (the container resets page to 1).
//
// Copy is honest about what the request actually matches: TMDB's text query is
// title-oriented, so we say "films" (not "title or director"). Filmmaker
// exploration stays in the dedicated director filter + the Filmmaker-trail path.

import { Search } from 'lucide-react'

export default function BrowseScopedSearch({ draft, setDraft, onSubmit }) {
  return (
    <form
      className="ff-browse-scoped-search"
      role="search"
      aria-label="Search within this catalogue"
      onSubmit={(e) => { e.preventDefault(); onSubmit(draft.trim()) }}
    >
      <Search className="ff-browse-scoped-search__icon" aria-hidden="true" />
      <input
        type="search"
        autoComplete="off"
        aria-label="Search within this catalogue"
        placeholder="Search within this catalogue"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
      />
      <button className="ffb-btn ffb-btn--primary" type="submit">
        <span className="ff-browse-scoped-search__label">Search</span>
        <Search className="ff-browse-scoped-search__btn-icon" aria-hidden="true" />
      </button>
    </form>
  )
}
