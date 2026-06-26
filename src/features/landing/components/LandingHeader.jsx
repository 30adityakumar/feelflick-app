// src/features/landing/components/LandingHeader.jsx
// Minimal Landing header (Adaptive Editorial Cinema). The wordmark reuses the
// authenticated app's identity (uppercase, heavy Inter, paper-white — see
// src/app/header/Header.jsx) WITHOUT importing the app header. No navigation. One
// compact "Continue with Google" action (with the official Google mark). On mobile
// the action is revealed only once the hero's primary CTA scrolls out of view
// (IntersectionObserver, with a safe fallback).
import { useEffect, useRef, useState } from 'react'
import { useLandingAuth } from '../LandingAuth'
import GoogleMark from './GoogleMark'

export default function LandingHeader() {
  const { startGoogleAuth, isAuthenticating } = useLandingAuth()
  const [scrolled, setScrolled] = useState(false)
  // Mobile-only: whether the compact header auth CTA is revealed (desktop CSS
  // always shows it regardless of this state).
  const [ctaRevealed, setCtaRevealed] = useState(false)
  const headerRef = useRef(null)
  const ctaRef = useRef(null)
  const heroVisibleRef = useRef(true)

  // Scrolled state (background/shadow) — one passive listener, no layout thrash.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Reveal the mobile header CTA once the hero's primary CTA is no longer visible
  // below the fixed header. Falls back to always-available if observation is not
  // possible, so authentication is never unreachable.
  useEffect(() => {
    const heroCta = document.querySelector('.ff-l-hero-actions .ff-l-btn--primary')
    if (!heroCta || typeof IntersectionObserver === 'undefined') {
      setCtaRevealed(true)
      return undefined
    }
    const topInset = headerRef.current?.offsetHeight || 0
    const io = new IntersectionObserver(
      ([entry]) => {
        heroVisibleRef.current = entry.isIntersecting
        // Never hide a control that currently holds focus.
        if (entry.isIntersecting && document.activeElement === ctaRef.current) return
        setCtaRevealed(!entry.isIntersecting)
      },
      { root: null, rootMargin: `-${topInset}px 0px 0px 0px`, threshold: 0 }
    )
    io.observe(heroCta)
    return () => io.disconnect()
  }, [])

  // If the CTA was kept visible only because it had focus, re-evaluate on blur.
  const handleCtaBlur = () => {
    if (heroVisibleRef.current) setCtaRevealed(false)
  }

  return (
    <header ref={headerRef} className="ff-l-header" data-scrolled={scrolled ? 'true' : undefined}>
      <div className="ff-l-shell ff-l-header-inner">
        <a className="ff-l-wordmark" href="#top" aria-label="FeelFlick home">FEELFLICK</a>
        <div className="ff-l-header-actions">
          <button
            ref={ctaRef}
            type="button"
            className="ff-l-btn ff-l-btn--primary ff-l-header-cta"
            data-revealed={ctaRevealed ? 'true' : undefined}
            onClick={startGoogleAuth}
            onBlur={handleCtaBlur}
            disabled={isAuthenticating}
          >
            <GoogleMark />
            {/* The full label is the accessible name at every width (visually hidden
                on mobile via .ff-l-header-cta__full); the short label is visible on
                mobile and aria-hidden, so the name stays "Continue with Google". */}
            {isAuthenticating ? (
              <>
                <span className="ff-l-header-cta__full">Opening Google…</span>
                <span className="ff-l-header-cta__short" aria-hidden="true">Opening…</span>
              </>
            ) : (
              <>
                <span className="ff-l-header-cta__full">Continue with Google</span>
                <span className="ff-l-header-cta__short" aria-hidden="true">Continue</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  )
}
