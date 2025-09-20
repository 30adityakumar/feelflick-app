import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import Spinner from '@/shared/ui/Spinner'
import ErrorState from '@/shared/ui/ErrorState'
import { searchMovies, tmdbImg, posterSrcSet } from '@/shared/api/tmdb'
import { useAsync } from '@/shared/hooks/useAsync'

export default function SearchBar() {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)

  const inputRef = useRef(null)
  const listRef = useRef(null)
  const navigate = useNavigate()
  const { data, error, loading, run } = useAsync()

  // Global "/" shortcut focuses search
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === '/' &&
          document.activeElement?.tagName !== 'INPUT' &&
          document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Debounce TMDb search
  useEffect(() => {
    if (!q.trim()) { setOpen(false); return }
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
    if (!open) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => Math.min(i + 1, results.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)) }
    else if (e.key === 'Enter') { const m = results[active]; if (m) goToMovie(m.id) }
    else if (e.key === 'Escape') { setOpen(false) }
  }

  return (
    <div className="relative w-full max-w-lg">
      <div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 backdrop-blur-sm focus-within:ring-2 focus-within:ring-white/30">
        <Search className="h-4 w-4 opacity-70" aria-hidden />
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => q && setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search movies… (press / to focus)"
          className="h-6 w-full bg-transparent text-sm text-white placeholder-white/60 focus:outline-none"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls="header-search-results"
        />
        {loading ? <Spinner size={16} className="text-white/60" /> : null}
      </div>

      {open && (
        <div
          id="header-search-results"
          role="listbox"
          ref={listRef}
          className="absolute z-50 mt-2 w-full overflow-hidden rounded-xl border border-white/15 bg-neutral-900/95 p-2 shadow-xl backdrop-blur"
        >
          {error ? (
            <ErrorState title="Search failed" detail={error?.message} onRetry={() => run((s) => searchMovies(q, { signal: s }))} />
          ) : results.length === 0 && !loading ? (
            <div className="p-3 text-sm text-white/70">No results</div>
          ) : (
            <ul>
              {results.map((m, i) => (
                <li
                  key={m.id}
                  role="option"
                  aria-selected={i === active}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => goToMovie(m.id)}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg p-2 hover:bg-white/5 ${i === active ? 'bg-white/10' : ''}`}
                >
                  <img
                    alt={m.title}
                    src={tmdbImg(m.poster_path, 'w154')}
                    srcSet={posterSrcSet(m.poster_path)}
                    loading="lazy"
                    width="56"
                    height="84"
                    className="h-14 w-10 rounded-md object-cover"
                  />
                  <div className="min-w-0">
                    <div className="truncate text-sm text-white">{m.title}</div>
                    <div className="text-xs text-white/60">
                      {(m.release_date || '').slice(0, 4)} • ⭐ {m.vote_average?.toFixed?.(1) ?? '—'}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}