// src/features/browse/components/BrowseFilterPopover.jsx
// One filter dropdown (Genre / Era / Language / Runtime, or the mobile Sort
// menu). Controlled: the FilterBar owns which popover is open (so only one opens
// at a time, Escape closes + restores focus, and an outside click closes). The
// trigger shows the active value; the menu is a single-select list. Kept inside a
// positioned wrapper so the FilterBar can constrain it to the viewport.

export default function BrowseFilterPopover({
  id, label, valueText, active, open, onToggle, options, selected, onSelect, align = 'left', triggerRef,
}) {
  return (
    <div className="ff-filter-wrap" data-popover-id={id}>
      <button
        type="button"
        ref={triggerRef}
        className={`ff-filter-button${active ? ' is-active' : ''}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => onToggle(id)}
      >
        {label}{valueText ? <span className="ff-filter-button__value"> · {valueText}</span> : null}
        <svg className="ff-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="m7 10 5 5 5-5" /></svg>
      </button>
      {open ? (
        <div className={`ff-popover ff-popover--${align}`} role="listbox" aria-label={label}>
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
        </div>
      ) : null}
    </div>
  )
}
