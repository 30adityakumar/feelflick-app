// src/features/landing/components/LandingMobileMenu.jsx
import { useEffect, useRef } from 'react'
import { useLandingAuth } from '../LandingAuth'
import { LANDING_NAV } from './LandingHeader'

export default function LandingMobileMenu({ open, onClose }) {
  const { startGoogleAuth, isAuthenticating } = useLandingAuth()
  const sheetRef = useRef(null)
  const closeRef = useRef(null)
  const triggerRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    triggerRef.current = document.activeElement
    document.body.classList.add('ff-l-locked')
    const id = requestAnimationFrame(() => closeRef.current?.focus())

    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); return }
      if (e.key !== 'Tab') return
      const items = sheetRef.current?.querySelectorAll('a[href],button:not([disabled])')
      if (!items || !items.length) return
      const first = items[0]; const last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.classList.remove('ff-l-locked')
      cancelAnimationFrame(id)
      const t = triggerRef.current
      if (t && t.isConnected) requestAnimationFrame(() => t.focus())
    }
  }, [open, onClose])

  if (!open) return null

  // Both CTAs use the same OAuth entry; the menu closes BEFORE starting OAuth.
  const start = () => { onClose(); startGoogleAuth() }

  return (
    <div className="ff-l-menu-layer">
      <button type="button" className="ff-l-menu-backdrop" aria-label="Close navigation" onClick={onClose} />
      <aside
        ref={sheetRef}
        id="ff-l-mobile-nav"
        className="ff-l-menu-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="FeelFlick navigation"
      >
        <div className="ff-l-menu-head">
          <span className="ff-l-wordmark">FEELFLICK</span>
          <button ref={closeRef} type="button" className="ff-l-menu-close" aria-label="Close navigation" onClick={onClose}>×</button>
        </div>
        <nav className="ff-l-menu-links" aria-label="Landing sections">
          {LANDING_NAV.map(([label, href]) => (
            <a key={href} href={href} onClick={onClose}>{label}</a>
          ))}
        </nav>
        <div className="ff-l-menu-actions">
          <button type="button" className="ff-l-btn ff-l-btn--ghost" onClick={start} disabled={isAuthenticating}>Sign in</button>
          <button type="button" className="ff-l-btn ff-l-btn--primary" onClick={start} disabled={isAuthenticating}>
            {isAuthenticating ? 'Opening Google…' : 'Start with Google'}
          </button>
        </div>
      </aside>
    </div>
  )
}
