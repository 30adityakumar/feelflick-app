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
  Clock
} from 'lucide-react'

export default function Header({ onOpenSearch }) {
  const pathname = useLocation().pathname
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
      const data = await supabase.auth.getUser()
      setUser(data?.user ?? null)
    }
    getUser()
    const { data } = supabase.auth.onAuthStateChange((e, s) => setUser(s?.user ?? null))
    unsub = data?.subscription?.unsubscribe
    return () => { if (typeof unsub === 'function') unsub() }
  }, [])

  // Smart scroll
  useEffect(() => {
    const handleScroll = () => {
      const cur = window.scrollY
      setScrolled(cur > 16)
      setScrollDirection(cur > lastScrollY ? 'down' : 'up')
      setLastScrollY(cur)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  // Set header height variable for layout
  useEffect(() => {
    const el = hdrRef.current
    if (!el) return
    const setHeight = () => {
      document.body.style.setProperty('--header-h', `${el.offsetHeight}px`)
    }
    setHeight()
    window.addEventListener('resize', setHeight)
    return () => window.removeEventListener('resize', setHeight)
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e) {
      if (!dropdownRef.current) return
      if (!dropdownRef.current.contains(e.target)) setDropdownOpen(false)
    }
    if (dropdownOpen) document.addEventListener('mousedown', handleClick)
    else document.removeEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [dropdownOpen])

  // Sign out
  async function signOut() {
    await supabase.auth.signOut()
    setDropdownOpen(false)
    navigate('/login')
  }

  // Main branding and nav
  return (
    <>
      {/* Top Header */}
      <header
        ref={hdrRef}
        className={`fixed top-0 left-0 w-full z-30 transition-all duration-300 bg-[#0B1120]/90 shadow-lg backdrop-blur-xl
          ${scrolled && scrollDirection === 'down' ? '-translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'}
        `}
        style={{ height: '72px' }}
      >
        <div className="flex items-center h-18 max-w-7xl mx-auto px-4 md:px-8">
          {/* Branding */}
          <Link
            to="/home"
            className="flex items-center gap-2 mr-6 select-none"
            aria-label="FeelFlick Home"
          >
            <span className="text-3xl font-extrabold bg-gradient-to-r from-[#667eea] via-[#764ba2] to-[#f093fb] bg-clip-text text-transparent tracking-tight drop-shadow-md">
              FEELFLICK
            </span>
          </Link>
          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-3 flex-1">
            <NavLink
              to="/home"
              className={({ isActive }) =>
                `px-3 py-2 rounded-xl font-semibold text-sm transition-colors duration-200 ${
                  isActive ? 'text-[#667eea] bg-white/5' : 'text-white/80 hover:text-white'
                }`
              }
            >
              <Home className="inline h-5 w-5 mr-2" />
              Home
            </NavLink>
            <NavLink
              to="/discover"
              className={({ isActive }) =>
                `px-3 py-2 rounded-xl font-semibold text-sm transition-colors duration-200 ${
                  isActive ? 'text-[#764ba2] bg-white/5' : 'text-white/80 hover:text-white'
                }`
              }
            >
              <Compass className="inline h-5 w-5 mr-2" />
              Discover
            </NavLink>
            <NavLink
              to="/watchlist"
              className={({ isActive }) =>
                `px-3 py-2 rounded-xl font-semibold text-sm transition-colors duration-200 ${
                  isActive ? 'text-[#f093fb] bg-white/5' : 'text-white/80 hover:text-white'
                }`
              }
            >
              <Bookmark className="inline h-5 w-5 mr-2" />
              Watchlist
            </NavLink>
            <button
              type="button"
              onClick={onOpenSearch}
              className="ml-4 px-3 py-2 rounded-xl font-semibold text-sm text-white/80 bg-white/5 hover:bg-white/10 transition-colors flex items-center"
            >
              <SearchIcon className="h-5 w-5 mr-2" />
              Search
            </button>
          </nav>
          {/* Profile Dropdown */}
          <div className="relative ml-4">
            <button
              className="flex items-center gap-2 px-2 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              aria-label="User profile"
            >
              {user?.user_metadata?.avatar_url ? (
                <img
                  src={user.user_metadata.avatar_url}
                  alt="Avatar"
                  className="h-8 w-8 rounded-full border-2 border-[#667eea] object-cover"
                />
              ) : (
                <UserIcon className="h-7 w-7 text-white/80" />
              )}
              <ChevronDown className="h-4 w-4 text-white/60" />
            </button>
            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div
                ref={dropdownRef}
                className="absolute top-10 right-0 min-w-[200px] bg-[#18181d] rounded-lg shadow-lg border border-white/10 z-50 py-2"
              >
                <button
                  className="w-full px-5 py-3 text-left flex items-center gap-2 hover:bg-white/5 transition-colors"
                  onClick={() => {
                    setDropdownOpen(false)
                    navigate('/account')
                  }}
                >
                  <UserIcon className="h-5 w-5" />
                  Account
                </button>
                <button
                  className="w-full px-5 py-3 text-left flex items-center gap-2 hover:bg-white/5 transition-colors"
                  onClick={() => {
                    setDropdownOpen(false)
                    navigate('/watchlist')
                  }}
                >
                  <Bookmark className="h-5 w-5" />
                  Watchlist
                </button>
                <button
                  className="w-full px-5 py-3 text-left flex items-center gap-2 hover:bg-white/5 transition-colors"
                  onClick={() => {
                    setDropdownOpen(false)
                    navigate('/history')
                  }}
                >
                  <Clock className="h-5 w-5" />
                  History
                </button>
                <button
                  className="w-full px-5 py-3 text-left flex items-center gap-2 hover:bg-white/5 transition-colors"
                  onClick={() => {
                    setDropdownOpen(false)
                    navigate('/settings')
                  }}
                >
                  <Settings className="h-5 w-5" />
                  Settings
                </button>
                <hr className="my-2 border-white/10" />
                <button
                  className="w-full px-5 py-3 text-left flex items-center gap-2 text-red-400 hover:bg-red-500/10 transition-colors"
                  onClick={signOut}
                >
                  <LogOut className="h-5 w-5" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Tab Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-30 bg-[#101016]/95 border-t border-white/10 shadow-xl flex">
        <NavLink
          to="/home"
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center py-2 justify-center text-xs font-semibold ${
              isActive ? 'text-[#667eea] bg-[#18181d]/60' : 'text-white/70'
            }`
          }
        >
          <Home className="h-6 w-6 mb-1" />
          Home
        </NavLink>
        <NavLink
          to="/discover"
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center py-2 justify-center text-xs font-semibold ${
              isActive ? 'text-[#764ba2] bg-[#18181d]/60' : 'text-white/70'
            }`
          }
        >
          <Compass className="h-6 w-6 mb-1" />
          Discover
        </NavLink>
        <button
          type="button"
          className="flex-1 flex flex-col items-center py-2 justify-center text-xs font-semibold text-white/70"
          onClick={onOpenSearch}
        >
          <SearchIcon className="h-6 w-6 mb-1" />
          Search
        </button>
        <NavLink
          to="/account"
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center py-2 justify-center text-xs font-semibold ${
              isActive ? 'text-[#f093fb] bg-[#18181d]/60' : 'text-white/70'
            }`
          }
        >
          {user?.user_metadata?.avatar_url ? (
            <img
              src={user.user_metadata.avatar_url}
              alt="Avatar"
              className="h-6 w-6 mb-1 rounded-full border-2 border-[#667eea] object-cover"
            />
          ) : (
            <UserIcon className="h-6 w-6 mb-1" />
          )}
          Account
        </NavLink>
      </nav>

      {/* Header CSS variable for layout usage */}
      <style>{`
        body { --topnav-h: 72px; }
      `}</style>
    </>
  )
}
