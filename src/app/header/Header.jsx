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
  Heart,
} from 'lucide-react'

export default function Header({ onOpenSearch }) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [scrolled, setScrolled] = useState(false)
  const [scrollDirection, setScrollDirection] = useState('up')
  const [lastScrollY, setLastScrollY] = useState(0)
  const [dropdownOpen, setDropdownOpen] = useState(false)
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

  // Smart scroll with smooth hide/show
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      setScrolled(currentScrollY > 20)
      
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

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setDropdownOpen(false)
    navigate('/')
  }

  const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'User'
  const userEmail = user?.email || ''
  const userAvatar = user?.user_metadata?.avatar_url || null

  return (
    <>
      {/* Desktop & Tablet Header - Netflix/Plex inspired with FeelFlick branding */}
      <header
        ref={hdrRef}
        className={`
          fixed top-0 left-0 right-0 z-50 
          transition-all duration-500 ease-out
          ${scrollDirection === 'down' ? '-translate-y-full' : 'translate-y-0'}
          ${scrolled 
            ? 'bg-[#0B1120]/95 backdrop-blur-xl shadow-lg shadow-black/20' 
            : 'bg-gradient-to-b from-black/60 via-black/30 to-transparent'
          }
        `}
        style={{
          willChange: 'transform',
        }}
      >
        {/* Ambient glow effect on scroll */}
        {scrolled && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 left-1/4 w-96 h-32 bg-[#667eea]/5 blur-3xl" />
            <div className="absolute top-0 right-1/4 w-96 h-32 bg-[#764ba2]/5 blur-3xl" />
          </div>
        )}

        <div className="relative max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            
            {/* Left Section - Logo & Navigation */}
            <div className="flex items-center gap-8">
              {/* Logo - Apple-inspired minimal with gradient */}
              <Link 
                to="/home" 
                className="group flex items-center gap-3 relative"
              >
                <div className="relative">
                  {/* Glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-[#667eea] to-[#764ba2] blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-300" />
                  
                  {/* Icon */}
                  <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-[#667eea] to-[#764ba2] shadow-lg shadow-[#667eea]/20">
                    <Sparkles className="h-5 w-5 text-white" strokeWidth={2.5} />
                  </div>
                </div>
                
                {/* Brand Text */}
                <span className="hidden sm:block text-xl lg:text-2xl font-black tracking-tight">
                  <span className="bg-gradient-to-r from-[#667eea] via-[#764ba2] to-[#f093fb] bg-clip-text text-transparent">
                    FEELFLICK
                  </span>
                </span>
              </Link>

              {/* Desktop Navigation - Netflix style */}
              <nav className="hidden md:flex items-center gap-1">
                <NavLink
                  to="/home"
                  className={({ isActive }) =>
                    `px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                      isActive
                        ? 'text-white bg-white/10'
                        : 'text-white/70 hover:text-white hover:bg-white/5'
                    }`
                  }
                >
                  <div className="flex items-center gap-2">
                    <Home className="h-4 w-4" />
                    <span>Home</span>
                  </div>
                </NavLink>

                <NavLink
                  to="/discover"
                  className={({ isActive }) =>
                    `px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                      isActive
                        ? 'text-white bg-white/10'
                        : 'text-white/70 hover:text-white hover:bg-white/5'
                    }`
                  }
                >
                  <div className="flex items-center gap-2">
                    <Compass className="h-4 w-4" />
                    <span>Discover</span>
                  </div>
                </NavLink>

                <NavLink
                  to="/watchlist"
                  className={({ isActive }) =>
                    `px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                      isActive
                        ? 'text-white bg-white/10'
                        : 'text-white/70 hover:text-white hover:bg-white/5'
                    }`
                  }
                >
                  <div className="flex items-center gap-2">
                    <Bookmark className="h-4 w-4" />
                    <span>Watchlist</span>
                  </div>
                </NavLink>
              </nav>
            </div>

            {/* Right Section - Search & Profile */}
            <div className="flex items-center gap-3">
              {/* Search Button - Apple inspired */}
              <button
                onClick={onOpenSearch}
                className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#667eea]/30 text-white/70 hover:text-white transition-all duration-200 group"
              >
                <SearchIcon className="h-4 w-4 text-white/50 group-hover:text-[#667eea] transition-colors" />
                <span className="text-sm font-medium hidden lg:block">Search movies...</span>
              </button>

              {/* Mobile Search Icon */}
              <button
                onClick={onOpenSearch}
                className="sm:hidden flex items-center justify-center w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-all"
              >
                <SearchIcon className="h-5 w-5" />
              </button>

              {/* User Profile Dropdown - Plex inspired */}
              {user && (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 px-3 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#667eea]/30 transition-all duration-200 group"
                  >
                    {/* Avatar */}
                    {userAvatar ? (
                      <img
                        src={userAvatar}
                        alt={userName}
                        className="w-7 h-7 rounded-full object-cover ring-2 ring-white/10 group-hover:ring-[#667eea]/30"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center text-white text-sm font-bold ring-2 ring-white/10 group-hover:ring-[#667eea]/30">
                        {userName.charAt(0).toUpperCase()}
                      </div>
                    )}

                    {/* Name & Chevron */}
                    <span className="hidden lg:block text-sm font-medium text-white/90">
                      {userName}
                    </span>
                    <ChevronDown
                      className={`hidden lg:block h-4 w-4 text-white/50 transition-transform duration-200 ${
                        dropdownOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {/* Dropdown Menu - Apple inspired */}
                  {dropdownOpen && (
                    <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl bg-[#0f172a]/95 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/40 overflow-hidden animate-scale-in">
                      {/* User Info */}
                      <div className="p-4 border-b border-white/10 bg-gradient-to-br from-[#667eea]/10 to-[#764ba2]/10">
                        <div className="flex items-center gap-3">
                          {userAvatar ? (
                            <img
                              src={userAvatar}
                              alt={userName}
                              className="w-12 h-12 rounded-full object-cover ring-2 ring-white/20"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center text-white text-lg font-bold ring-2 ring-white/20">
                              {userName.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-white truncate">
                              {userName}
                            </div>
                            <div className="text-xs text-white/50 truncate">
                              {userEmail}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Menu Items */}
                      <div className="p-2">
                        <Link
                          to="/watchlist"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/90 hover:text-white hover:bg-white/10 transition-all"
                        >
                          <Bookmark className="h-4 w-4 text-white/50" />
                          <span>My Watchlist</span>
                        </Link>

                        <Link
                          to="/history"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/90 hover:text-white hover:bg-white/10 transition-all"
                        >
                          <Clock className="h-4 w-4 text-white/50" />
                          <span>Watch History</span>
                        </Link>

                        <Link
                          to="/preferences"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/90 hover:text-white hover:bg-white/10 transition-all"
                        >
                          <Heart className="h-4 w-4 text-white/50" />
                          <span>Preferences</span>
                        </Link>

                        <Link
                          to="/account"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/90 hover:text-white hover:bg-white/10 transition-all"
                        >
                          <Settings className="h-4 w-4 text-white/50" />
                          <span>Account Settings</span>
                        </Link>
                      </div>

                      {/* Sign Out */}
                      <div className="p-2 border-t border-white/10">
                        <button
                          onClick={handleSignOut}
                          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all"
                        >
                          <LogOut className="h-4 w-4" />
                          <span>Sign Out</span>
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

      {/* Mobile Bottom Navigation - Prime Video inspired */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0B1120]/98 backdrop-blur-xl border-t border-white/10 shadow-2xl shadow-black/40">
        {/* Ambient glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute bottom-0 left-1/4 w-64 h-24 bg-[#667eea]/5 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-64 h-24 bg-[#764ba2]/5 blur-3xl" />
        </div>

        <div className="relative grid grid-cols-4 gap-1 px-2 py-2">
          <NavLink
            to="/home"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all ${
                isActive
                  ? 'text-white bg-gradient-to-br from-[#667eea]/20 to-[#764ba2]/20 shadow-lg shadow-[#667eea]/10'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Home className={`h-5 w-5 ${isActive ? 'text-[#667eea]' : ''}`} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-xs font-medium">Home</span>
              </>
            )}
          </NavLink>

          <NavLink
            to="/discover"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all ${
                isActive
                  ? 'text-white bg-gradient-to-br from-[#667eea]/20 to-[#764ba2]/20 shadow-lg shadow-[#667eea]/10'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Compass className={`h-5 w-5 ${isActive ? 'text-[#667eea]' : ''}`} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-xs font-medium">Discover</span>
              </>
            )}
          </NavLink>

          <button
            onClick={onOpenSearch}
            className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl text-white/60 hover:text-white hover:bg-white/5 transition-all"
          >
            <SearchIcon className="h-5 w-5" />
            <span className="text-xs font-medium">Search</span>
          </button>

          <NavLink
            to="/mobile-account"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all ${
                isActive
                  ? 'text-white bg-gradient-to-br from-[#667eea]/20 to-[#764ba2]/20 shadow-lg shadow-[#667eea]/10'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {userAvatar ? (
                  <img
                    src={userAvatar}
                    alt={userName}
                    className={`w-5 h-5 rounded-full object-cover ${
                      isActive ? 'ring-2 ring-[#667eea]' : 'ring-1 ring-white/20'
                    }`}
                  />
                ) : (
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    isActive 
                      ? 'bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white' 
                      : 'bg-white/10 text-white/70'
                  }`}>
                    {userName.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-xs font-medium">Account</span>
              </>
            )}
          </NavLink>
        </div>
      </nav>

      {/* Add animation styles */}
      <style jsx>{`
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(-10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        .animate-scale-in {
          animation: scale-in 0.15s ease-out;
        }
      `}</style>
    </>
  )
}
