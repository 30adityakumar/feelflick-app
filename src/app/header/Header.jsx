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
  X,
  ChevronRight,
  HelpCircle,
  Shield,
  Film,
  Heart,
} from 'lucide-react'

export default function Header({ onOpenSearch }) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [scrolled, setScrolled] = useState(false)
  const [scrollDirection, setScrollDirection] = useState('up')
  const [lastScrollY, setLastScrollY] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const hdrRef = useRef(null)
  const menuRef = useRef(null)

  // User session
  useEffect(() => {
    let unsub
    const getUser = async () => {
      const { data } = await supabase.auth.getUser()
      setUser(data?.user || null)
    }
    getUser()
    const { data } = supabase.auth.onAuthStateChange((_e, s) => {
      setUser(s?.user || null)
    })
    unsub = data?.subscription?.unsubscribe
    return () => typeof unsub === 'function' && unsub()
  }, [])

  // Smart scroll
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      setScrolled(currentScrollY > 10)
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setScrollDirection('down')
      } else {
        setScrollDirection('up')
      }
      setLastScrollY(currentScrollY)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  // Set CSS variable
  useEffect(() => {
    const setVar = () => {
      const h = hdrRef.current?.offsetHeight || 64
      document.documentElement.style.setProperty('--hdr-h', `${h}px`)
    }
    setVar()
    const ro = new ResizeObserver(setVar)
    if (hdrRef.current) ro.observe(hdrRef.current)
    return () => ro.disconnect()
  }, [])

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [menuOpen])

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setMenuOpen(false)
    setMobileMenuOpen(false)
    navigate('/')
  }

  const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'User'
  const userEmail = user?.email || ''
  const userAvatar = user?.user_metadata?.avatar_url

  return (
    <>
      {/* Desktop & Mobile Header */}
      <header
        ref={hdrRef}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrollDirection === 'down' ? '-translate-y-full' : 'translate-y-0'
        } ${scrolled ? 'bg-[#0a121a]/95 backdrop-blur-xl shadow-lg' : 'bg-transparent'}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <Film className="h-7 w-7 text-[#FF9245] group-hover:scale-110 transition-transform" />
              <span className="text-xl font-black text-white">
                Feel<span className="text-[#FF9245]">Flick</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <NavLink
                to="/home"
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2 rounded-lg font-semibold text-sm transition-all ${
                    isActive
                      ? 'text-white bg-white/10'
                      : 'text-white/70 hover:text-white hover:bg-white/5'
                  }`
                }
              >
                <Home className="h-4 w-4" />
                Home
              </NavLink>

              <NavLink
                to="/discover"
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2 rounded-lg font-semibold text-sm transition-all ${
                    isActive
                      ? 'text-white bg-white/10'
                      : 'text-white/70 hover:text-white hover:bg-white/5'
                  }`
                }
              >
                <Compass className="h-4 w-4" />
                Discover
              </NavLink>

              <NavLink
                to="/watchlist"
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2 rounded-lg font-semibold text-sm transition-all ${
                    isActive
                      ? 'text-white bg-white/10'
                      : 'text-white/70 hover:text-white hover:bg-white/5'
                  }`
                }
              >
                <Bookmark className="h-4 w-4" />
                Watchlist
              </NavLink>
            </nav>

            {/* Right side actions */}
            <div className="flex items-center gap-3">
              {/* Search button */}
              <button
                onClick={onOpenSearch}
                className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all"
                aria-label="Search movies"
              >
                <SearchIcon className="h-5 w-5" />
              </button>

              {/* User menu */}
              {user ? (
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-white/90 hover:bg-white/10 transition-all"
                  >
                    {userAvatar ? (
                      <img
                        src={userAvatar}
                        alt={userName}
                        className="h-7 w-7 rounded-full ring-2 ring-white/20"
                      />
                    ) : (
                      <div className="h-7 w-7 rounded-full bg-gradient-to-br from-[#FF9245] to-[#EB423B] flex items-center justify-center text-xs font-bold text-white">
                        {userName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${menuOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {/* Dropdown menu */}
                  {menuOpen && (
                    <div className="absolute right-0 mt-2 w-64 rounded-xl bg-[#0d1722] border border-white/10 shadow-2xl overflow-hidden">
                      {/* User info */}
                      <div className="px-4 py-3 border-b border-white/10 bg-white/5">
                        <p className="text-sm font-semibold text-white truncate">{userName}</p>
                        <p className="text-xs text-white/60 truncate">{userEmail}</p>
                      </div>

                      {/* Menu items */}
                      <div className="py-2">
                        <Link
                          to="/profile"
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-white/80 hover:text-white hover:bg-white/5 transition-colors"
                        >
                          <UserIcon className="h-4 w-4" />
                          Profile
                        </Link>

                        <Link
                          to="/settings"
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-white/80 hover:text-white hover:bg-white/5 transition-colors"
                        >
                          <Settings className="h-4 w-4" />
                          Settings
                        </Link>

                        <Link
                          to="/history"
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-white/80 hover:text-white hover:bg-white/5 transition-colors"
                        >
                          <Clock className="h-4 w-4" />
                          Watch History
                        </Link>
                      </div>

                      <div className="border-t border-white/10 py-2">
                        <Link
                          to="/help"
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-white/80 hover:text-white hover:bg-white/5 transition-colors"
                        >
                          <HelpCircle className="h-4 w-4" />
                          Help & Support
                        </Link>

                        <button
                          onClick={handleSignOut}
                          className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                        >
                          <LogOut className="h-4 w-4" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to="/signin"
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#FF9245] to-[#EB423B] text-white text-sm font-bold hover:shadow-lg transition-all"
                >
                  Sign In
                </Link>
              )}

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg text-white hover:bg-white/10 transition-all"
                aria-label="Menu"
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <div className="flex flex-col gap-1.5">
                    <span className="w-6 h-0.5 bg-white rounded-full" />
                    <span className="w-6 h-0.5 bg-white rounded-full" />
                    <span className="w-6 h-0.5 bg-white rounded-full" />
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="absolute right-0 top-16 bottom-0 w-80 max-w-[85vw] bg-[#0d1722] border-l border-white/10 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {user && (
              <div className="px-6 py-4 border-b border-white/10 bg-white/5">
                <div className="flex items-center gap-3">
                  {userAvatar ? (
                    <img
                      src={userAvatar}
                      alt={userName}
                      className="h-12 w-12 rounded-full ring-2 ring-white/20"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#FF9245] to-[#EB423B] flex items-center justify-center text-lg font-bold text-white">
                      {userName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{userName}</p>
                    <p className="text-xs text-white/60 truncate">{userEmail}</p>
                  </div>
                </div>
              </div>
            )}

            <nav className="py-4">
              <Link
                to="/home"
                className="flex items-center gap-3 px-6 py-3 text-white/80 hover:text-white hover:bg-white/5 transition-colors"
              >
                <Home className="h-5 w-5" />
                <span className="font-medium">Home</span>
              </Link>

              <Link
                to="/discover"
                className="flex items-center gap-3 px-6 py-3 text-white/80 hover:text-white hover:bg-white/5 transition-colors"
              >
                <Compass className="h-5 w-5" />
                <span className="font-medium">Discover</span>
              </Link>

              <Link
                to="/watchlist"
                className="flex items-center gap-3 px-6 py-3 text-white/80 hover:text-white hover:bg-white/5 transition-colors"
              >
                <Bookmark className="h-5 w-5" />
                <span className="font-medium">Watchlist</span>
              </Link>

              {user && (
                <>
                  <div className="my-4 border-t border-white/10" />

                  <Link
                    to="/profile"
                    className="flex items-center gap-3 px-6 py-3 text-white/80 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <UserIcon className="h-5 w-5" />
                    <span className="font-medium">Profile</span>
                  </Link>

                  <Link
                    to="/settings"
                    className="flex items-center gap-3 px-6 py-3 text-white/80 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <Settings className="h-5 w-5" />
                    <span className="font-medium">Settings</span>
                  </Link>

                  <Link
                    to="/history"
                    className="flex items-center gap-3 px-6 py-3 text-white/80 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <Clock className="h-5 w-5" />
                    <span className="font-medium">Watch History</span>
                  </Link>

                  <div className="my-4 border-t border-white/10" />

                  <Link
                    to="/help"
                    className="flex items-center gap-3 px-6 py-3 text-white/80 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <HelpCircle className="h-5 w-5" />
                    <span className="font-medium">Help & Support</span>
                  </Link>

                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-3 w-full px-6 py-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut className="h-5 w-5" />
                    <span className="font-medium">Sign Out</span>
                  </button>
                </>
              )}

              {!user && (
                <div className="px-6 pt-4">
                  <Link
                    to="/signin"
                    className="block w-full px-4 py-3 rounded-lg bg-gradient-to-r from-[#FF9245] to-[#EB423B] text-white text-center font-bold hover:shadow-lg transition-all"
                  >
                    Sign In
                  </Link>
                </div>
              )}
            </nav>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[#0a121a]/95 backdrop-blur-xl border-t border-white/10 pb-safe">
        <div className="flex items-center justify-around h-16">
          <NavLink
            to="/home"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                isActive ? 'text-[#FF9245]' : 'text-white/60'
              }`
            }
          >
            <Home className="h-5 w-5 mb-1" />
            <span className="text-xs font-medium">Home</span>
          </NavLink>

          <NavLink
            to="/discover"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                isActive ? 'text-[#FF9245]' : 'text-white/60'
              }`
            }
          >
            <Compass className="h-5 w-5 mb-1" />
            <span className="text-xs font-medium">Discover</span>
          </NavLink>

          <button
            onClick={onOpenSearch}
            className="flex flex-col items-center justify-center flex-1 h-full text-white/60 active:text-white transition-colors"
          >
            <SearchIcon className="h-5 w-5 mb-1" />
            <span className="text-xs font-medium">Search</span>
          </button>

          <NavLink
            to="/watchlist"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                isActive ? 'text-[#FF9245]' : 'text-white/60'
              }`
            }
          >
            <Bookmark className="h-5 w-5 mb-1" />
            <span className="text-xs font-medium">Watchlist</span>
          </NavLink>
        </div>
      </nav>
    </>
  )
}
