// src/features/landing/components/TopNav.jsx
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X } from 'lucide-react'

export default function TopNav({ hideAuthCta = false }) {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close mobile menu when clicking outside
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [mobileMenuOpen])

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-black/95 backdrop-blur-md shadow-lg'
          : 'bg-transparent'
      }`}
      style={{ '--topnav-h': '64px' }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link
            to="/"
            className="group flex items-center gap-2 transition-transform duration-300 hover:scale-105 active:scale-95"
          >
            <span className="text-2xl font-black tracking-tight bg-gradient-to-r from-[#FF9245] via-[#EB423B] to-[#E03C9E] bg-clip-text text-transparent">
              FEELFLICK
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {!hideAuthCta && (
              <>
                <Link
                  to="/"
                  className="text-sm font-medium text-white/80 hover:text-white transition-colors duration-200"
                >
                  Features
                </Link>
                <Link
                  to="/"
                  className="text-sm font-medium text-white/80 hover:text-white transition-colors duration-200"
                >
                  How It Works
                </Link>
                <Link
                  to="/"
                  className="inline-flex items-center justify-center px-5 py-2 rounded-lg bg-gradient-to-r from-[#FF9245] to-[#EB423B] text-white font-bold text-sm transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/50 hover:scale-105 active:scale-95"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          {!hideAuthCta && (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-white hover:text-white/80 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      {!hideAuthCta && (
        <div
          className={`md:hidden fixed inset-x-0 top-16 bg-black/98 backdrop-blur-lg transition-all duration-300 ease-in-out ${
            mobileMenuOpen
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 -translate-y-4 pointer-events-none'
          }`}
          style={{ maxHeight: 'calc(100vh - 4rem)' }}
        >
          <div className="px-4 pt-4 pb-6 space-y-3">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-3 text-base font-medium text-white/80 hover:text-white hover:bg-white/5 rounded-lg transition-all duration-200"
            >
              Features
            </Link>
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-3 text-base font-medium text-white/80 hover:text-white hover:bg-white/5 rounded-lg transition-all duration-200"
            >
              How It Works
            </Link>
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block w-full px-4 py-3 rounded-lg bg-gradient-to-r from-[#FF9245] to-[#EB423B] text-white font-bold text-center transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/50 active:scale-95"
            >
              Get Started
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}
