// src/features/landing/components/TopNav.jsx
import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LogIn, Menu, X } from 'lucide-react'
import { supabase } from '@/shared/lib/supabase/client'

/**
 * Top Navigation - Premium glassmorphism nav with smooth scroll
 * 
 * Features:
 * - Smart scroll detection with requestAnimationFrame
 * - Glassmorphism background on scroll
 * - Smooth mobile menu with focus trap
 * - Keyboard navigation (Escape to close)
 * - Accessible ARIA labels
 * - Touch-optimized buttons
 */
export default function TopNav({ hideAuthCta = false }) {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const barRef = useRef(null)
  const mobileMenuRef = useRef(null)
  const navigate = useNavigate()
  const location = useLocation()

  // Don't show nav on onboarding pages
  if (location.pathname.startsWith('/onboarding')) {
    return null
  }

  // Set CSS variable for nav height (for other components to use)
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

  // Optimized scroll detection with requestAnimationFrame
  useEffect(() => {
    let ticking = false
    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        setScrolled(window.scrollY > 20)
        ticking = false
      })
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Focus trap for mobile menu
  useEffect(() => {
    if (!mobileMenuOpen || !mobileMenuRef.current) return

    const focusableElements = mobileMenuRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

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

  // Close mobile menu on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false)
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [mobileMenuOpen])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileMenuOpen])

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

  const scrollToSection = (sectionId) => {
    setMobileMenuOpen(false)

    const doScroll = () => {
      const element = document.getElementById(sectionId)
      if (element) {
        const offset = 80
        const elementPosition = element.getBoundingClientRect().top + window.scrollY
        window.scrollTo({
          top: elementPosition - offset,
          behavior: 'smooth',
        })
      }
    }

    if (location.pathname !== '/') {
      navigate('/')
      setTimeout(doScroll, 100)
    } else {
      doScroll()
    }
  }

  // Google OAuth sign in handler
  const handleSignIn = async () => {
    if (isAuthenticating) return
    setIsAuthenticating(true)
    setMobileMenuOpen(false)

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/onboarding`,
        },
      })
      if (error) throw error
    } catch (error) {
      console.error('Auth error:', error)
      alert('Sign in failed. Please try again.')
    } finally {
      setIsAuthenticating(false)
    }
  }

  return (
    <>
      <nav
        id="top-nav"
        ref={barRef}
        className={`
          fixed inset-x-0 top-0 z-50 transition-all duration-300
          ${scrolled
            ? 'bg-black/80 backdrop-blur-xl border-b border-white/10 shadow-lg shadow-black/20'
            : 'bg-transparent'
          }
        `}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Brand Logo */}
            <Link
              to="/"
              onClick={onBrandClick}
              className="group relative transition-transform hover:scale-105 active:scale-95 touch-target"
              aria-label="FeelFlick home"
            >
              <span className="text-2xl sm:text-3xl font-black tracking-tight bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                FEELFLICK
              </span>
              {/* Shimmer effect on hover */}
              <span 
                className="absolute inset-0 bg-gradient-to-r from-purple-400/0 via-pink-400/30 to-purple-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl -z-10"
                aria-hidden="true"
              />
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <NavLink onClick={() => scrollToSection('how-it-works')}>
                How It Works
              </NavLink>
              <NavLink onClick={() => scrollToSection('features')}>
                Features
              </NavLink>
              <NavLink onClick={() => scrollToSection('testimonials')}>
                Reviews
              </NavLink>
            </div>

            {/* Desktop Auth CTA */}
            {!hideAuthCta && (
              <div className="hidden md:block">
                <button
                  onClick={handleSignIn}
                  disabled={isAuthenticating}
                  className="group inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed touch-target"
                  aria-label={isAuthenticating ? 'Signing in' : 'Sign in to FeelFlick'}
                >
                  {isAuthenticating ? (
                    <>
                      <svg 
                        className="animate-spin h-4 w-4" 
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-hidden="true"
                      >
                        <circle 
                          className="opacity-25" 
                          cx="12" 
                          cy="12" 
                          r="10" 
                          stroke="currentColor" 
                          strokeWidth="4"
                        />
                        <path 
                          className="opacity-75" 
                          fill="currentColor" 
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      <span>Signing In...</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" aria-hidden="true" />
                      <span>Sign In</span>
                    </>
                  )}
                </button>
              </div>
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
      </nav>

      {/* Mobile Menu */}
      <div
        id="mobile-menu"
        ref={mobileMenuRef}
        className={`
          fixed inset-0 z-40 md:hidden transition-all duration-300
          ${mobileMenuOpen
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
          }
        `}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation"
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/90 backdrop-blur-xl"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
        
        {/* Menu Content */}
        <div className="relative h-full flex flex-col pt-24 pb-8 px-6">
          <nav className="flex flex-col gap-2" role="list">
            <MobileNavLink onClick={() => scrollToSection('how-it-works')}>
              How It Works
            </MobileNavLink>
            <MobileNavLink onClick={() => scrollToSection('features')}>
              Features
            </MobileNavLink>
            <MobileNavLink onClick={() => scrollToSection('testimonials')}>
              Reviews
            </MobileNavLink>
          </nav>

          {/* Mobile Auth CTA */}
          {!hideAuthCta && (
            <button
              onClick={handleSignIn}
              disabled={isAuthenticating}
              className="mt-8 w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold shadow-lg shadow-purple-500/50 transition-all duration-300 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed touch-target"
              aria-label={isAuthenticating ? 'Signing in' : 'Sign in to FeelFlick'}
            >
              {isAuthenticating ? (
                <>
                  <svg 
                    className="animate-spin h-5 w-5" 
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <circle 
                      className="opacity-25" 
                      cx="12" 
                      cy="12" 
                      r="10" 
                      stroke="currentColor" 
                      strokeWidth="4"
                    />
                    <path 
                      className="opacity-75" 
                      fill="currentColor" 
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" aria-hidden="true" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </>
  )
}

/**
 * Desktop navigation link with underline animation
 */
function NavLink({ onClick, children }) {
  return (
    <button
      onClick={onClick}
      className="relative text-sm font-medium text-white/70 hover:text-white transition-colors group touch-target"
    >
      {children}
      <span 
        className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 group-hover:w-full transition-all duration-300"
        aria-hidden="true"
      />
    </button>
  )
}

/**
 * Mobile navigation link with background highlight
 */
function MobileNavLink({ onClick, children }) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-3 rounded-xl text-lg font-semibold text-white/80 hover:text-white hover:bg-white/10 transition-all text-left touch-target"
      role="listitem"
    >
      {children}
    </button>
  )
}