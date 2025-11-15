// src/features/landing/components/TopNav.jsx
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { supabase } from '@/shared/lib/supabase/client'

// Brand gradient constant
const BRAND_GRADIENT = 'bg-gradient-to-r from-[#FF9245] via-[#EB423B] to-[#E03C9E]'

export default function TopNav({ hideAuthCta = false }) {
  const [user, setUser] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const navRef = useRef(null)
  const menuRef = useRef(null)

  useEffect(() => {
    // Get current user
    supabase.auth.getUser().then(({ data }) => setUser(data?.user || null))
    
    // Subscribe to auth changes
    const { data } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user || null)
    })
    
    return () => data?.subscription?.unsubscribe?.()
  }, [])

  useEffect(() => {
    // Set CSS variable for layout calculations
    if (navRef.current) {
      const h = navRef.current.getBoundingClientRect().height
      document.documentElement.style.setProperty('--topnav-h', `${h}px`)
    }
  }, [])

  useEffect(() => {
    // Close menu on escape key
    const handleEscape = (e) => {
      if (e.key === 'Escape' && menuOpen) {
        setMenuOpen(false)
      }
    }
    
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [menuOpen])

  useEffect(() => {
    // Lock body scroll when menu is open
    if (menuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  const handleGoogleSignIn = async () => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/home`,
        },
      })
      if (error) throw error
    } catch (err) {
      console.error('Sign in error:', err)
      alert('Unable to sign in. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    setLoading(true)
    try {
      await supabase.auth.signOut()
    } catch (err) {
      console.error('Sign out error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <nav
      ref={navRef}
      className="sticky top-0 z-50 w-full border-b border-white/5 bg-black/80 backdrop-blur-xl"
    >
      <div className="mx-auto flex h-16 sm:h-18 md:h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-white/50 rounded-lg"
        >
          <span className={`text-xl sm:text-2xl md:text-3xl font-black tracking-tight ${BRAND_GRADIENT} bg-clip-text text-transparent`}>
            FEELFLICK
          </span>
        </Link>

        {/* Desktop Navigation */}
        {!hideAuthCta && (
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <>
                <Link
                  to="/home"
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-white/90 hover:text-white hover:bg-white/10 transition-all focus:outline-none focus:ring-2 focus:ring-white/50"
                >
                  Go to App
                </Link>
                <button
                  onClick={handleSignOut}
                  disabled={loading}
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-white/90 hover:text-white hover:bg-white/10 transition-all disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-white/50"
                >
                  {loading ? 'Signing out...' : 'Sign Out'}
                </button>
              </>
            ) : (
              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className={`rounded-lg ${BRAND_GRADIENT} px-6 py-2.5 text-sm font-bold text-white hover:opacity-90 transition-all disabled:opacity-50 shadow-lg hover:shadow-xl active:scale-95 focus:outline-none focus:ring-2 focus:ring-white/50`}
              >
                {loading ? 'Loading...' : 'Get Started'}
              </button>
            )}
          </div>
        )}

        {/* Mobile Menu Button */}
        {!hideAuthCta && (
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden grid h-10 w-10 place-items-center rounded-lg text-white hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        )}
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div
          ref={menuRef}
          className="fixed inset-x-0 top-[var(--topnav-h,64px)] bottom-0 z-50 bg-black/95 backdrop-blur-xl md:hidden animate-in fade-in slide-in-from-top-4 duration-300"
        >
          <div className="flex flex-col items-center justify-center gap-6 h-full p-8">
            {user ? (
              <>
                <Link
                  to="/home"
                  onClick={() => setMenuOpen(false)}
                  className="w-full max-w-xs rounded-lg px-6 py-3 text-center text-lg font-semibold text-white bg-white/10 hover:bg-white/20 transition-all focus:outline-none focus:ring-2 focus:ring-white/50"
                >
                  Go to App
                </Link>
                <button
                  onClick={() => {
                    handleSignOut()
                    setMenuOpen(false)
                  }}
                  disabled={loading}
                  className="w-full max-w-xs rounded-lg px-6 py-3 text-lg font-semibold text-white bg-white/10 hover:bg-white/20 transition-all disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-white/50"
                >
                  {loading ? 'Signing out...' : 'Sign Out'}
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  handleGoogleSignIn()
                  setMenuOpen(false)
                }}
                disabled={loading}
                className={`w-full max-w-xs rounded-lg ${BRAND_GRADIENT} px-6 py-3 text-lg font-bold text-white hover:opacity-90 transition-all disabled:opacity-50 shadow-xl active:scale-95 focus:outline-none focus:ring-2 focus:ring-white/50`}
              >
                {loading ? 'Loading...' : 'Get Started'}
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
