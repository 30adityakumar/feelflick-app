// src/app/header/components/SearchBar.jsx
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X } from 'lucide-react'

/**
 * Minimal modal search.
 * - Focus is returned to the previously-focused element.
 * - ESC closes, Tab stays within input/close.
 */
export default function SearchBar({ open, onClose }) {
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const inputRef = useRef(null)
  const closeRef = useRef(null)
  const lastActiveRef = useRef(null)

  // Focus handling
  useEffect(() => {
    if (!open) return
    lastActiveRef.current = document.activeElement
    const t = setTimeout(() => inputRef.current?.focus(), 50)
    return () => clearTimeout(t)
  }, [open])

  // Return focus on unmount
  useEffect(() => {
    if (!open) return
    return () => {
      if (lastActiveRef.current && lastActiveRef.current.focus) {
        lastActiveRef.current.focus()
      }
    }
  }, [open])

  // ESC + basic focus loop
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.()
      if (e.key === 'Tab') {
        const focusables = [inputRef.current, closeRef.current].filter(Boolean)
        if (focusables.length < 2) return
        const idx = focusables.indexOf(document.activeElement)
        if (e.shiftKey) {
          e.preventDefault()
          const next = (idx - 1 + focusables.length) % focusables.length
          focusables[next].focus()
        } else if (idx === focusables.length - 1) {
          e.preventDefault()
          focusables[0].focus()
        }
      }
    }
    document.addEventListener('keydown', onKey)
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
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label="Search movies">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Surface */}
      <div className="absolute left-1/2 top-[min(14vh,120px)] w-[min(92vw,720px)] -translate-x-1/2">
        <form
          onSubmit={submit}
          className="flex items-center gap-2 rounded-2xl border border-white/12 bg-neutral-900/85 p-2 pl-3 shadow-2xl backdrop-blur-xl"
        >
          <Search className="h-5 w-5 text-white/70" aria-hidden />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search movies… (press / to focus)"
            className="h-11 w-full bg-transparent text-[1rem] text-white placeholder:text-white/50 focus:outline-none"
            aria-label="Search movies"
          />
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="inline-grid h-9 w-9 place-items-center rounded-xl bg-white/10 text-white/80 hover:bg-white/15 focus:outline-none"
            aria-label="Close search"
          >
            <X className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  )
}