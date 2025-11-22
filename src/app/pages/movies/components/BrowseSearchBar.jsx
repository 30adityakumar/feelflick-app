// src/app/pages/movies/components/BrowseSearchBar.jsx
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'

import Spinner from '@/shared/ui/Spinner'
import ErrorState from '@/shared/ui/ErrorState'
import { searchMovies, tmdbImg } from '@/shared/api/tmdb'
import { useAsync } from '@/shared/hooks/useAsync'

/**
 * BrowseSearchBar
 * - TMDB search for the Browse page
 * - On select: navigates to /movie/:id
 */
export default function BrowseSearchBar() {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)

  const inputRef = useRef(null)
  const navigate = useNavigate()
  const { data, error, loading, run } = useAsync()

  useEffect(() => {
    if (!q.trim()) {
      setOpen(false)
      return
    }

    setOpen(true)
    const id = setTimeout(() => {
      run((signal) => searchMovies(q.trim(), { page: 1, signal }))
    }, 250)

    return () => clearTimeout(id)
  }, [q, run])

  const results = data?.results?.slice(0, 8) ?? []

  function goToMovie(id) {
    setOpen(false)
    setQ('')
    navigate(`/movie/${id}`)
  }

  function onKeyDown(e) {
    if (!open || !results.length) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      const m = results[active]
      if (m) goToMovie(m.id)
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-3 py-2 focus-within:border-purple-500/80 focus-within:ring-2 focus-within:ring-purple-500/40 transition-all">
        <Search className="h-4 w-4 text-white/60" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search by title…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={onKeyDown}
          className="w-full bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none"
        />
        {loading && (
          <div className="w-4 h-4">
            <Spinner />
          </div>
        )}
      </div>

      {open && (
        <div className="absolute z-40 mt-2 w-full rounded-xl bg-neutral-950 border border-white/10 shadow-2xl overflow-hidden">
          {error && (
            <div className="p-3">
              <ErrorState
                compact
                title="Search error"
                description="Please try again."
              />
            </div>
          )}

          {!error && !loading && !results.length && (
            <div className="p-3 text-xs text-white/60">No matches found.</div>
          )}

          {!error && results.length > 0 && (
            <ul className="max-h-80 overflow-y-auto divide-y divide-white/5">
              {results.map((m, idx) => {
                const isActive = idx === active
                return (
                  <li
                    key={m.id}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      goToMovie(m.id)
                    }}
                    onMouseEnter={() => setActive(idx)}
                    className={`flex items-center gap-3 px-3 py-2 cursor-pointer text-xs sm:text-sm transition-colors ${
                      isActive
                        ? 'bg-purple-600/25 text-white'
                        : 'hover:bg-white/5 text-white/80'
                    }`}
                  >
                    <div className="w-9 h-12 rounded-md overflow-hidden bg-white/5 flex-shrink-0">
                      {m.poster_path ? (
                        <img
                          src={tmdbImg(m.poster_path, 'w185')}
                          alt={m.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full grid place-items-center text-[10px] text-white/40">
                          No art
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{m.title}</p>
                      <p className="text-[11px] text-white/60 truncate">
                        {m.release_date
                          ? new Date(m.release_date).getFullYear()
                          : 'Unknown year'}
                      </p>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
