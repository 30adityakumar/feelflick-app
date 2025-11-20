// src/features/landing/components/TopNav.jsx
import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Film, LogIn, Menu, X } from 'lucide-react'

/**
 * 🎬 TOP NAVIGATION
 * 
 * Premium glassmorphism nav with:
 * - Sticky blur background on scroll
 * - Purple/pink gradient logo
 * - Mobile menu
 * - Smooth animations
 * 
 * Inspired by: Plex, Apple TV+, Netflix
 */
export default function TopNav({ hideAuthCta = false, onAuthOpen }) {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const barRef = useRef(null)
  const navigate = useNavigate()
  const location = useLocation()

  // Hide on onboarding
  if (location.pathname.startsWith('/onboarding')) {
    return null
  }

  // Set CSS variable for TopNav height
  useEffect(() => {
    const setVar = () => {
      const h = barRef.current?.offsetHeight || 72
      document.documentElement.style.setProperty('--topnav-h', `${h}px`)
    }
    setVar()
    const ro = new ResizeObserver(setVar)
    if (barRef.current) ro.observe(barRef.current)
    return () => ro.disconnect()
  }, [])

  // Scroll detection for glassmorphism
  useEffect(() => {
    let ticking = false
    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        setScrolled((window.scrollY || document.documentElement.scrollTop) > 20)
        ticking = false
      })
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

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

  return (
    <>
      {/* Main Nav */}
      <nav
        ref={barRef}
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-black/80 backdrop-blur-xl border-b border-white/10 shadow-lg shadow-black/20'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            
            {/* Logo */}
            <Link
              to="/"
              onClick={onBrandClick}
              className="group flex items-center gap-2 sm:gap-3 transition-transform hover:scale-105 active:scale-95"
            >
              {/* Icon */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
                  <Film className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
              </div>
              
              {/* Brand Text */}
              <span className="text-xl sm:text-2xl font-black tracking-tight">
                <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                  Feel
                </span>
                <span className="text-white">Flick</span>
              </span>
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center gap-8">
              <NavLink to="/#how-it-works">How It Works</NavLink>
              <NavLink to="/#features">Features</NavLink>
              <NavLink to="/#testimonials">Reviews</NavLink>
            </div>

            {/* Desktop CTA */}
            {!hideAuthCta && (
              <div className="hidden md:block">
                <button
                  onClick={onAuthOpen}
                  className="group inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105 active:scale-95"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </button>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div
        className={`fixed inset-0 z-40 md:hidden transition-all duration-300 ${
          mobileMenuOpen
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/90 backdrop-blur-xl"
          onClick={() => setMobileMenuOpen(false)}
        />

        {/* Menu Content */}
        <div className="relative h-full flex flex-col pt-24 pb-8 px-6">
          <nav className="flex flex-col gap-2">
            <MobileNavLink to="/#how-it-works" onClick={() => setMobileMenuOpen(false)}>
              How It Works
            </MobileNavLink>
            <MobileNavLink to="/#features" onClick={() => setMobileMenuOpen(false)}>
              Features
            </MobileNavLink>
            <MobileNavLink to="/#testimonials" onClick={() => setMobileMenuOpen(false)}>
              Reviews
            </MobileNavLink>
          </nav>

          {/* Mobile CTA */}
          {!hideAuthCta && (
            <button
              onClick={() => {
                setMobileMenuOpen(false)
                onAuthOpen()
              }}
              className="mt-8 w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold shadow-lg shadow-purple-500/50"
            >
              <LogIn className="w-5 h-5" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </>
  )
}

/**
 * Desktop Nav Link
 */
function NavLink({ to, children }) {
  return (
    <a
      href={to}
      className="relative text-sm font-medium text-white/70 hover:text-white transition-colors group"
    >
      {children}
      <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 group-hover:w-full transition-all duration-300" />
    </a>
  )
}

/**
 * Mobile Nav Link
 */
function MobileNavLink({ to, onClick, children }) {
  return (
    <a
      href={to}
      onClick={onClick}
      className="px-4 py-3 rounded-xl text-lg font-semibold text-white/80 hover:text-white hover:bg-white/10 transition-all"
    >
      {children}
    </a>
  )
}
