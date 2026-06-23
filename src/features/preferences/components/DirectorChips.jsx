// src/features/preferences/components/DirectorChips.jsx
// Free-text director entry with history/catalogue suggestions. Names must match
// catalogue spelling to take effect — disclosed via the note.

import { useEffect, useRef, useState } from 'react'

export default function DirectorChips({ label, items, onAdd, onRemove, suggestions = [], placeholder, tone = 'neutral', noteId }) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const wrapRef = useRef(null)
  const inputRef = useRef(null)
  const triggerRef = useRef(null)
  const close = (restoreFocus) => { setOpen(false); setText(''); if (restoreFocus) requestAnimationFrame(() => triggerRef.current?.focus()) }
  useEffect(() => {
    if (!open) return
    const onDown = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) close(false) }
    const onKey = (e) => { if (e.key === 'Escape') close(true) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    requestAnimationFrame(() => inputRef.current?.focus())
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey) }
  }, [open])
  const matched = suggestions
    .filter((s) => !items.some((it) => it.toLowerCase() === s.toLowerCase()) && (text.trim() === '' || s.toLowerCase().includes(text.trim().toLowerCase())))
    .slice(0, 8)
  const submit = (e) => {
    e?.preventDefault?.()
    const v = text.trim()
    if (v) { onAdd(v); close(true) }
  }
  const pillClass = tone === 'trusted' ? 'ff-prefs-chip-pill--drawn' : tone === 'muted' ? 'ff-prefs-chip-pill--avoid' : ''
  return (
    <div className="ff-prefs-chips" ref={wrapRef}>
      {items.map((name) => (
        <span key={name} className={`ff-prefs-chip-pill ${pillClass}`}>
          {name}
          <button type="button" className="ff-prefs-chip-pill__x" aria-label={`Remove ${name}`} onClick={() => onRemove(name)}>×</button>
        </span>
      ))}
      <button ref={triggerRef} type="button" className="ff-prefs-chip-add" aria-label={label} aria-expanded={open} aria-describedby={noteId} onClick={() => setOpen((o) => !o)}>+ Director</button>
      {open && (
        <form className="ff-prefs-popover" onSubmit={submit} aria-label={label}>
          <input
            ref={inputRef} className="ff-prefs-popover__input" value={text}
            onChange={(e) => setText(e.target.value)} placeholder={placeholder || 'Director name…'} aria-label={label}
          />
          {matched.length > 0 && (
            <div style={{ marginTop: 8 }}>
              {matched.map((s) => (
                <button key={s} type="button" className="ff-prefs-popover__opt" onClick={() => { onAdd(s); close(true) }}>{s}</button>
              ))}
            </div>
          )}
          <button type="submit" className="ff-prefs-popover__add" disabled={!text.trim()}>Add</button>
        </form>
      )}
    </div>
  )
}
