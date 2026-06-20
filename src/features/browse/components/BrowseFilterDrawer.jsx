// src/features/browse/components/BrowseFilterDrawer.jsx
// Advanced filters — a right drawer on desktop, a bottom sheet on mobile.
// Changes are STAGED in a local draft and only committed to the URL on "Apply";
// "Reset" clears the draft, "Cancel"/Escape/outside-click/×/Close discards it.
// Full dialog a11y: focus moves in on open, is trapped while open, restores to the
// opener on close; background scroll is locked.
//
// These read the catalogue's INFERRED signals — copy says "leans"/"often", never
// absolutes — and never claim availability/providers.

import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import {
  PACING_OPTIONS, INTENSITY_OPTIONS, DEPTH_OPTIONS, DIALOGUE_OPTIONS,
  ATTENTION_OPTIONS, GAP_OPTIONS, VIBE_OPTIONS,
} from '../data'

const EMPTY = { pacing: '', intensity: '', depth: '', dialogue: '', attention: '', gap: '', vibe: [], hideWatched: false, twins: false }

function Segment({ legend, hint, options, value, onChange }) {
  return (
    <fieldset className="ff-drawer-field">
      <legend>{legend}{hint ? <span className="ff-drawer-field__hint"> · {hint}</span> : null}</legend>
      <div className="ff-drawer-seg">
        {options.map((o) => (
          <button key={o.value || '_any'} type="button"
            className={`ff-drawer-seg__btn${value === o.value ? ' is-active' : ''}`}
            aria-pressed={value === o.value} onClick={() => onChange(o.value)}>
            {o.label}
          </button>
        ))}
      </div>
    </fieldset>
  )
}

export default function BrowseFilterDrawer({ open, initial, onClose, onApply, twinsAvailable }) {
  const panelRef = useRef(null)
  const [draft, setDraft] = useState(EMPTY)

  // Sync draft from the committed scope each time the drawer opens.
  useEffect(() => { if (open) setDraft({ ...EMPTY, ...initial, vibe: [...(initial?.vibe || [])] }) }, [open, initial])

  // Scroll lock while open.
  useEffect(() => {
    if (!open) return undefined
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [open])

  // Focus management: capture opener, move focus in, trap Tab, restore on close.
  useEffect(() => {
    if (!open) return undefined
    const opener = document.activeElement
    const panel = panelRef.current
    const focusables = () => Array.from(panel?.querySelectorAll(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ) || [])
    focusables()[0]?.focus()
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); return }
      if (e.key !== 'Tab') return
      const f = focusables()
      if (f.length === 0) return
      const first = f[0]; const last = f[f.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKey, true)
    return () => {
      document.removeEventListener('keydown', onKey, true)
      if (opener && typeof opener.focus === 'function') opener.focus()
    }
  }, [open, onClose])

  if (!open) return null

  const set = (k) => (v) => setDraft((d) => ({ ...d, [k]: v }))
  const toggleVibe = (v) => setDraft((d) => ({ ...d, vibe: d.vibe.includes(v) ? d.vibe.filter((x) => x !== v) : [...d.vibe, v] }))

  return (
    <div className="ff-browse-drawer-root">
      <button type="button" className="ff-browse-drawer__backdrop" aria-label="Close filters" onClick={onClose} tabIndex={-1} />
      <div ref={panelRef} className="ff-browse-drawer" role="dialog" aria-modal="true" aria-label="Advanced filters">
        <header className="ff-browse-drawer__head">
          <h2>Refine</h2>
          <button type="button" className="ff-browse-drawer__close" aria-label="Close filters" onClick={onClose}><X className="h-5 w-5" aria-hidden="true" /></button>
        </header>

        <div className="ff-browse-drawer__body">
          <p className="ff-browse-drawer__note">These read the catalogue’s inferred signals — they lean a film one way, they don’t guarantee it.</p>

          <Segment legend="Pacing" hint="how it tends to move" options={PACING_OPTIONS} value={draft.pacing} onChange={set('pacing')} />
          <Segment legend="Intensity" hint="how charged it leans" options={INTENSITY_OPTIONS} value={draft.intensity} onChange={set('intensity')} />
          <Segment legend="Depth" hint="how much it asks of you" options={DEPTH_OPTIONS} value={draft.depth} onChange={set('depth')} />
          <Segment legend="Dialogue" options={DIALOGUE_OPTIONS} value={draft.dialogue} onChange={set('dialogue')} />
          <Segment legend="Attention" options={ATTENTION_OPTIONS} value={draft.attention} onChange={set('attention')} />
          <Segment legend="Critic / crowd lean" options={GAP_OPTIONS} value={draft.gap} onChange={set('gap')} />

          <fieldset className="ff-drawer-field">
            <legend>Quality lens<span className="ff-drawer-field__hint"> · pick any</span></legend>
            <div className="ff-drawer-chips">
              {VIBE_OPTIONS.map((v) => (
                <button key={v.value} type="button"
                  className={`ff-drawer-chip${draft.vibe.includes(v.value) ? ' is-active' : ''}`}
                  aria-pressed={draft.vibe.includes(v.value)} onClick={() => toggleVibe(v.value)}>
                  <span aria-hidden="true">{v.symbol}</span> {v.label}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="ff-drawer-field">
            <legend>Personal</legend>
            <label className="ff-drawer-toggle">
              <input type="checkbox" checked={draft.hideWatched} onChange={(e) => set('hideWatched')(e.target.checked)} />
              <span>Hide films I’ve already watched</span>
            </label>
            <label className={`ff-drawer-toggle${twinsAvailable ? '' : ' is-disabled'}`}>
              <input type="checkbox" checked={draft.twins} disabled={!twinsAvailable} onChange={(e) => set('twins')(e.target.checked)} />
              <span>Only films your taste twins loved{twinsAvailable ? '' : ' (no taste twins yet)'}</span>
            </label>
          </fieldset>
        </div>

        <footer className="ff-browse-drawer__foot">
          <button type="button" className="ffb-btn ffb-btn--ghost" onClick={() => setDraft(EMPTY)}>Reset</button>
          <div className="ff-browse-drawer__foot-right">
            <button type="button" className="ffb-btn ffb-btn--ghost" onClick={onClose}>Cancel</button>
            <button type="button" className="ffb-btn ffb-btn--primary" onClick={() => onApply(draft)}>Apply filters</button>
          </div>
        </footer>
      </div>
    </div>
  )
}
