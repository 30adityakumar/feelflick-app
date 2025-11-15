// src/features/landing/components/TopNav.jsx
import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { supabase } from '@/shared/lib/supabase/client'

export default function TopNav() {
  const [user, setUser] = useState(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data?.user || null))
    const { data } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user || null)
    })
    return () => data?.subscription?.unsubscribe()
  }, [])

  const handleGetStarted = () => {
    if (user) {
      navigate('/home')
    } else {
      navigate('/', { state: { showAuth: true } })
    }
  }

  return (
    <nav className="relative z-50 border-b border-white/5 backdrop-blur-xl bg-black/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 sm:h-20 items-center justify-between">
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center group"
            onClick={() => setMobileMenuOpen(false)}
          >
            <span className="text-2xl sm:text-3xl font-black tracking-tight bg-gradient-to-r from-[#FF9245] via-[#EB423B] to-[#E03C9E] bg-clip-text text-transparent group-hover:scale-105 transition-transform">
              FEELFLICK
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link 
              to="/browse" 
              className="text-sm font-medium text-white/80 hover:text-white transition-colors"
            >
              Discover
            </Link>
            {user && (
              <>
                <Link 
                  to="/watchlist" 
                  className="text-sm font-medium text-white/80 hover:text-white transition-colors"
                >
                  Watchlist
                </Link>
                <Link 
                  to="/account" 
                  className="text-sm font-medium text-white/80 hover:text-white transition-colors"
                >
                  Account
                </Link>
              </>
            )}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <Link
                to="/home"
                className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-[#FF9245] to-[#EB423B] hover:to-[#E03C9E] px-5 py-2.5 text-sm font-bold text-white shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95"
              >
                Go to App
              </Link>
            ) : (
              <button
                onClick={handleGetStarted}
                className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-[#FF9245] to-[#EB423B] hover:to-[#E03C9E] px-5 py-2.5 text-sm font-bold text-white shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95"
              >
                Get Started
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden inline-flex items-center justify-center rounded-lg p-2 text-white hover:bg-white/10 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/5 bg-black/95 backdrop-blur-xl">
          <div className="space-y-1 px-4 pb-4 pt-2">
            <Link
              to="/browse"
              onClick={() => setMobileMenuOpen(false)}
              className="block rounded-lg px-4 py-3 text-base font-medium text-white/80 hover:bg-white/10 hover:text-white transition-colors"
            >
              Discover
            </Link>
            {user && (
              <>
                <Link
                  to="/watchlist"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block rounded-lg px-4 py-3 text-base font-medium text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                >
                  Watchlist
                </Link>
                <Link
                  to="/account"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block rounded-lg px-4 py-3 text-base font-medium text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                >
                  Account
                </Link>
              </>
            )}
            <div className="pt-2">
              {user ? (
                <Link
                  to="/home"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block rounded-lg bg-gradient-to-r from-[#FF9245] to-[#EB423B] px-4 py-3 text-center text-base font-bold text-white shadow-lg"
                >
                  Go to App
                </Link>
              ) : (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false)
                    handleGetStarted()
                  }}
                  className="w-full rounded-lg bg-gradient-to-r from-[#FF9245] to-[#EB423B] px-4 py-3 text-center text-base font-bold text-white shadow-lg"
                >
                  Get Started
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
