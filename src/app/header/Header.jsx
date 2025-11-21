// src/app/header/Header.jsx
import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '@/shared/lib/supabase/client'
import {
  Home,
  Compass,
  Search as SearchIcon,
  ChevronDown,
  LogOut,
  User as UserIcon,
  Settings,
  Bookmark,
  Clock,
  Sparkles,
  Menu,
  X as CloseIcon
} from 'lucide-react'

export default function Header({ onOpenSearch }) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [scrolled, setScrolled] = useState(false)
  const [scrollDirection, setScrollDirection] = useState('up')
  const [lastScrollY, setLastScrollY] = useState(0)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const hdrRef = useRef(null)
  const dropdownRef = useRef(null)

  // User session
  useEffect(() => {
    let unsub
    const getUser = async () => {
      const { data } = await supabase.auth.getUser()
      setUser(data?.user || null)
    }
    getUser()
    const { data } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user || null)
    })
    unsub = data?.subscription?.unsubscribe
    return () => { if (typeof unsub === 'function') unsub() }
  }, [])

  // Smart scroll behavior (Netflix-style: hide on scroll down, show on scroll up)
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      // Determine scroll direction
      if (currentScrollY > lastScrollY && currentScrollY > 80) {
        setScrollDirection('down')
      } else {
        setScrollDirection('up')
      }
      
      // Set scrolled state (for background)
      setScrolled(currentScrollY > 20)
      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [dropdownOpen])

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login', { replace: true })
  }

  const getUserInitial = () => {
    if (!user) return '?'
    const name = user.user_metadata?.name || user.email
    return name.charAt(0).toUpperCase()
  }

  const navLinks = [
    { to: '/home', icon: Home, label: 'Home' },
    { to: '/discover', icon: Compass, label: 'Discover' },
    { to: '/watchlist', icon: Bookmark, label: 'Watchlist' },
  ]

  return (
    <>
      {/* Desktop & Tablet Header */}
      <header
        ref={hdrRef}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-out ${
          scrollDirection === 'down' ? '-translate-y-full' : 'translate-y-0'
        } ${
          scrolled
            ? 'bg-[#0B1120]/95 backdrop-blur-xl border-b border-white/10 shadow-xl'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo */}
            <Link 
              to="/home" 
              className="flex items-center gap-2 group"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-[#667eea] to-[#764ba2] rounded-lg blur-md opacity-0 group-hover:opacity-50 transition-opacity duration-300" />
                <Sparkles className="relative h-6 w-6 text-[#667eea] group-hover:rotate-12 transition-transform duration-300" />
              </div>
              <span className="relative text-xl font-black bg-gradient-to-r from-[#667eea] via-[#764ba2] to-[#f093fb] bg-clip-text text-transparent">
                FEELFLICK
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all duration-300 ${
                      isActive
                        ? 'text-white bg-white/10 shadow-lg shadow-[#667eea]/20'
                        : 'text-white/70 hover:text-white hover:bg-white/5'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <link.icon className={`h-4 w-4 ${isActive ? 'text-[#667eea]' : ''}`} />
                      <span>{link.label}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </nav>

            {/* Right Side Actions */}
            <div className="flex items-center gap-3">
              
              {/* Search Button */}
              <button
                onClick={onOpenSearch}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 hover:border-[#667eea]/50 transition-all duration-300 group"
                aria-label="Search movies"
              >
                <SearchIcon className="h-4 w-4 group-hover:text-[#667eea] transition-colors" />
                <span className="hidden sm:inline text-sm font-medium">Search</span>
              </button>

              {/* User Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#667eea]/50 transition-all duration-300 group"
                  aria-label="User menu"
                >
                  <div className="h-7 w-7 rounded-full bg-gradient-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center text-white text-xs font-bold shadow-lg">
                    {getUserInitial()}
                  </div>
                  <ChevronDown className={`h-4 w-4 text-white/50 transition-transform duration-300 ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#0f172a]/95 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden animate-fade-in-up">
                    {/* User Info */}
                    <div className="px-4 py-3 border-b border-white/10">
                      <p className="text-sm font-semibold text-white truncate">
                        {user?.user_metadata?.name || 'User'}
                      </p>
                      <p className="text-xs text-white/50 truncate">{user?.email}</p>
                    </div>

                    {/* Menu Items */}
                    <div className="py-2">
                      <Link
                        to="/account"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/80 hover:text-white hover:bg-white/5 transition-colors"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <UserIcon className="h-4 w-4" />
                        <span>Account</span>
                      </Link>
                      <Link
                        to="/preferences"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/80 hover:text-white hover:bg-white/5 transition-colors"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <Settings className="h-4 w-4" />
                        <span>Preferences</span>
                      </Link>
                      <Link
                        to="/history"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/80 hover:text-white hover:bg-white/5 transition-colors"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <Clock className="h-4 w-4" />
                        <span>Watch History</span>
                      </Link>
                    </div>

                    {/* Logout */}
                    <div className="border-t border-white/10 py-2">
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden flex items-center justify-center h-10 w-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-all"
                aria-label="Toggle mobile menu"
              >
                {mobileMenuOpen ? <CloseIcon className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-[#0B1120]/98 backdrop-blur-xl animate-fade-in">
          <div className="flex flex-col h-full pt-20 px-6 pb-safe">
            <nav className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `flex items-center gap-4 px-6 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 ${
                      isActive
                        ? 'text-white bg-gradient-to-r from-[#667eea]/20 to-[#764ba2]/20 border-2 border-[#667eea]/50 shadow-lg'
                        : 'text-white/70 hover:text-white border-2 border-transparent hover:bg-white/5'
                    }`
                  }
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {({ isActive }) => (
                    <>
                      <link.icon className={`h-6 w-6 ${isActive ? 'text-[#667eea]' : ''}`} />
                      <span>{link.label}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0B1120]/95 backdrop-blur-xl border-t border-white/10 pb-safe">
        <div className="flex items-center justify-around px-2 py-2">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-300 ${
                  isActive ? 'text-[#667eea]' : 'text-white/50 active:scale-95'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <link.icon className={`h-6 w-6 ${isActive ? 'scale-110' : ''} transition-transform`} />
                  <span className="text-xs font-medium">{link.label}</span>
                  {isActive && (
                    <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-[#667eea]" />
                  )}
                </>
              )}
            </NavLink>
          ))}
          
          <button
            onClick={onOpenSearch}
            className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl text-white/50 active:scale-95 transition-transform"
          >
            <SearchIcon className="h-6 w-6" />
            <span className="text-xs font-medium">Search</span>
          </button>
        </div>
      </div>

      {/* Global Styles */}
      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.3s ease-out;
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
        .pb-safe {
          padding-bottom: env(safe-area-inset-bottom);
        }
      `}</style>
    </>
  )
}
