// src/features/preferences/components/ChipMultiSelect.jsx
// Bounded multi-select chips with an add popover (genres, languages).

import { useEffect, useRef, useState } from 'react'

export default function ChipMultiSelect({ label, items, options, onAdd, onRemove, addLabel, tone = 'neutral', max }) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)
  const firstOptRef = useRef(null)
  const triggerRef = useRef(null)
  const close = (restoreFocus) => { setOpen(false); if (restoreFocus) requestAnimationFrame(() => triggerRef.current?.focus()) }
  useEffect(() => {
    if (!open) return
    const onDown = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) close(false) }
    const onKey = (e) => { if (e.key === 'Escape') close(true) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    requestAnimationFrame(() => firstOptRef.current?.focus())
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey) }
  }, [open])
  const avail = options.filter((o) => !items.some((it) => it.key === o.key))
  const atMax = !!max && items.length >= max
  const pillClass = tone === 'drawn' ? 'ff-prefs-chip-pill--drawn' : tone === 'avoid' ? 'ff-prefs-chip-pill--avoid' : ''
  return (
    <div className="ff-prefs-chips" ref={wrapRef}>
      {items.map((it) => (
        <span key={it.key} className={`ff-prefs-chip-pill ${pillClass}`}>
          {it.label}
          <button type="button" className="ff-prefs-chip-pill__x" aria-label={`Remove ${it.label}`} onClick={() => onRemove(it.key)}>×</button>
        </span>
      ))}
      <button
        ref={triggerRef} type="button" className="ff-prefs-chip-add" aria-label={label} aria-haspopup="listbox" aria-expanded={open}
        disabled={avail.length === 0 || atMax} onClick={() => setOpen((o) => !o)}
      >{atMax ? 'Limit reached' : addLabel}</button>
      {open && avail.length > 0 && !atMax && (
        <div className="ff-prefs-popover" role="listbox" aria-label={label}>
          {avail.map((o, i) => (
            <button
              key={o.key} ref={i === 0 ? firstOptRef : null} type="button" role="option" aria-selected="false"
              className="ff-prefs-popover__opt" onClick={() => { onAdd(o.key); close(true) }}
            >{o.label}</button>
          ))}
        </div>
      )}
    </div>
  )
}
