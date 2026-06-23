// src/features/preferences/components/Segmented.jsx
// Accessible single-select segmented control (role=radiogroup) with roving
// tabindex + arrow-key navigation. Reused for mood bands, subtitles, spoiler.

import { useRef } from 'react'

export default function Segmented({ value, onChange, options, ariaLabel, ariaLabelledBy }) {
  const ref = useRef(null)
  const move = (e, idx) => {
    if (!['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'].includes(e.key)) return
    e.preventDefault()
    const dir = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1
    const next = options[(idx + dir + options.length) % options.length]
    onChange(next.v)
    requestAnimationFrame(() => ref.current?.querySelector(`[data-v="${next.v}"]`)?.focus())
  }
  return (
    <div ref={ref} className="ff-prefs-seg" role="radiogroup" aria-label={ariaLabel} aria-labelledby={ariaLabelledBy}>
      {options.map((o, i) => {
        const on = o.v === value
        return (
          <button
            key={o.v} type="button" role="radio" aria-checked={on} data-v={o.v}
            tabIndex={on ? 0 : -1} className="ff-prefs-seg__btn"
            onClick={() => onChange(o.v)} onKeyDown={(e) => move(e, i)}
          >{o.l}</button>
        )
      })}
    </div>
  )
}
