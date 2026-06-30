// src/features/browse/components/BrowseResultsHeader.jsx
// Results heading + honest count summary + the "how is this ordered?" disclosure
// (rare, on demand — not a banner that re-announces personalization everywhere).

import { sortSummary, rankingCopy } from '../browsePresentation'

export default function BrowseResultsHeader({
  title, count, displayCount, loading, sort, isSearchMode, query, shortQueryHint,
  infoOpen, onToggleInfo,
}) {
  const isPaginating = !isSearchMode && displayCount > 0 && displayCount < count

  return (
    <div className="ff-browse-results-head">
      <div className="ff-browse-results-head__main">
        <div className="ff-browse-results-title-line">
          <h2 className="ff-browse-results-title">{title}</h2>
          <button
            type="button"
            className="ff-info-btn"
            aria-expanded={infoOpen}
            aria-controls="browse-ranking-note"
            aria-label="How these results are ordered"
            onClick={onToggleInfo}
          >
            <span aria-hidden="true">i</span>
          </button>
        </div>
        <div className="ff-browse-results-summary" aria-live="polite">
          {loading ? (
            <span className="ff-browse-results-summary__muted">Loading…</span>
          ) : isPaginating ? (
            <>
              Showing{' '}
              <span className="ff-browse-results-count">{displayCount}</span>
              {' '}of{' '}
              <span className="ff-browse-results-count">{count.toLocaleString()}</span>
              {' '}films · {sortSummary(sort)}
            </>
          ) : (
            <>
              <span className="ff-browse-results-count">{count.toLocaleString()}</span>{' '}
              {count === 1 ? 'film' : 'films'}
              {isSearchMode
                ? <> · matching <span className="ff-browse-results-summary__em">&ldquo;{query}&rdquo;</span> by title</>
                : <> · {sortSummary(sort)}</>}
              {shortQueryHint ? <> · type one more character to search</> : null}
            </>
          )}
        </div>
      </div>

      <div id="browse-ranking-note" role="region" className={`ff-browse-ranking-note${infoOpen ? ' is-open' : ''}`} hidden={!infoOpen}>
        {isSearchMode
          ? 'Text search matches film titles across the wider catalogue. Genre, era, language, runtime and rating still apply; engine filters (mood, pacing, intensity, quality lenses, filmmaker) and the sort options are paused until you clear the search.'
          : rankingCopy(sort)}
      </div>
    </div>
  )
}
