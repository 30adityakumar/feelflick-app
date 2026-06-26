// src/features/landing/components/LandingHeader.jsx
import { useEffect, useState } from 'react'
import { useLandingAuth } from '../LandingAuth'
import { LANDING_NAV } from '../data'
import LandingMobileMenu from './LandingMobileMenu'

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
            <button type="button" className="ff-l-btn ff-l-btn--primary ff-l-cta-google" onClick={startGoogleAuth} disabled={isAuthenticating}>
              {isAuthenticating ? 'Opening Google…' : 'Continue with Google'}
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
