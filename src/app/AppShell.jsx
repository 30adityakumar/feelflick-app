// src/app/AppShell.jsx
import { useEffect, useRef, useState } from 'react'
import { Outlet, useLocation, NavLink } from 'react-router-dom'
import { Home, Sparkles, User, Compass, LogIn } from 'lucide-react'
import Header from '@/app/header/Header'
import SearchBar from '@/app/header/components/SearchBar'
import { useAuthSession } from '@/shared/hooks/useAuthSession'
import { useGoogleAuth } from '@/features/landing/utils/useGoogleAuth'
import { identify, resetAnalytics, track } from '@/shared/services/analytics'

export default function AppShell() {
  const [searchOpen, setSearchOpen] = useState(false)
  const [headerVisible, setHeaderVisible] = useState(true)
  const lastScrollY = useRef(0)
  const ticking = useRef(false)
  const location = useLocation()
  const { user, isAuthenticated } = useAuthSession()

  // Keyboard shortcut for search (/)
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const target = e.target
        // Don't trigger if user is typing in an input/textarea
        if (
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable
        ) {
          return
        }
        e.preventDefault()
        setSearchOpen(true)
      }
      
      // Escape closes search
      if (e.key === 'Escape' && searchOpen) {
        setSearchOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [searchOpen])

  // Smart header hide-on-scroll (Netflix-style)
  useEffect(() => {
    const handleScroll = () => {
      if (!ticking.current) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY
          
          // Show header when scrolling up or at top
          if (currentScrollY < lastScrollY.current || currentScrollY < 100) {
            setHeaderVisible(true)
          } 
          // Hide header when scrolling down (beyond 100px)
          else if (currentScrollY > 100 && currentScrollY > lastScrollY.current) {
            setHeaderVisible(false)
          }
          
          lastScrollY.current = currentScrollY
          ticking.current = false
        })
        ticking.current = true
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Reset header visibility on route change + track page view
  useEffect(() => {
    setHeaderVisible(true)
    track('page_viewed', { path: location.pathname })

    const prefersReducedMotion =
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    })
  }, [location.pathname])

  // Identify / reset on auth state change
  const prevUserIdRef = useRef(null)
  useEffect(() => {
    const uid = user?.id ?? null
    if (uid && uid !== prevUserIdRef.current) {
      identify(uid, {
        email: user.email,
        name: user.user_metadata?.name,
      })
    } else if (!uid && prevUserIdRef.current) {
      resetAnalytics()
    }
    prevUserIdRef.current = uid
  }, [user])

  return (
    <div className="relative min-h-screen text-white">
      {/* Page background */}
      <div aria-hidden className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-black" />
        <div className="absolute -top-60 left-1/2 -translate-x-1/2 h-[600px] w-[600px] rounded-full bg-purple-500/8 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-pink-500/6 blur-[100px] pointer-events-none" />
      </div>

      {/* Header - Fixed at top with smart hide */}
      <div 
        className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ${
          headerVisible ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <Header onOpenSearch={() => setSearchOpen(true)} />
      </div>

      {/* Page content - Full width, with bottom padding for mobile nav */}
      <main
        className={`relative z-10 w-full ${isAuthenticated ? 'pb-20 md:pb-0' : ''}`}
        style={{ paddingTop: 'var(--hdr-h, 56px)' }}
      >
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation */}
      {isAuthenticated ? (
        <nav
          className="fixed bottom-0 left-0 right-0 z-40 md:hidden border-t border-white/8 bg-black/95 backdrop-blur-xl"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
          aria-label="Mobile navigation"
        >
          <div className="flex items-center justify-around h-16 px-1">
            <MobileNavLink to="/home"           icon={Home}     label="Home"     />
            <MobileNavLink to="/browse"         icon={Compass}  label="Browse"   />
            <MobileNavLink to="/discover"       icon={Sparkles} label="Discover" />
            <MobileNavLink to="/mobile-account" icon={User}     label="Account"  />
          </div>
        </nav>
      ) : (
        <UnauthMobileNav />
      )}


      {/* Global search modal */}
      <SearchBar open={searchOpen} onClose={() => setSearchOpen(false)} />
      
      {/* Loading indicator for route transitions */}
      <RouteLoadingIndicator />
    </div>
  )
}

/**
 * Minimal mobile bottom nav for unauthenticated users on public app routes.
 */
function UnauthMobileNav() {
  const { signInWithGoogle, isAuthenticating } = useGoogleAuth()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden border-t border-white/8 bg-black/95 backdrop-blur-xl"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="Mobile navigation"
    >
      <div className="flex items-center justify-around h-16 px-1">
        <MobileNavLink to="/discover" icon={Sparkles} label="Discover" />
        <MobileNavLink to="/browse"   icon={Compass}  label="Browse"   />
        <MobileNavLink
          icon={LogIn}
          label={isAuthenticating ? 'Signing in…' : 'Sign In'}
          onClick={isAuthenticating ? undefined : signInWithGoogle}
        />
      </div>
    </nav>
  )
}

/**
 * Mobile navigation link component
 */
function MobileNavLink({ to, icon: Icon, label, onClick }) {
  const location = useLocation()
  const isActive = location.pathname === to
  const Component = onClick ? 'button' : NavLink

  return (
    <Component
      to={onClick ? undefined : to}
      onClick={onClick}
      className={`flex min-w-[56px] flex-col items-center justify-center gap-1 rounded-xl px-3 py-1.5 transition-colors duration-200 ${
        isActive ? 'text-white' : 'text-white/40 hover:text-white/70'
      }`}
      aria-label={label}
      aria-current={isActive ? 'page' : undefined}
    >
      <div className={`relative flex items-center justify-center transition-transform duration-200 ${isActive ? 'scale-110' : ''}`}>
        <Icon
          className={`h-5 w-5 transition duration-200 ${
            isActive ? 'stroke-[2.5] drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]' : 'stroke-[1.8]'
          }`}
          style={isActive ? { color: 'rgb(192,132,252)' } : {}}
        />
      </div>
      <span className={`text-[10px] leading-none font-medium transition-colors duration-200 ${
        isActive ? 'text-purple-300' : ''
      }`}>
        {label}
      </span>
    </Component>
  )
}

/**
 * Shows a subtle loading indicator during route transitions
 * Apple-inspired, minimal, non-intrusive
 */
function RouteLoadingIndicator() {
  const [loading, setLoading] = useState(false)
  const location = useLocation()
  const timeoutRef = useRef(null)
  const clearTimeoutRef = useRef(null)

  useEffect(() => {
    // Clear any existing timeouts
    if (clearTimeoutRef.current) {
      clearTimeout(clearTimeoutRef.current)
    }
    
    // Show loading indicator after a short delay (avoid flash for fast loads)
    setLoading(false) // Reset first
    timeoutRef.current = setTimeout(() => {
      setLoading(true)
    }, 200)

    // Hide loading indicator after route change completes
    clearTimeoutRef.current = setTimeout(() => {
      setLoading(false)
    }, 1000) // Adjust this duration as needed

    // Cleanup
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      if (clearTimeoutRef.current) clearTimeout(clearTimeoutRef.current)
    }
  }, [location.pathname])

  if (!loading) return null

  return (
    <div
      className="fixed top-0 left-0 right-0 h-1 z-[100] overflow-hidden"
      role="progressbar"
      aria-label="Loading page"
    >
      <div className="feelflick-route-progress h-full bg-gradient-to-r from-purple-500 via-pink-500 to-amber-500" />
    </div>
  )
}
