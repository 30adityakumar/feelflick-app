// src/app/AppShell.jsx
import { useEffect, useState, useRef } from 'react'
import { Outlet, useLocation, NavLink } from 'react-router-dom'
import { Home, Search, Bookmark, User } from 'lucide-react'
import { supabase } from '@/shared/lib/supabase/client'
import Header from '@/app/header/Header'
import SearchBar from '@/app/header/components/SearchBar'

export default function AppShell() {
  const [searchOpen, setSearchOpen] = useState(false)
  const [headerVisible, setHeaderVisible] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const lastScrollY = useRef(0)
  const ticking = useRef(false)
  const location = useLocation()

  // Check authentication status
  useEffect(() => {
    // Initial check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session)
    })

    return () => subscription?.unsubscribe()
  }, [])

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

  // Reset header visibility on route change
  useEffect(() => {
    setHeaderVisible(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [location.pathname])

  return (
    <div className="relative min-h-screen bg-black text-white">
      {/* Enhanced background with animated gradients */}
      <div aria-hidden className="fixed inset-0 -z-10 overflow-hidden">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-black to-slate-950" />
        
        {/* Animated orbs for depth */}
        <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-purple-500/10 blur-3xl animate-pulse-slow" />
        <div className="absolute -bottom-40 -right-40 h-[600px] w-[600px] rounded-full bg-pink-500/10 blur-3xl animate-pulse-slow delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[700px] w-[700px] rounded-full bg-indigo-500/5 blur-3xl animate-pulse-slow delay-2000" />
        
        {/* Subtle noise texture for film grain effect */}
        <div 
          className="absolute inset-0 opacity-[0.015] mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />
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
      <main className={`relative z-10 w-full pt-16 ${isAuthenticated ? 'pb-20 md:pb-0' : ''}`}>
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation - Only shown when authenticated */}
      {isAuthenticated && (
        <nav 
          className="fixed bottom-0 left-0 right-0 z-40 md:hidden border-t border-white/10 bg-black/95 backdrop-blur-xl"
          aria-label="Mobile navigation"
        >
          <div className="flex items-center justify-around h-16 px-2">
            <MobileNavLink to="/home" icon={Home} label="Home" />
            <MobileNavLink 
              to="#" 
              icon={Search} 
              label="Search" 
              onClick={(e) => {
                e.preventDefault()
                setSearchOpen(true)
              }}
            />
            <MobileNavLink to="/watchlist" icon={Bookmark} label="Watchlist" />
            <MobileNavLink to="/mobile-account" icon={User} label="Account" />
          </div>
        </nav>
      )}

      {/* Global search modal */}
      <SearchBar open={searchOpen} onClose={() => setSearchOpen(false)} />
      
      {/* Loading indicator for route transitions */}
      <RouteLoadingIndicator />
    </div>
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
      className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-[64px] ${
        isActive 
          ? 'text-brand-100' 
          : 'text-white/60 hover:text-white/90 active:text-white'
      }`}
      aria-label={label}
      aria-current={isActive ? 'page' : undefined}
    >
      <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
      <span className={`text-xs font-medium ${isActive ? 'font-semibold' : ''}`}>
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

  useEffect(() => {
    // Show loading indicator after a short delay (avoid flash for fast loads)
    timeoutRef.current = setTimeout(() => {
      setLoading(true)
    }, 200)

    // Hide when route changes complete
    return () => {
      clearTimeout(timeoutRef.current)
      setLoading(false)
    }
  }, [location.pathname])

  if (!loading) return null

  return (
    <div 
      className="fixed top-0 left-0 right-0 h-1 z-[100] overflow-hidden"
      role="progressbar"
      aria-label="Loading page"
    >
      <div 
        className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-amber-500 animate-loading-bar"
        style={{
          animation: 'loading-bar 1.5s ease-in-out infinite',
        }}
      />
    </div>
  )
}

// Add this to your global CSS or create an inline style
const style = document.createElement('style')
style.textContent = `
  @keyframes loading-bar {
    0% {
      transform: translateX(-100%);
    }
    50% {
      transform: translateX(0%);
    }
    100% {
      transform: translateX(100%);
    }
  }
  
  @keyframes pulse-slow {
    0%, 100% {
      opacity: 0.3;
      transform: scale(1);
    }
    50% {
      opacity: 0.5;
      transform: scale(1.1);
    }
  }
  
  .animate-pulse-slow {
    animation: pulse-slow 8s ease-in-out infinite;
  }
  
  .delay-1000 {
    animation-delay: 1s;
  }
  
  .delay-2000 {
    animation-delay: 2s;
  }
`
document.head.appendChild(style)
