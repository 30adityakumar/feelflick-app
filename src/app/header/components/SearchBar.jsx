// src/app/header/components/SearchBar.jsx
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X } from 'lucide-react'

/**
 * Simple modal search.
 * - ESC closes
 * - Focus returns to the previously focused element
 * - Basic two-element focus loop (input / close)
 */
export default function SearchBar({ open, onClose }) {
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const inputRef = useRef(null)
  const closeRef = useRef(null)
  const lastActiveRef = useRef(null)

  /* Focus: capture and restore */
  useEffect(() => {
    if (!open) return
    lastActiveRef.current = document.activeElement
    const t = setTimeout(() => inputRef.current?.focus(), 40)
    return () => clearTimeout(t)
  }, [open])

  useEffect(() => {
    if (!open) return
    return () => {
      const el = lastActiveRef.current
      if (el && typeof el.focus === 'function') el.focus()
    }
  }, [open])

  /* ESC + minimal focus loop */
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.()
      if (e.key === 'Tab') {
        const els = [inputRef.current, closeRef.current].filter(Boolean)
        if (els.length < 2) return
        const idx = els.indexOf(document.activeElement)
        if (e.shiftKey) {
          if (idx === 0) { e.preventDefault(); els[1].focus() }
        } else {
          if (idx === 1) { e.preventDefault(); els[0].focus() }
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
      <div
        className="absolute left-1/2 top-[calc(var(--app-header-h,64px)+4vh)] w-[min(92vw,720px)] -translate-x-1/2"
        style={{ maxWidth: '720px' }}
      >
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