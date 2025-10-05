// src/app/header/components/SearchBar.jsx
import { useEffect, useRef, useState } from 'react'
import { X, Search as SearchIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function SearchBar({ open, onClose }) {
  const [q, setQ] = useState('')
  const panelRef = useRef(null)
  const inputRef = useRef(null)
  const navigate = useNavigate()

  // Auto-focus when opening
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 0)
      return () => clearTimeout(t)
    }
  }, [open])

  // Close on Escape / click-away
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    const onDown = (e) => {
      if (!panelRef.current) return
      if (!panelRef.current.contains(e.target)) onClose?.()
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onDown)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onDown)
    }
  }, [open, onClose])

  const submit = (e) => {
    e.preventDefault()
    if (!q.trim()) return
    onClose?.()
    navigate(`/browse?query=${encodeURIComponent(q.trim())}`)
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div
        ref={panelRef}
        className="
          mt-[min(14vh,100px)]
          w-[min(880px,92vw)]
          rounded-2xl border border-white/10
          bg-neutral-900/95 shadow-2xl backdrop-blur-md
          p-3 sm:p-4
        "
      >
        {/* Top row */}
        <div className="flex items-center justify-between">
          <h2 className="px-1 text-sm font-semibold text-white/70">
            Quick search
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-white/85 hover:bg-white/10 focus:outline-none"
            aria-label="Close search"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search input */}
        <form onSubmit={submit} className="mt-2">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white/60" />
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search movies… (press Enter)"
              className="
                w-full rounded-xl border border-white/10 bg-white/5 pl-11 pr-4 py-3
                text-[0.98rem] text-white placeholder-white/40
                outline-none focus:ring-2 focus:ring-brand/60
              "
            />
          </div>
        </form>

        {/* Suggestions (MVP: static examples) */}
        <div className="mt-3">
          <p className="px-1 text-xs font-semibold uppercase tracking-wider text-white/50">
            Try
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {['Batman', 'Cozy', 'Mind-bending', 'Feel-good', 'Nolan'].map((s) => (
              <button
                key={s}
                onClick={() => setQ(s)}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/85 hover:bg-white/10 focus:outline-none"
                type="button"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}