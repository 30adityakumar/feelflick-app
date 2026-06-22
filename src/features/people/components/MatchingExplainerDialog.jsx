// src/features/people/components/MatchingExplainerDialog.jsx
// One shared accessible explainer dialog, opened by BOTH the masthead "How matching works" and the
// Strongest "No exact percentages" triggers. role=dialog + aria-modal, labelled + described, initial
// focus on Close, Tab-trapped, Escape + backdrop (idle) dismiss, body scroll-lock, focus restoration
// handled by the caller. Distinguishes taste-match discovery (opt-in) from name search.

import { useEffect, useRef } from 'react'

export default function MatchingExplainerDialog({ open, onClose }) {
  const closeRef = useRef(null)
  const dialogRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    function onKey(e) {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); return }
      if (e.key !== 'Tab') return
      const els = dialogRef.current?.querySelectorAll('button, [href], [tabindex]:not([tabindex="-1"])')
      if (!els || !els.length) return
      const first = els[0]; const last = els[els.length - 1]; const a = document.activeElement
      if (e.shiftKey && a === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && a === last) { e.preventDefault(); first.focus() }
      else if (![...els].includes(a)) { e.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKey, true)
    return () => { document.removeEventListener('keydown', onKey, true); document.body.style.overflow = prevOverflow }
  }, [open, onClose])

  if (!open) return null
  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions -- backdrop click is mouse-only convenience; Escape + Close give full keyboard dismissal
    <div className="ff-people-dialog-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="ff-people-explainer-h" aria-describedby="ff-people-explainer-intro" tabIndex={-1} className="ff-people-dialog">
        <div className="ff-people-dialog__top">
          <div>
            <p className="ff-people-dialog__eyebrow">Taste matching</p>
            <h2 id="ff-people-explainer-h" className="ff-people-dialog__title">What a match means</h2>
          </div>
          <button ref={closeRef} type="button" className="ff-people-dialog__close" aria-label="Close matching explanation" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
          </button>
        </div>
        <p id="ff-people-explainer-intro" className="ff-people-dialog__intro">
          A taste match is a cautious algorithmic estimate. It is not friendship, mutual interest or an endorsement.
        </p>
        <ul className="ff-people-dialog__list">
          <li>FeelFlick shows a confident qualitative label only when there is enough shared-film evidence.</li>
          <li>Exact percentages are not shown.</li>
          <li>People never exposes another member’s private ratings, reviews, Diary entries, watched-film titles or watched dates.</li>
          <li>Following is one-way. It helps you find someone again and does not imply reciprocity.</li>
          <li>You can opt out of automatic taste-match discovery from Account → Privacy.</li>
        </ul>
        <p className="ff-people-dialog__foot">
          <strong>Name search is separate.</strong> It is a signed-in member search by name only — it never searches ratings, reviews, Diary entries or watched films, and the privacy opt-out above does not hide a member from name search.
        </p>
      </div>
    </div>
  )
}
