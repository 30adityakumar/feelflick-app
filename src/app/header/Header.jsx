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
} from 'lucide-react'

export default function Header({ onOpenSearch }) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [scrolled, setScrolled] = useState(false)
  const [scrollDirection, setScrollDirection] = useState('up')
  const [lastScrollY, setLastScrollY] = useState(0)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
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
        setDropdownOpen(false)
      } else {
        setScrollDirection('up')
      }
      setLastScrollY(currentScrollY)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false)
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [dropdownOpen])

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

  // Close account menu on route change
  useEffect(() => {
    setAccountMenuOpen(false)
  }, [pathname])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setDropdownOpen(false)
    setAccountMenuOpen(false)
    navigate('/')
  }

  const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'User'
  const userEmail = user?.email || ''
  const userAvatar = user?.user_metadata?.avatar_url || null

  // Check if current path matches account section
  const isAccountSection = ['/account', '/preferences', '/watchlist', '/history'].some(path => 
    pathname.startsWith(path)
  )

  return (
    <>
      {/* Desktop & Tablet Header */}
      <header
        ref={hdrRef}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-[#0a0a0a]/95 backdrop-blur-md shadow-lg'
            : 'bg-gradient-to-b from-black/80 to-transparent'
        } ${scrollDirection === 'down' ? '-translate-y-full' : 'translate-y-0'}`}
        style={{
          paddingTop: 'env(safe-area-inset-top)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/home" className="flex items-center gap-2 group">
              <div className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-[#FF9245] to-[#EB423B] bg-clip-text text-transparent group-hover:scale-105 transition-transform">
                FEELFLICK
              </div>
            </Link>

            {/* Desktop Navigation - More prominent active state */}
            <nav className="hidden md:flex items-center gap-6">
              <NavLink
                to="/home"
                className={({ isActive }) =>
                  `text-sm font-bold transition-all ${
                    isActive 
                      ? 'text-white border-b-2 border-[#FF9245] pb-0.5' 
                      : 'text-white/70 hover:text-white border-b-2 border-transparent'
                  }`
                }
              >
                Home
              </NavLink>
              <NavLink
                to="/browse"
                className={({ isActive }) =>
                  `text-sm font-bold transition-all ${
                    isActive 
                      ? 'text-white border-b-2 border-[#FF9245] pb-0.5' 
                      : 'text-white/70 hover:text-white border-b-2 border-transparent'
                  }`
                }
              >
                Discover
              </NavLink>
              <NavLink
                to="/watchlist"
                className={({ isActive }) =>
                  `text-sm font-bold transition-all ${
                    isActive 
                      ? 'text-white border-b-2 border-[#FF9245] pb-0.5' 
                      : 'text-white/70 hover:text-white border-b-2 border-transparent'
                  }`
                }
              >
                Watchlist
              </NavLink>
            </nav>

            {/* Right Side Actions */}
            <div className="flex items-center gap-3 sm:gap-4">
              {/* Search Button */}
              <button
                onClick={onOpenSearch}
                className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all active:scale-95"
                aria-label="Search"
              >
                <SearchIcon className="h-5 w-5" />
              </button>

              {/* User Dropdown (Desktop only) */}
              {user && (
                <div className="hidden md:block relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 p-1.5 hover:bg-white/10 rounded-lg transition-all"
                  >
                    {userAvatar ? (
                      <img
                        src={userAvatar}
                        alt={userName}
                        className="h-8 w-8 rounded-full object-cover ring-2 ring-white/20"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#FF9245] to-[#EB423B] flex items-center justify-center text-white text-sm font-bold">
                        {userName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <ChevronDown
                      className={`h-4 w-4 text-white/70 transition-transform ${
                        dropdownOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {/* Dropdown Menu */}
                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 rounded-xl bg-[#1a1a1a] border border-white/10 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                      {/* User Info */}
                      <div className="px-4 py-3 border-b border-white/10">
                        <div className="font-semibold text-white text-sm truncate">{userName}</div>
                        <div className="text-xs text-white/60 truncate">{userEmail}</div>
                      </div>

                      {/* Menu Items */}
                      <div className="py-2">
                        <Link
                          to="/account"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                        >
                          <UserIcon className="h-4 w-4" />
                          Profile
                        </Link>
                        <Link
                          to="/watchlist"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                        >
                          <Bookmark className="h-4 w-4" />
                          Watchlist
                        </Link>
                        <Link
                          to="/history"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                        >
                          <Clock className="h-4 w-4" />
                          History
                        </Link>
                        <Link
                          to="/preferences"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                        >
                          <Settings className="h-4 w-4" />
                          Settings
                        </Link>
                      </div>

                      {/* Sign Out */}
                      <div className="border-t border-white/10 py-2">
                        <button
                          onClick={handleSignOut}
                          className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
                        >
                          <LogOut className="h-4 w-4" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-md border-t border-white/10 shadow-2xl"
        style={{
          paddingBottom: 'max(env(safe-area-inset-bottom), 0.5rem)',
        }}
      >
        <div className="flex items-center justify-around px-2 pt-2">
          <NavLink
            to="/home"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all ${
                isActive 
                  ? 'text-white bg-white/10' 
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Home className={`h-6 w-6 ${isActive ? 'fill-current' : ''}`} />
                <span className="text-xs font-medium">Home</span>
              </>
            )}
          </NavLink>

          <NavLink
            to="/browse"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all ${
                isActive 
                  ? 'text-white bg-white/10' 
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Compass className={`h-6 w-6 ${isActive ? 'fill-current' : ''}`} />
                <span className="text-xs font-medium">Discover</span>
              </>
            )}
          </NavLink>

          <button
            onClick={onOpenSearch}
            className="flex flex-col items-center gap-1 px-4 py-2 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-all active:scale-95"
          >
            <SearchIcon className="h-6 w-6" />
            <span className="text-xs font-medium">Search</span>
          </button>

          {/* Account button - opens full-screen menu */}
          <button
            onClick={() => setAccountMenuOpen(true)}
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all ${
              isAccountSection 
                ? 'text-white bg-white/10' 
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            {userAvatar ? (
              <img
                src={userAvatar}
                alt={userName}
                className={`h-6 w-6 rounded-full object-cover ${
                  isAccountSection ? 'ring-2 ring-white/40' : 'ring-2 ring-white/10'
                }`}
              />
            ) : (
              <div className={`h-6 w-6 rounded-full bg-gradient-to-br from-[#FF9245] to-[#EB423B] flex items-center justify-center text-white text-[10px] font-bold ${
                isAccountSection ? 'ring-2 ring-white/40' : ''
              }`}>
                {userName.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="text-xs font-medium">Account</span>
          </button>
        </div>
      </nav>

      {/* Mobile Account Menu - YouTube-Style Full-Screen Overlay */}
      {accountMenuOpen && (
        <div className="md:hidden fixed inset-0 z-[60] bg-black/95 backdrop-blur-lg animate-in fade-in duration-200">
          {/* Top bar with close */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
            <h2 className="text-lg font-bold text-white">Account</h2>
            <button
              onClick={() => setAccountMenuOpen(false)}
              className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all active:scale-95"
              aria-label="Close"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Scrollable content */}
          <div className="h-full overflow-y-auto pb-24 px-4 py-6">
            {/* User Info */}
            {user && (
              <div className="flex items-center gap-3 mb-6 pb-6 border-b border-white/10">
                {userAvatar ? (
                  <img
                    src={userAvatar}
                    alt={userName}
                    className="h-14 w-14 rounded-full object-cover ring-2 ring-white/20"
                  />
                ) : (
                  <div className="h-14 w-14 rounded-full bg-gradient-to-br from-[#FF9245] to-[#EB423B] flex items-center justify-center text-white text-xl font-bold">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-lg font-bold text-white truncate">{userName}</div>
                  <div className="text-sm text-white/60 truncate">{userEmail}</div>
                </div>
              </div>
            )}

            {/* Menu Items */}
            <nav className="space-y-1">
              <Link
                to="/account"
                onClick={() => setAccountMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3.5 rounded-lg text-base font-medium text-white/80 hover:bg-white/10 hover:text-white transition-colors active:scale-95"
              >
                <UserIcon className="h-5 w-5" />
                Profile
              </Link>

              <Link
                to="/watchlist"
                onClick={() => setAccountMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3.5 rounded-lg text-base font-medium text-white/80 hover:bg-white/10 hover:text-white transition-colors active:scale-95"
              >
                <Bookmark className="h-5 w-5" />
                Watchlist
              </Link>

              <Link
                to="/history"
                onClick={() => setAccountMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3.5 rounded-lg text-base font-medium text-white/80 hover:bg-white/10 hover:text-white transition-colors active:scale-95"
              >
                <Clock className="h-5 w-5" />
                History
              </Link>

              <Link
                to="/preferences"
                onClick={() => setAccountMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3.5 rounded-lg text-base font-medium text-white/80 hover:bg-white/10 hover:text-white transition-colors active:scale-95"
              >
                <Settings className="h-5 w-5" />
                Settings
              </Link>
            </nav>

            {/* Sign Out Button */}
            <div className="mt-6 pt-6 border-t border-white/10">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 font-medium text-base transition-all active:scale-95"
              >
                <LogOut className="h-5 w-5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
