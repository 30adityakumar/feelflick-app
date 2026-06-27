import { useEffect, useRef } from 'react'
import { Check } from 'lucide-react'

import { tmdbImg } from '@/shared/api/tmdb'

// Live-search results dropdown (the combobox popup). When results exist it is a
// role="listbox" of role="option" buttons; the active option (driven by the
// input's keyboard handler via `activeIndex`) is highlighted + announced through
// aria-activedescendant on the input. A search FAILURE shows a role="alert" retry
// row (never the benign "No results"); searching / true no-results are role="status".
export default function SearchDropdown({
  searching, results, isMovieSelected, onSelect, searchError, onRetry, activeIndex, listboxId,
}) {
  const activeRef = useRef(null)
  // Keep the keyboard-active option scrolled into view.
  useEffect(() => {
    activeRef.current?.scrollIntoView?.({ block: 'nearest' })
  }, [activeIndex])

  return (
    <div className="absolute left-5 right-5 sm:left-6 sm:right-6 top-full mt-1 z-50 bg-black/95 border border-white/10 rounded-xl overflow-hidden shadow-2xl backdrop-blur-xl">
      {searchError ? (
        <div role="alert" className="flex items-center justify-between gap-3 px-4 py-3 text-sm text-red-300">
          <span>Couldn&apos;t reach search.</span>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              aria-label="Retry search"
              className="shrink-0 rounded-lg px-3 py-1 text-xs font-medium bg-white/10 hover:bg-white/15 text-white transition-colors"
            >
              Retry
            </button>
          )}
        </div>
      ) : searching ? (
        <p role="status" aria-live="polite" className="px-4 py-3 text-sm text-white/40">Searching…</p>
      ) : results.length === 0 ? (
        <p role="status" aria-live="polite" className="px-4 py-3 text-sm text-white/30">No results — try a different title</p>
      ) : (
        <div role="listbox" id={listboxId} aria-label="Search results" className="max-h-60 overflow-y-auto divide-y divide-white/5">
          {results.map((m, i) => {
            const yr = m.release_date ? new Date(m.release_date).getFullYear() : null
            const selected = isMovieSelected(m.id)
            const active = i === activeIndex
            return (
              <button
                key={m.id}
                id={`${listboxId}-opt-${m.id}`}
                role="option"
                aria-selected={active}
                ref={active ? activeRef : null}
                type="button"
                tabIndex={-1}
                onClick={() => onSelect(m)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${active ? 'bg-white/10' : 'hover:bg-white/6'}`}
              >
                <img
                  src={tmdbImg(m.poster_path, 'w92')}
                  alt=""
                  className="w-8 h-12 rounded object-cover shrink-0 bg-white/4"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{m.title}</p>
                  {yr && <p className="text-xs text-white/40">{yr}</p>}
                </div>
                {selected && (
                  <>
                    <Check className="shrink-0 h-4 w-4 text-[var(--color-action-primary-fill,#f0ece4)]" aria-hidden="true" />
                    <span className="sr-only">(already in your picks)</span>
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
