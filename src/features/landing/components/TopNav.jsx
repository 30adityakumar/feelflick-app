// src/features/landing/components/TopNav.jsx
import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Menu, X, LogIn } from 'lucide-react'
import { useGoogleAuth } from '@/features/landing/utils/useGoogleAuth'

// === CONSTANTS ===

/**
 * Nav height by breakpoint (px).
 * h-16 (mobile) / h-20 (desktop) Tailwind classes must match these values.
 * Used for scroll-offset math and offsetHeight fallback.
 */
const NAV_HEIGHT = { mobile: 64, desktop: 80 }

/** Route-based page links rendered in the center of the nav bar. */
const PAGE_LINKS = [
  { label: 'About',   to: '/about'    },
  { label: 'Browse',  to: '/browse'   },
  { label: 'Moods',   to: '/discover' },
]

/**
 * Top Navigation — cinematic glassmorphism nav, always visible.
 *
 * Features:
 * - Always-visible: transparent at top (<60px), bg-black/70 + blur after scroll
 * - requestAnimationFrame-throttled scroll handler
 * - Active section indicator via IntersectionObserver (50% threshold)
 * - Dual desktop CTA: "Sign In" text link + "Get Started Free" pill
 * - Rebuilt mobile menu: slide-down panel with full-width gradient CTA
 * - Focus trap, Escape key close, body scroll lock (all preserved)
 * - ResizeObserver sets --topnav-h CSS variable for downstream components
 */
export default function TopNav({ hideAuthCta = false }) {
  const [scrolled, setScrolled]           = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { signInWithGoogle, isAuthenticating } = useGoogleAuth()
  const barRef        = useRef(null)
  const mobileMenuRef = useRef(null)
  const navigate  = useNavigate()
  const location  = useLocation()

  // === CSS VARIABLE — nav height for downstream components ===
  useEffect(() => {
    const setVar = () => {
      const h = barRef.current?.offsetHeight || NAV_HEIGHT.mobile
      document.documentElement.style.setProperty('--topnav-h', `${h}px`)
    }
    setVar()
    const ro = new ResizeObserver(setVar)
    if (barRef.current) ro.observe(barRef.current)
    return () => ro.disconnect()
  }, [])

  // === SCROLL — transparent at top, frosted after 60px ===
  useEffect(() => {
    let ticking = false
    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        setScrolled(window.scrollY > 60)
        ticking = false
      })
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // === FOCUS TRAP — mobile menu ===
  useEffect(() => {
    if (!mobileMenuOpen || !mobileMenuRef.current) return
    const focusableElements = mobileMenuRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const firstElement = focusableElements[0]
    const lastElement  = focusableElements[focusableElements.length - 1]
    firstElement?.focus()
    const handleTab = (e) => {
      if (e.key !== 'Tab') return
      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault()
        lastElement?.focus()
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault()
        firstElement?.focus()
      }
    }
    document.addEventListener('keydown', handleTab)
    return () => document.removeEventListener('keydown', handleTab)
  }, [mobileMenuOpen])

  // === KEYBOARD — Escape closes mobile menu ===
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && mobileMenuOpen) setMobileMenuOpen(false)
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [mobileMenuOpen])

  // === BODY SCROLL LOCK — when mobile menu is open ===
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileMenuOpen])

  // === HANDLERS ===

  const onBrandClick = (e) => {
    e.preventDefault()
    setMobileMenuOpen(false)
    if (location.pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      navigate('/')
      setTimeout(() => window.scrollTo({ top: 0, behavior: 'auto' }), 0)
    }
  }

  const handleSignIn = () => {
    setMobileMenuOpen(false)
    signInWithGoogle()
  }

  // Don't render on onboarding pages — checked after all hooks
  if (location.pathname.startsWith('/onboarding')) return null

  return (
    <>
      {/* === MAIN NAV BAR === */}
      <nav
        id="top-nav"
        ref={barRef}
        className={[
          'fixed inset-x-0 top-0 z-50 transition-all duration-300',
          scrolled
            ? 'bg-black/70 backdrop-blur-md border-b border-white/10'
            : 'bg-transparent',
        ].join(' ')}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* h-16 / h-20 matches NAV_HEIGHT.mobile (64px) / NAV_HEIGHT.desktop (80px) */}
          <div className="relative flex items-center justify-between h-16 sm:h-20">

            {/* === BRAND LOGO === */}
            <Link
              to="/"
              onClick={onBrandClick}
              className="transition-opacity hover:opacity-80 active:scale-95 touch-target"
              aria-label="FeelFlick home"
            >
              {/* TODO: move gradient to design tokens — from-purple-500 to-pink-500 */}
              <span className="text-2xl sm:text-3xl font-black tracking-tight bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                FEELFLICK
              </span>
            </Link>

            {/* === DESKTOP NAV LINKS — absolutely centred between logo and CTAs === */}
            <nav
              className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2"
              aria-label="Site navigation"
            >
              {PAGE_LINKS.map((link) => {
                const isActive = location.pathname === link.to
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={[
                      'group relative text-sm font-medium transition-colors duration-200',
                      isActive ? 'text-white' : 'text-white/60 hover:text-white',
                    ].join(' ')}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {link.label}
                    {/* Gradient underline — always rendered, scales in on hover or active */}
                    <span
                      className={[
                        'absolute -bottom-1 left-0 right-0 h-[2px] rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-transform duration-200 origin-left',
                        isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100',
                      ].join(' ')}
                      aria-hidden="true"
                    />
                  </Link>
                )
              })}
            </nav>

            {/* === RIGHT SIDE: Sign in button + mobile toggle === */}
            <div className="flex items-center gap-3">

              {/* Desktop Sign in — gradient pill */}
              {!hideAuthCta && (
                <button
                  onClick={handleSignIn}
                  disabled={isAuthenticating}
                  className="hidden md:inline-flex items-center gap-2 text-sm font-semibold px-5 py-2 rounded-full border border-white/20 text-white/70 hover:text-white hover:border-white/40 hover:bg-white/5 active:scale-[0.97] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label={isAuthenticating ? 'Signing in' : 'Sign in to FeelFlick'}
                >
                  {isAuthenticating ? (
                    'Signing in…'
                  ) : (
                    <>
                      <LogIn className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                      Sign In
                    </>
                  )}
                </button>
              )}

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors touch-target"
                aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={mobileMenuOpen}
                aria-controls="mobile-menu"
              >
                {mobileMenuOpen ? (
                  <X className="w-6 h-6" aria-hidden="true" />
                ) : (
                  <Menu className="w-6 h-6" aria-hidden="true" />
                )}
              </button>

            </div>
          </div>
        </div>
      </nav>

      {/* === MOBILE MENU — slide-down panel === */}
      <div
        id="mobile-menu"
        ref={mobileMenuRef}
        className={[
          'fixed inset-0 z-40 md:hidden',
          mobileMenuOpen ? 'pointer-events-auto' : 'pointer-events-none',
        ].join(' ')}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation"
      >
        {/* Backdrop — fades in behind the panel */}
        <div
          className={[
            'absolute inset-0 bg-black/60 transition-opacity duration-300',
            mobileMenuOpen ? 'opacity-100' : 'opacity-0',
          ].join(' ')}
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />

        {/* Slide-down panel — translates from above viewport */}
        {/* bg-[#0A0A0F]/98 = --bg-base at 98% opacity */}
        <div
          className={[
            'absolute inset-x-0 top-0',
            'bg-[#0A0A0F]/98 backdrop-blur-2xl',
            'transition-transform duration-300',
            mobileMenuOpen ? 'translate-y-0' : '-translate-y-full',
          ].join(' ')}
        >
          {/* Spacer — matches nav bar height so content clears the bar */}
          {/* h-16 / h-20 matches NAV_HEIGHT.mobile / NAV_HEIGHT.desktop */}
          <div className="h-16 sm:h-20" aria-hidden="true" />

          {/* Nav links */}
          <div className="px-6 pt-2 pb-4 flex flex-col gap-1">
            {PAGE_LINKS.map((link) => {
              const isActive = location.pathname === link.to
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={[
                    'w-full text-left text-sm font-medium py-3 min-h-[44px] transition-colors duration-200',
                    isActive ? 'text-white' : 'text-white/60 hover:text-white',
                  ].join(' ')}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {link.label}
                </Link>
              )
            })}
          </div>

          {/* Divider */}
          {/* border-white/10 = --bg-elevated equiv border */}
          <div className="border-t border-white/10 mx-6" aria-hidden="true" />

          {/* CTAs */}
          {!hideAuthCta && (
            <div className="px-6 py-6 flex flex-col gap-3">

              {/* Primary CTA — full-width gradient */}
              <button
                onClick={handleSignIn}
                disabled={isAuthenticating}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold shadow-lg shadow-purple-500/30 transition-all duration-300 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed touch-target"
                aria-label={isAuthenticating ? 'Signing in' : 'Get started free with FeelFlick'}
              >
                {isAuthenticating ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Signing In…</span>
                  </>
                ) : (
                  <span>Get Started Free</span>
                )}
              </button>

              {/* Sign In — secondary text link for returning users */}
              <p className="text-center text-sm text-white/40">
                Already have an account?{' '}
                <button
                  onClick={handleSignIn}
                  disabled={isAuthenticating}
                  className="text-white/70 hover:text-white transition-colors font-medium underline underline-offset-2 disabled:opacity-50"
                >
                  Sign In
                </button>
              </p>
            </div>
          )}

          {/* Value prop */}
          <div className="px-6 pb-8">
            <p className="text-xs text-white/30 text-center">
              6,700+ curated films · Mood-matched · Free forever
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
