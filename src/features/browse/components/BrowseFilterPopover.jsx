// src/features/browse/components/BrowseFilterPopover.jsx
// One filter dropdown (Genre / Era / Language / Runtime, or the mobile Sort
// menu). Controlled: the FilterBar owns which popover is open (so only one opens
// at a time, Escape closes + restores focus, and an outside click closes).
// Panel renders via a React portal so it escapes any overflow:auto ancestor
// (e.g. the horizontal scroll strip on mobile) and backdrop-filter containment.

import { createPortal } from 'react-dom'
import { useLayoutEffect, useRef, useState } from 'react'

export default function BrowseFilterPopover({
  id, label, valueText, active, open, onToggle, options, selected, onSelect, align = 'left', triggerRef,
}) {
  const btnRef = useRef(null)
  const [panelPos, setPanelPos] = useState(null)

  useLayoutEffect(() => {
    if (!open || !btnRef.current) { setPanelPos(null); return }
    const r = btnRef.current.getBoundingClientRect()
    setPanelPos(
      align === 'right'
        ? { top: r.bottom + 6, right: window.innerWidth - r.right }
        : { top: r.bottom + 6, left: r.left }
    )
  }, [open, align])

  const setRefs = (el) => {
    btnRef.current = el
    if (typeof triggerRef === 'function') triggerRef(el)
  }

  return (
    <div className="ff-filter-wrap" data-popover-id={id}>
      <button
        type="button"
        ref={setRefs}
        className={`ff-filter-button${active ? ' is-active' : ''}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => onToggle(id)}
      >
        {label}{valueText ? <span className="ff-filter-button__value">: {valueText}</span> : null}
        <svg className="ff-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="m7 10 5 5 5-5" /></svg>
      </button>
      {open ? createPortal(
        <div
          className="ff-popover"
          role="listbox"
          aria-label={label}
          style={panelPos
            ? { position: 'fixed', zIndex: 200, ...panelPos }
            : { visibility: 'hidden', position: 'fixed', zIndex: 200 }}
        >
          {options.map(([value, optLabel]) => (
            <button
              key={value || '_any'}
              type="button"
              role="option"
              aria-selected={selected === value}
              className={`ff-popover__item${selected === value ? ' is-selected' : ''}`}
              onClick={() => onSelect(value)}
            >
              <span>{optLabel}</span>
              {selected === value ? <span className="ff-popover__check" aria-hidden="true">✓</span> : null}
            </button>
          ))}
        </div>,
        document.querySelector('.ff-browse') ?? document.body
      ) : null}
    </div>
  )
}
