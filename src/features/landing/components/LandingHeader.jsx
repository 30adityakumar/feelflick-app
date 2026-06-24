// src/features/landing/components/LandingHeader.jsx
import { useEffect, useState } from 'react'
import { useLandingAuth } from '../LandingAuth'
import LandingMobileMenu from './LandingMobileMenu'

export const LANDING_NAV = [
  ['How it works', '#how-it-works'],
  ['Film File', '#film-file'],
  ['Cinematic DNA', '#cinematic-dna'],
  ['Library', '#library'],
  ['People & control', '#people-control'],
]

export default function LandingHeader() {
  const { startGoogleAuth, isAuthenticating } = useLandingAuth()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <header className="ff-l-header" data-scrolled={scrolled ? 'true' : undefined}>
        <div className="ff-l-shell ff-l-header-inner">
          <a className="ff-l-wordmark" href="#top" aria-label="FeelFlick home">FEELFLICK</a>
          <nav className="ff-l-nav" aria-label="Landing sections">
            {LANDING_NAV.map(([label, href]) => <a key={href} href={href}>{label}</a>)}
          </nav>
          <div className="ff-l-header-actions">
            <button type="button" className="ff-l-btn ff-l-btn--text ff-l-desktop-only" onClick={startGoogleAuth} disabled={isAuthenticating}>Sign in</button>
            <button type="button" className="ff-l-btn ff-l-btn--primary" onClick={startGoogleAuth} disabled={isAuthenticating}>
              {isAuthenticating ? 'Opening Google…' : 'Start with Google'}
            </button>
            <button
              type="button"
              className="ff-l-btn ff-l-btn--ghost ff-l-menu-btn"
              aria-haspopup="dialog"
              aria-expanded={menuOpen}
              aria-controls="ff-l-mobile-nav"
              onClick={() => setMenuOpen(true)}
            >
              Menu
            </button>
          </div>
        </div>
      </header>
      <LandingMobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  )
}
