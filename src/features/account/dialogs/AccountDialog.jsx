// src/features/account/dialogs/AccountDialog.jsx
// Production dialog for Account flows. The shared <Modal> doesn't trap Tab focus or lock body
// scroll, so this is purpose-built: role="dialog" + aria-modal, initial focus, focus TRAP,
// Escape-when-not-busy, backdrop dismiss-when-not-busy, focus restoration, body scroll lock.
// Rendered inside .ff-acct so the scoped CSS vars resolve; reduced motion handled in CSS.
// Mobile: bottom-sheet with safe-area + BottomNav clearance (see account.css).

import { useEffect, useRef } from 'react'

const FOCUSABLE = 'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])'

export default function AccountDialog({ titleId, describedById, onClose, busy = false, initialFocus, children }) {
  const dialogRef = useRef(null)
  const openerRef = useRef(null)

  useEffect(() => {
    openerRef.current = document.activeElement
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    // Initial focus: caller-provided field, else first focusable, else the dialog itself.
    const focusTarget = initialFocus?.current || dialogRef.current?.querySelector(FOCUSABLE) || dialogRef.current
    focusTarget?.focus()
    return () => {
      document.body.style.overflow = prevOverflow
      const opener = openerRef.current
      if (opener && typeof opener.focus === 'function') opener.focus()
    }
  }, [initialFocus])

  // Escape-when-not-busy + Tab focus trap. Listener lives on document so the overlay stays a
  // plain (non-interactive) element; focus is already trapped inside the dialog.
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape' && !busy) { e.stopPropagation(); onClose(); return }
      if (e.key !== 'Tab' || !dialogRef.current) return
      const nodes = Array.from(dialogRef.current.querySelectorAll(FOCUSABLE)).filter((n) => n.offsetParent !== null || n === document.activeElement)
      if (nodes.length === 0) { e.preventDefault(); return }
      const first = nodes[0]
      const last = nodes[nodes.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKeyDown, true)
    return () => document.removeEventListener('keydown', onKeyDown, true)
  }, [busy, onClose])

  return (
    <div className="ff-acct-overlay">
      <button type="button" className="ff-acct-overlay__scrim" tabIndex={-1} aria-label="Close" onClick={() => !busy && onClose()} />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={describedById}
        tabIndex={-1}
        className="ff-acct-dialog"
      >
        {children}
      </div>
    </div>
  )
}
