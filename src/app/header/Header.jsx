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
      {/* Desktop & Tablet Header */}
      <header
  ref={hdrRef}
  className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300
    ${scrolled ? 'bg-[#0a0a0a]/95 backdrop-blur-md shadow-2xl' : 'bg-gradient-to-b from-black/90 to-transparent backdrop-blur-md'}
    ${scrollDirection === 'down' ? 'md:-translate-y-full translate-y-0' : 'md:translate-y-0 translate-y-0'}`}
  style={{ paddingTop: 'env(safe-area-inset-top, 0.5rem)' }}
>
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="flex items-center justify-between h-16">

      {/* Logo */}
      <Link to="/home" className="flex items-center gap-2 group">
        <div className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-[#FF9245] to-[#EB423B] bg-clip-text text-transparent group-hover:scale-105 transition-transform select-none tracking-tight uppercase shadow-text">
          FEELFLICK
        </div>
      </Link>

      {/* Navigation */}
      <nav className="hidden md:flex items-center gap-8 font-bold text-md uppercase tracking-wide">
        <NavLink
          to="/home"
          className={({ isActive }) =>
            `transition px-2 py-1 rounded-lg
             ${isActive ? 'bg-gradient-to-r from-[#FF9245] to-[#EB423B] text-white shadow-md' : 'text-white/70 hover:text-white hover:bg-white/10'}`
          }
        >
          Home
        </NavLink>
        <NavLink
          to="/browse"
          className={({ isActive }) =>
            `transition px-2 py-1 rounded-lg
             ${isActive ? 'bg-gradient-to-r from-[#FF9245] to-[#EB423B] text-white shadow-md' : 'text-white/70 hover:text-white hover:bg-white/10'}`
          }
        >
          Discover
        </NavLink>
        <NavLink
          to="/watchlist"
          className={({ isActive }) =>
            `transition px-2 py-1 rounded-lg
             ${isActive ? 'bg-gradient-to-r from-[#FF9245] to-[#EB423B] text-white shadow-md' : 'text-white/70 hover:text-white hover:bg-white/10'}`
          }
        >
          Watchlist
        </NavLink>
      </nav>

      {/* Actions: Search + Profile */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <button
          onClick={onOpenSearch}
          className="p-2 text-white/80 hover:text-white hover:bg-gradient-to-br from-[#ff9245]/20 to-[#eb423b]/20 rounded-xl transition shadow-lg active:scale-95"
          aria-label="Search"
        >
          <SearchIcon className="h-6 w-6" />
        </button>

        {/* Profile Dropdown */}
        <div className="hidden md:block relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 p-1.5 rounded-full bg-gradient-to-br from-[#FF9245] to-[#EB423B] ring-2 ring-white/20 shadow-lg hover:shadow-xl transition">
            {userAvatar ?
              <img src={userAvatar} alt={userName} className="h-8 w-8 rounded-full object-cover" /> :
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#FF9245] to-[#EB423B] flex items-center justify-center text-white font-bold uppercase">
                {userName?.charAt(0)}
              </div>
            }
            <ChevronDown className={`h-4 w-4 text-white/80 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-xl bg-[#1a1a1a] border border-white/10 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              {/* User */}
              <div className="px-4 py-4 border-b border-white/10">
                <div className="font-semibold text-white truncate text-lg leading-tight">{userName}</div>
                <div className="text-xs text-white/60 truncate">{userEmail}</div>
              </div>
              {/* Links */}
              <div>
                <NavLink to="/account" className="flex items-center gap-3 px-4 py-3 text-sm text-white/90 hover:bg-white/10 transition-colors">
                  <UserIcon className="h-5 w-5" /> Profile
                </NavLink>
                <NavLink to="/watchlist" className="flex items-center gap-3 px-4 py-3 text-sm text-white/90 hover:bg-white/10 transition-colors">
                  <Bookmark className="h-5 w-5" /> Watchlist
                </NavLink>
                <NavLink to="/history" className="flex items-center gap-3 px-4 py-3 text-sm text-white/90 hover:bg-white/10 transition-colors">
                  <Clock className="h-5 w-5" /> History
                </NavLink>
                <NavLink to="/preferences" className="flex items-center gap-3 px-4 py-3 text-sm text-white/90 hover:bg-white/10 transition-colors">
                  <Settings className="h-5 w-5" /> Settings
                </NavLink>
              </div>
              {/* Sign Out */}
              <div className="border-t border-white/10 py-3">
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-gradient-to-r from-red-500/10 to-pink-500/10 hover:text-red-300 transition-colors"
                >
                  <LogOut className="h-5 w-5" /> Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
  {/* Mobile Bottom Nav stays as is */}
</header>


      {/* Mobile Bottom Navigation - ALWAYS visible */}
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

          {/* Account button - navigates to /mobile-account route */}
          <NavLink
            to="/mobile-account"
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
                {userAvatar ? (
                  <img
                    src={userAvatar}
                    alt={userName}
                    className={`h-6 w-6 rounded-full object-cover ${
                      isActive ? 'ring-2 ring-white/40' : 'ring-2 ring-white/10'
                    }`}
                  />
                ) : (
                  <div className={`h-6 w-6 rounded-full bg-gradient-to-br from-[#FF9245] to-[#EB423B] flex items-center justify-center text-white text-[10px] font-bold ${
                    isActive ? 'ring-2 ring-white/40' : ''
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
    </>
  )
}
