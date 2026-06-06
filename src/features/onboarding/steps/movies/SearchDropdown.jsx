import { Check } from 'lucide-react'

import { tmdbImg } from '@/shared/api/tmdb'

// Live-search results dropdown. Rendered by MoviesStep inside `{showDropdown && …}`,
// so it assumes it is mounted only when open. Markup moved verbatim from MoviesStep
// (F2.3) — no Escape / outside-click / listbox semantics added in this pass.
export default function SearchDropdown({ searching, results, isMovieSelected, onSelect }) {
  return (
    <div className="absolute left-5 right-5 sm:left-6 sm:right-6 top-full mt-1 z-50 bg-black/95 border border-white/10 rounded-xl overflow-hidden shadow-2xl backdrop-blur-xl">
      {searching ? (
        <p className="px-4 py-3 text-sm text-white/40">Searching…</p>
      ) : results.length === 0 ? (
        <p className="px-4 py-3 text-sm text-white/30">No results — try a different title</p>
      ) : (
        <div className="max-h-60 overflow-y-auto divide-y divide-white/5">
          {results.map(m => {
            const yr = m.release_date ? new Date(m.release_date).getFullYear() : null
            const selected = isMovieSelected(m.id)
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => onSelect(m)}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/6 text-left transition-colors"
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
                  <Check className="shrink-0 h-4 w-4 text-purple-400" />
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
