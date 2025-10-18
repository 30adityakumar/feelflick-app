// src/app/header/components/SearchBar.jsx
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X } from 'lucide-react'

export default function SearchBar({ open, onClose }) {
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 60)
      return () => clearTimeout(t)
    }
  }, [open])

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose?.() }
    if (open) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  function submit(e) {
    e.preventDefault()
    const term = q.trim()
    if (!term) return
    onClose?.()
    nav(`/browse?q=${encodeURIComponent(term)}`)
    setQ('')
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60]">
      {/* Scrim */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Bar */}
      <div className="absolute left-1/2 top-[min(14vh,120px)] w-[min(92vw,720px)] -translate-x-1/2">
        <form
          onSubmit={submit}
          className="flex items-center gap-2 rounded-2xl border border-white/12 bg-neutral-900/85 p-2 pl-3 shadow-2xl backdrop-blur-xl"
        >
          <Search className="h-5 w-5 text-white/70" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search movies… (press / to focus)"
            className="h-11 w-full bg-transparent text-[1rem] text-white placeholder:text-white/50 focus:outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close search"
            className="inline-grid h-9 w-9 place-items-center rounded-xl bg-white/8 text-white/80 hover:bg-white/12"
          >
            <X className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  )
}