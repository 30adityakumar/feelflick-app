// src/features/landing/components/TopNav.jsx
import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/shared/lib/supabase/client'
import { Menu, X } from 'lucide-react'

export default function TopNav({ hideAuthCta = false }) {
  const [isOpen, setIsOpen] = useState(false)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Close mobile menu on navigation
  useEffect(() => {
    setIsOpen(false)
  }, [navigate])

  // Prevent body scroll when menu open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const handleGetStarted = () => {
    if (session) {
      navigate('/home')
    } else {
      navigate('/')
      document.getElementById('email-signup')?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-lg border-b border-white/10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 sm:h-18 items-center justify-between">
          {/* Logo */}
          <Link
            to="/"
            className="text-xl sm:text-2xl font-black tracking-tight focus:outline-none focus:ring-2 focus:ring-white/30 rounded-lg"
          >
            <span className="bg-gradient-to-r from-[#FF9245] via-[#EB423B] to-[#E03C9E] bg-clip-text text-transparent">
              FEELFLICK
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            {!hideAuthCta && !loading && (
              <>
                {session ? (
                  <Link
                    to="/home"
                    className="px-6 py-2.5 rounded-lg font-bold text-white bg-gradient-to-r from-[#FF9245] to-[#EB423B] hover:from-[#FF9245] hover:to-[#E03C9E] transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
                  >
                    Go to App
                  </Link>
                ) : (
                  <button
                    onClick={handleGetStarted}
                    className="px-6 py-2.5 rounded-lg font-bold text-white bg-gradient-to-r from-[#FF9245] to-[#EB423B] hover:from-[#FF9245] hover:to-[#E03C9E] transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
                  >
                    Get Started
                  </button>
                )}
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          {!hideAuthCta && (
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden p-2 text-white hover:bg-white/10 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-white/30"
              aria-label="Toggle menu"
              aria-expanded={isOpen}
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      {!hideAuthCta && (
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            isOpen ? 'max-h-screen' : 'max-h-0'
          }`}
        >
          <div className="px-4 py-6 space-y-4 bg-black/95 backdrop-blur-xl border-t border-white/10">
            {!loading && (
              <>
                {session ? (
                  <Link
                    to="/home"
                    className="block w-full px-6 py-3 rounded-lg font-bold text-center text-white bg-gradient-to-r from-[#FF9245] to-[#EB423B] hover:from-[#FF9245] hover:to-[#E03C9E] transition-all duration-300 active:scale-95"
                  >
                    Go to App
                  </Link>
                ) : (
                  <button
                    onClick={handleGetStarted}
                    className="block w-full px-6 py-3 rounded-lg font-bold text-center text-white bg-gradient-to-r from-[#FF9245] to-[#EB423B] hover:from-[#FF9245] hover:to-[#E03C9E] transition-all duration-300 active:scale-95"
                  >
                    Get Started
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
