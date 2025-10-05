// src/app/header/components/SearchBar.jsx
import { useEffect, useRef, useState } from 'react'

export default function SearchBar({ onSubmit }) {
  const [q, setQ] = useState('')
  const inputRef = useRef(null)

  // Press "/" to focus
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        // avoid typing "/" into the field
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const submit = (e) => {
    e.preventDefault()
    onSubmit?.(q)
  }

  return (
    <form onSubmit={submit} className="w-full max-w-xl">
      <input
        ref={inputRef}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search movies… (press / to focus)"
        className="w-full rounded-full bg-zinc-900/70 text-white placeholder-white/40 px-4 py-2 outline-none focus:ring-2 focus:ring-brand/60"
      />
    </form>
  )
}