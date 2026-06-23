// src/features/preferences/components/useDialogA11y.js
// Shared modal a11y: initial focus, focus trap, Escape, body scroll lock, and
// focus restoration to the trigger. Used by both dialogs so there is one
// implementation.

import { useEffect } from 'react'

export function useDialogA11y(panelRef, { open, onClose, returnFocusRef }) {
  useEffect(() => {
    if (!open) return
    const prevActive = returnFocusRef?.current || document.activeElement
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const focusables = () => Array.from(
      panelRef.current?.querySelectorAll('button:not([disabled]),[href],input,select,textarea,[tabindex]:not([tabindex="-1"])') || []
    )
    requestAnimationFrame(() => { (focusables()[0] || panelRef.current)?.focus() })
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); return }
      if (e.key !== 'Tab') return
      const items = focusables()
      if (!items.length) return
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      if (prevActive && prevActive.isConnected) requestAnimationFrame(() => prevActive.focus())
    }
  }, [open, onClose, panelRef, returnFocusRef])
}
