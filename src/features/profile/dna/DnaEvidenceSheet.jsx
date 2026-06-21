// src/features/profile/dna/DnaEvidenceSheet.jsx
// "Why this read?" — accessible dialog separating Measured (direct facts) / Derived (deterministic)
// / Generated (current editorial only). Discloses that generation does not calculate the metrics.
// When the editorial is stale/missing it surfaces the EXISTING governed refresh action (explicit,
// flag-aware, last-valid-preserving). No generation happens on open. Focus trap + Escape + restore
// + body-scroll lock.

import { useEffect, useRef } from 'react'

const FOCUSABLE = 'a[href],button:not([disabled]),input,[tabindex]:not([tabindex="-1"])'

export default function DnaEvidenceSheet({ open, onClose, identity, editorialStatus, refreshStatus, onRefresh }) {
  const sheetRef = useRef(null)
  const restoreRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    restoreRef.current = document.activeElement
    document.body.style.overflow = 'hidden'
    const sheet = sheetRef.current
    const first = sheet?.querySelector(FOCUSABLE)
    first?.focus()
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); return }
      if (e.key !== 'Tab') return
      const f = [...(sheet?.querySelectorAll(FOCUSABLE) || [])]
      if (f.length === 0) return
      const a = f[0]; const b = f[f.length - 1]
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); b.focus() }
      else if (!e.shiftKey && document.activeElement === b) { e.preventDefault(); a.focus() }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      if (restoreRef.current instanceof HTMLElement) restoreRef.current.focus()
    }
  }, [open, onClose])

  if (!open) return null
  const canRefresh = identity && !identity.forming && (editorialStatus === 'stale' || editorialStatus === 'none')
  return (
    <div className="ff-dna-overlay">
      <button type="button" className="ff-dna-overlay__backdrop" aria-label="Close" tabIndex={-1} onClick={onClose} />
      <div className="ff-dna-sheet" role="dialog" aria-modal="true" aria-labelledby="ff-dna-evidence-title" ref={sheetRef}>
        <div className="ff-dna-sheet__head">
          <div>
            <p className="ff-dna-eyebrow">How this is built</p>
            <h2 id="ff-dna-evidence-title">Evidence first. Language second.</h2>
          </div>
          <button type="button" className="ff-dna-icon-btn" aria-label="Close" onClick={onClose}>×</button>
        </div>
        <p className="ff-dna-sheet__intro">Cinematic DNA separates what happened, what FeelFlick computed, and what the language model interpreted.</p>
        <div className="ff-dna-layer"><div className="ff-dna-layer__label">Measured</div><div><strong>Your activity</strong><p>Watched films, ratings and their distribution, repeated directors, and watch dates — direct facts from your account.</p></div></div>
        <div className="ff-dna-layer"><div className="ff-dna-layer__label">Derived</div><div><strong>Deterministic patterns</strong><p>Your archetype, evidence-maturity band, rating language, journey chapters, the normalized director order, and your passport tags — each computed by an inspectable formula.</p></div></div>
        <div className="ff-dna-layer"><div className="ff-dna-layer__label">Generated</div><div><strong>FeelFlick reflection</strong><p>Only the short written reflection (summary + signature) is generated, from a bounded packet of the evidence above. {identity?.reflectionCurrent ? 'It is current.' : editorialStatus === 'stale' ? 'It needs refreshing.' : 'It has not been generated yet.'}</p></div></div>
        <div className="ff-dna-llm-note">
          <strong>The language model does not calculate your profile.</strong>
          <p>It writes the human-readable interpretation only. Every count, rating, percentage and ranking is computed deterministically. It may be imperfect, your profile stays private, and the reflection is only ever (re)generated when you ask.</p>
        </div>
        <div className="ff-dna-sheet__actions">
          <button type="button" className="ff-dna-btn ff-dna-btn--secondary" onClick={onClose}>Done</button>
          {canRefresh ? (
            <button type="button" className="ff-dna-btn ff-dna-btn--primary" onClick={onRefresh} disabled={refreshStatus === 'generating'} aria-busy={refreshStatus === 'generating'}>
              {refreshStatus === 'generating' ? 'Generating…' : refreshStatus === 'error' ? 'Try again' : 'Generate reflection'}
            </button>
          ) : null}
        </div>
        {refreshStatus === 'error' ? <p className="ff-dna-share__note" role="status">Couldn’t refresh the reflection just now. Your last reflection is unchanged.</p> : null}
        {refreshStatus === 'success' ? <p className="ff-dna-share__note" role="status">Your FeelFlick reflection is updated.</p> : null}
      </div>
    </div>
  )
}
