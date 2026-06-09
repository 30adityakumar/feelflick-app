// src/features/movie/components/AccessibleMediaDialog.jsx
// F5.4 — the hardened, accessible media (trailer / featurette) dialog for the Film
// File. Replaces the inline TrailerModal. Generic over any YouTube key + caption so
// the hero trailer, the sticky trailer, and featurette tiles can all reuse it.
//
// Accessibility (mirrors the hardened Discover dialog pattern, Movie-local):
//   • role="dialog" + aria-modal="true" + accessible name via aria-labelledby
//   • initial focus → the close control (≥44×44)
//   • Escape closes · backdrop click closes · inside clicks do NOT close
//   • COMPLETE Tab / Shift+Tab focus containment (wraps last↔first; if only the
//     close control is focusable, Tab stays on it)
//   • focus restores to the exact opener element
//   • body scroll lock + cleanup on unmount AND on media-key change
//   • the backdrop is a non-focusable element (NOT a second Close button) — only one
//     accessible Close control exists
//   • the iframe title honestly names the film + video; only one iframe at a time
//   • no autoplay before the dialog is open (the iframe only mounts while open)
//   • decorative curtains are aria-hidden; the entrance animation is CSS-driven and
//     is neutralised under prefers-reduced-motion by the global reduced-motion reset
//
// Video analytics stay at the trigger (not in this generic dialog).

import { useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'

const CAPTION_ID = 'ff-media-dialog-caption'

/**
 * @param {object} props
 * @param {boolean} props.open
 * @param {() => void} props.onClose
 * @param {string|null|undefined} props.youtubeKey
 * @param {string} props.title  full caption, e.g. "Parasite · Official Trailer"
 */
export default function AccessibleMediaDialog({ open, onClose, youtubeKey, title }) {
  const dialogRef = useRef(null)
  const closeBtnRef = useRef(null)
  const openerRef = useRef(null)
  // Hold the latest onClose in a ref so the effect deps stay stable (a parent's
  // inline `() => setOpen(false)` would otherwise re-run the whole effect).
  const onCloseRef = useRef(onClose)
  useEffect(() => { onCloseRef.current = onClose }, [onClose])

  // Scroll lock + Escape + focus trap + initial/return focus. Re-runs when the media
  // key changes so a featurette → trailer swap re-locks/re-focuses cleanly.
  useEffect(() => {
    if (!open || !youtubeKey) return
    openerRef.current = document.activeElement
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const focusables = () => {
      const root = dialogRef.current
      if (!root) return []
      return Array.from(root.querySelectorAll(
        'a[href], button:not([disabled]), iframe, [tabindex]:not([tabindex="-1"])',
      ))
    }
    const onKey = (e) => {
      if (e.key === 'Escape') { onCloseRef.current?.(); return }
      if (e.key !== 'Tab') return
      const items = focusables()
      if (items.length === 0) { e.preventDefault(); return }
      const first = items[0]
      const last = items[items.length - 1]
      const active = document.activeElement
      const root = dialogRef.current
      if (e.shiftKey) {
        if (active === first || !root?.contains(active)) { e.preventDefault(); last.focus() }
      } else if (active === last || !root?.contains(active)) {
        e.preventDefault(); first.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    const focusTimer = setTimeout(() => closeBtnRef.current?.focus(), 0)

    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      clearTimeout(focusTimer)
      const opener = openerRef.current
      if (opener && typeof opener.focus === 'function' && document.contains(opener)) {
        opener.focus()
      }
    }
  }, [open, youtubeKey])

  if (!open || !youtubeKey) return null

  const caption = title || 'Trailer'

  return createPortal(
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={CAPTION_ID}
      className="ff-media-dialog"
      style={{ position: 'fixed', inset: 0, zIndex: 300, animation: 'mv-fade-in 0.4s ease both' }}
    >
      {/* Non-focusable backdrop — click to dismiss. aria-hidden + not a button, so it
          is NOT a second accessible Close control. Keyboard equivalent is Escape + the
          focused X close button. */}
      <div
        aria-hidden="true"
        onClick={() => onCloseRef.current?.()}
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(20px)', cursor: 'pointer' }}
      />
      {/* Decorative curtains — hidden from assistive tech; CSS entrance is neutralised
          under reduced motion by the global reset. */}
      <div aria-hidden="true" className="ff-media-dialog__curtain-l" style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: '50%', background: 'linear-gradient(90deg, rgba(167,139,250,0.25) 0%, transparent 100%)', opacity: 0.6, animation: 'mv-curtain-l 0.6s cubic-bezier(0.2,0.8,0.2,1) both', pointerEvents: 'none' }} />
      <div aria-hidden="true" className="ff-media-dialog__curtain-r" style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: '50%', background: 'linear-gradient(-90deg, rgba(167,139,250,0.25) 0%, transparent 100%)', opacity: 0.6, animation: 'mv-curtain-r 0.6s cubic-bezier(0.2,0.8,0.2,1) both', pointerEvents: 'none' }} />

      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
        <button
          ref={closeBtnRef}
          type="button"
          onClick={() => onCloseRef.current?.()}
          aria-label="Close trailer"
          className="ff-media-dialog__close"
          style={{ position: 'absolute', top: 22, right: 22, width: 44, height: 44, borderRadius: 999, background: 'rgba(0,0,0,0.75)', border: '1px solid rgba(255,255,255,0.28)', color: '#fff', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, lineHeight: 1, zIndex: 5, pointerEvents: 'auto' }}
        >×</button>

        {/* Clicks inside the player must NOT close the dialog. Pure click-intercept;
            no keyboard action expected (the dialog's a11y is the X + Escape). */}
        {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{ position: 'relative', width: 'min(1120px, 90vw)', aspectRatio: '16/9', borderRadius: 12, overflow: 'hidden', pointerEvents: 'auto', boxShadow: '0 40px 120px -20px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.08)', animation: 'mv-zoom-in 0.5s cubic-bezier(0.2,0.8,0.2,1) both' }}
        >
          <iframe
            key={youtubeKey}
            src={`https://www.youtube.com/embed/${youtubeKey}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
            title={caption}
            frameBorder="0"
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
          />
        </div>

        <div id={CAPTION_ID} style={{ position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)', textAlign: 'center', pointerEvents: 'none' }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.28em', textTransform: 'uppercase', color: '#A78BFA', marginBottom: 6 }}>Now Playing</div>
          <div style={{ fontFamily: 'Outfit', fontSize: 18, fontWeight: 500, color: '#FAFAFA', letterSpacing: '-0.015em' }}>{caption}</div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
