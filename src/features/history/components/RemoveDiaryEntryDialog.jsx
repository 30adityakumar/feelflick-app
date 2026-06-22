// src/features/history/components/RemoveDiaryEntryDialog.jsx
// Accessible, hardened confirmation for removing a film from the Diary.
//
// Truthful copy: removal deletes EVERY user_history row for this (user, film) — so the wording is
// "removes this film from your watched history", never "this watch date". The rating + review live
// in user_ratings and are untouched, so the dialog says they remain attached.
//
// State model (driven by the page via `status`): idle → removing → (close on success | error).
//   • idle     — "Keep entry" takes initial focus (safe default); Escape/backdrop cancel.
//   • removing — both actions disabled, dialog aria-busy, "Removing…", Escape/backdrop inert; the
//                dialog STAYS OPEN until the delete settles (no close-before-await).
//   • error    — persistent inline error; "Try again" re-confirms; "Keep entry" cancels.
//
// Self-contained a11y: role="dialog" + aria-modal, labelled heading + described body, focus trap
// (document capture), body scroll-lock while open. Focus restoration (cancel) / focus-next
// (success) are handled by the page. Never uses browser confirm().

import { useEffect, useRef } from 'react'

export default function RemoveDiaryEntryDialog({ title, status = 'idle', onConfirm, onCancel }) {
  const containerRef = useRef(null)
  const keepRef = useRef(null)
  const removeRef = useRef(null)
  const headingId = 'ff-diary-remove-heading'
  const bodyId = 'ff-diary-remove-body'
  const errorId = 'ff-diary-remove-error'
  const removing = status === 'removing'
  const errored = status === 'error'

  // Body scroll-lock while the dialog is mounted.
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  // Initial / state-driven focus: Keep (idle), the dialog itself (removing — buttons disabled),
  // Try again (error).
  useEffect(() => {
    if (removing) containerRef.current?.focus()
    else if (errored) removeRef.current?.focus()
    else keepRef.current?.focus()
  }, [removing, errored])

  // Escape + focus trap (capture phase so it holds without per-node handlers).
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') {
        if (!removing) { e.preventDefault(); onCancel() }
        return
      }
      if (e.key !== 'Tab') return
      const els = [keepRef.current, removeRef.current].filter((el) => el && !el.disabled)
      if (els.length === 0) { e.preventDefault(); return }
      const first = els[0]
      const last = els[els.length - 1]
      const active = document.activeElement
      if (e.shiftKey && active === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && active === last) { e.preventDefault(); first.focus() }
      else if (!els.includes(active)) { e.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKey, true)
    return () => document.removeEventListener('keydown', onKey, true)
  }, [removing, onCancel])

  const onBackdrop = (e) => {
    if (e.target === e.currentTarget && !removing) onCancel()
  }

  const described = errored ? `${bodyId} ${errorId}` : bodyId

  return (
    // Backdrop click-to-cancel is a mouse-only convenience; Escape + the focused "Keep entry"
    // default provide the full keyboard dismissal path, so the static backdrop needs no role.
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div className="ff-diary-dialog-backdrop" onMouseDown={onBackdrop}>
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        aria-describedby={described}
        aria-busy={removing || undefined}
        tabIndex={-1}
        className="ff-diary-dialog"
      >
        <h2 id={headingId} className="ff-diary-dialog__title">Remove from Diary?</h2>
        <p id={bodyId} className="ff-diary-dialog__body">
          This removes &ldquo;{title}&rdquo; from your watched history. Your rating and review remain attached to the film.
        </p>
        {errored ? (
          <p id={errorId} role="alert" className="ff-diary-dialog__error">
            Couldn’t remove this film. Try again.
          </p>
        ) : null}
        <div className="ff-diary-dialog__actions">
          <button
            ref={keepRef}
            type="button"
            onClick={onCancel}
            disabled={removing}
            style={{ minHeight: 44 }}
            className="ff-diary-dialog__btn ff-diary-dialog__btn--keep"
          >Keep entry</button>
          <button
            ref={removeRef}
            type="button"
            onClick={onConfirm}
            disabled={removing}
            aria-busy={removing || undefined}
            style={{ minHeight: 44 }}
            className="ff-diary-dialog__btn ff-diary-dialog__btn--remove"
          >{removing ? 'Removing…' : errored ? 'Try again' : 'Remove from Diary'}</button>
        </div>
      </div>
    </div>
  )
}
