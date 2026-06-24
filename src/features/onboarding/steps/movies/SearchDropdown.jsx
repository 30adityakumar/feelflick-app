import { useEffect, useRef } from 'react'
import { Check } from 'lucide-react'

import { tmdbImg } from '@/shared/api/tmdb'

export default function SearchDropdown({
  searching, results, isMovieSelected, onSelect, searchError, onRetry, activeIndex, listboxId,
}) {
  const activeRef = useRef(null)

  useEffect(() => {
    activeRef.current?.scrollIntoView?.({ block: 'nearest' })
  }, [activeIndex])

  return (
    <div className="ob-search-dropdown">
      {searchError ? (
        <div role="alert" className="ob-search-state ob-search-error">
          <span>Couldn&apos;t reach search.</span>
          {onRetry && (
            <button type="button" onClick={onRetry} aria-label="Retry search">Retry</button>
          )}
        </div>
      ) : searching ? (
        <p role="status" aria-live="polite" className="ob-search-state">Searching…</p>
      ) : results.length === 0 ? (
        <p role="status" aria-live="polite" className="ob-search-state">No results — try a different title</p>
      ) : (
        <div role="listbox" id={listboxId} aria-label="Search results" className="ob-search-results">
          {results.map((movie, index) => {
            const year = movie.release_date ? new Date(movie.release_date).getFullYear() : null
            const selected = isMovieSelected(movie.id)
            const active = index === activeIndex

            return (
              <button
                key={movie.id}
                id={`${listboxId}-opt-${movie.id}`}
                role="option"
                aria-selected={active}
                ref={active ? activeRef : null}
                type="button"
                tabIndex={-1}
                onClick={() => onSelect(movie)}
                className={`ob-search-option${active ? ' is-active' : ''}`}
              >
                <img src={tmdbImg(movie.poster_path, 'w92')} alt="" />
                <span>
                  <strong>{movie.title}</strong>
                  {year && <small>{year}</small>}
                </span>
                {selected && (
                  <>
                    <Check className="ob-search-selected" aria-hidden="true" />
                    <span className="sr-only">(already in your anchors)</span>
                  </>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
