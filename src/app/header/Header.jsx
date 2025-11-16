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
  const [showUserMenu, setShowUserMenu] = useState(false)
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
        setShowUserMenu(false)
      } else {
        setScrollDirection('up')
      }
      setLastScrollY(currentScrollY)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowUserMenu(false)
      }
    }
    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showUserMenu])

  // Set CSS variable for header height
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

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setShowUserMenu(false)
    navigate('/')
  }

  const getUserInitial = () => {
    if (!user) return '?'
    const name = user.user_metadata?.name || user.email
    return name.charAt(0).toUpperCase()
  }

  return (
    <>
      {/* Desktop & Mobile Header */}
      <header
        ref={hdrRef}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-[#0a0e17]/95 backdrop-blur-md shadow-lg' : 'bg-transparent'
        } ${scrollDirection === 'down' ? '-translate-y-full' : 'translate-y-0'}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-18">
            {/* Logo */}
            <Link
              to="/home"
              className="flex items-center gap-2 group"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-[#FF9245] to-[#EB423B] shadow-lg group-hover:shadow-xl transition-all group-hover:scale-105">
                <Film className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl md:text-2xl font-black bg-gradient-to-r from-[#FF9245] to-[#EB423B] bg-clip-text text-transparent">
                FeelFlick
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6 lg:gap-8">
              <NavLink
                to="/home"
                className={({ isActive }) =>
                  `flex items-center gap-2 text-sm font-semibold transition-colors ${
                    isActive
                      ? 'text-white'
                      : 'text-white/60 hover:text-white'
                  }`
                }
              >
                <Home className="h-4 w-4" />
                Home
              </NavLink>
              <NavLink
                to="/discover"
                className={({ isActive }) =>
                  `flex items-center gap-2 text-sm font-semibold transition-colors ${
                    isActive
                      ? 'text-white'
                      : 'text-white/60 hover:text-white'
                  }`
                }
              >
                <Compass className="h-4 w-4" />
                Discover
              </NavLink>
              <NavLink
                to="/watchlist"
                className={({ isActive }) =>
                  `flex items-center gap-2 text-sm font-semibold transition-colors ${
                    isActive
                      ? 'text-white'
                      : 'text-white/60 hover:text-white'
                  }`
                }
              >
                <Bookmark className="h-4 w-4" />
                Watchlist
              </NavLink>
            </nav>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-4">
              {/* Search Button */}
              <button
                onClick={onOpenSearch}
                className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all"
                aria-label="Search"
              >
                <SearchIcon className="h-4 w-4" />
              </button>

              {/* User Menu */}
              {user ? (
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 pl-2 pr-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all"
                  >
                    <div className="flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-[#FF9245] to-[#EB423B] text-white text-sm font-bold">
                      {getUserInitial()}
                    </div>
                    <ChevronDown
                      className={`h-4 w-4 text-white/60 transition-transform ${
                        showUserMenu ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {/* Dropdown Menu */}
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-56 rounded-xl bg-[#1a1f2e] border border-white/10 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                      {/* User Info */}
                      <div className="px-4 py-3 border-b border-white/10">
                        <p className="text-sm font-semibold text-white truncate">
                          {user.user_metadata?.name || 'User'}
                        </p>
                        <p className="text-xs text-white/60 truncate">
                          {user.email}
                        </p>
                      </div>

                      {/* Menu Items */}
                      <div className="py-2">
                        <Link
                          to="/profile"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/80 hover:text-white hover:bg-white/5 transition-colors"
                        >
                          <UserIcon className="h-4 w-4" />
                          Profile
                        </Link>
                        <Link
                          to="/watchlist"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/80 hover:text-white hover:bg-white/5 transition-colors"
                        >
                          <Bookmark className="h-4 w-4" />
                          Watchlist
                        </Link>
                        <Link
                          to="/history"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/80 hover:text-white hover:bg-white/5 transition-colors"
                        >
                          <Clock className="h-4 w-4" />
                          History
                        </Link>
                        <Link
                          to="/settings"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/80 hover:text-white hover:bg-white/5 transition-colors"
                        >
                          <Settings className="h-4 w-4" />
                          Settings
                        </Link>
                      </div>

                      {/* Sign Out */}
                      <div className="border-t border-white/10 py-2">
                        <button
                          onClick={handleSignOut}
                          className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
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
                  to="/"
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#FF9245] to-[#EB423B] text-white text-sm font-semibold hover:shadow-lg transition-all"
                >
                  Sign In
                </Link>
              )}
            </div>

            {/* Mobile Search Button */}
            <button
              onClick={onOpenSearch}
              className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all"
              aria-label="Search"
            >
              <SearchIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0a0e17]/95 backdrop-blur-md border-t border-white/10 safe-bottom">
        <div className="flex items-center justify-around h-16">
          <NavLink
            to="/home"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors ${
                isActive
                  ? 'text-[#FF9245]'
                  : 'text-white/60 hover:text-white'
              }`
            }
          >
            <Home className="h-5 w-5" />
            <span className="text-[10px] font-semibold">Home</span>
          </NavLink>

          <NavLink
            to="/discover"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors ${
                isActive
                  ? 'text-[#FF9245]'
                  : 'text-white/60 hover:text-white'
              }`
            }
          >
            <Compass className="h-5 w-5" />
            <span className="text-[10px] font-semibold">Discover</span>
          </NavLink>

          <NavLink
            to="/watchlist"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors ${
                isActive
                  ? 'text-[#FF9245]'
                  : 'text-white/60 hover:text-white'
              }`
            }
          >
            <Bookmark className="h-5 w-5" />
            <span className="text-[10px] font-semibold">Watchlist</span>
          </NavLink>

          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors ${
                isActive
                  ? 'text-[#FF9245]'
                  : 'text-white/60 hover:text-white'
              }`
            }
          >
            <UserIcon className="h-5 w-5" />
            <span className="text-[10px] font-semibold">Profile</span>
          </NavLink>
        </div>
      </nav>
    </>
  )
}
