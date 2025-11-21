// src/app/header/Header.jsx
import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { 
  Home, Compass, Search as SearchIcon, ChevronDown, LogOut, 
  User as UserIcon, Settings, Bookmark, Clock 
} from 'lucide-react'
import { supabase } from '@/shared/lib/supabase/client'

export default function Header({ onOpenSearch }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [scrolled, setScrolled] = useState(false)
  const [scrollDirection, setScrollDirection] = useState('up')
  const [lastScrollY, setLastScrollY] = useState(0)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const hdrRef = useRef(null)
  const dropdownRef = useRef(null)
  
  // Get user session
  useEffect(() => {
    let unsub
    const getUser = async () => {
      const { data } = await supabase.auth.getUser()
      setUser(data?.user ?? null)
    }
    getUser()
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user ?? null))
    unsub = data?.subscription?.unsubscribe
    return () => { if (typeof unsub === 'function') unsub() }
  }, [])

  // Smart scroll
  useEffect(() => {
    const handleScroll = () => {
      const current = window.scrollY
      setScrolled(current > 10)
      setScrollDirection(current > lastScrollY ? 'down' : 'up')
      setLastScrollY(current)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  // Close dropdown on click outside
  useEffect(() => {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    if (dropdownOpen) document.addEventListener('mousedown', handleClick)
    else document.removeEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [dropdownOpen])

  // User initials
  const initials = user?.user_metadata?.name
    ? user.user_metadata.name.split(' ').map(w => w[0]).join('').slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() ?? 'FF'
  const avatarUrl = user?.user_metadata?.avatar_url || null
  const userName = user?.user_metadata?.name || user?.email || "FeelFlick user"
  const userEmail = user?.email || ''

  // Mobile nav tabs
  const mobileTabs = [
    { link: '/home', icon: Home, label: 'Home' },
    { link: '/discover', icon: Compass, label: 'Discover' },
    { link: '/watchlist', icon: Bookmark, label: 'Watchlist' },
    { link: '/history', icon: Clock, label: 'History' }
  ]

  // Sign out
  const signOut = async () => {
    setDropdownOpen(false)
    await supabase.auth.signOut()
    navigate('/login', { replace: true })
  }

  return (
    <>
      {/* Animated header */}
      <header
        ref={hdrRef}
        className={`
          fixed top-0 left-0 right-0 z-50
          transition-all duration-400
          bg-gradient-to-b from-[#667eea] via-[#764ba2] to-[#18181d]
          ${scrolled ? "bg-opacity-95 shadow-xl backdrop-blur-md" : "bg-opacity-80 shadow-lg"}
          ${scrollDirection === "down" ? "md:-translate-y-16" : "translate-y-0"}
        `}
        style={{ paddingTop: "env(safe-area-inset-top)", minHeight: "4rem" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex items-center justify-between h-16 select-none">
          {/* FeelFlick logo */}
          <Link to="/home" className="flex gap-2 items-center group">
            <span className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-[#667eea] via-[#764ba2] to-[#f093fb] bg-clip-text text-transparent drop-shadow-lg transition-all duration-200 group-hover:scale-105">
              FEELFLICK
            </span>
          </Link>
          
          {/* Desktop nav links */}
          <nav className="hidden md:flex items-center gap-6">
            <NavLink to="/home" className={({ isActive }) =>
              `font-semibold text-sm px-3 py-2 rounded-lg transition bg-gradient-to-r ${isActive 
                ? 'from-[#764ba2]/60 to-[#f093fb]/60 text-white shadow-lg'
                : 'from-[#18181d]/0 to-[#18181d]/0 text-white/70 hover:bg-[#764ba2]/50 hover:text-white'
              }`
            } end>Home</NavLink>
            <NavLink to="/discover" className={({ isActive }) =>
              `font-semibold text-sm px-3 py-2 rounded-lg transition bg-gradient-to-r ${isActive 
                ? 'from-[#667eea]/80 to-[#764ba2]/60 text-white shadow-lg'
                : 'from-[#18181d]/0 to-[#18181d]/0 text-white/70 hover:bg-[#667eea]/50 hover:text-white'
              }`
            }>Discover</NavLink>
            <NavLink to="/watchlist" className={({ isActive }) =>
              `font-semibold text-sm px-3 py-2 rounded-lg transition bg-gradient-to-r ${isActive 
                ? 'from-[#f093fb]/80 to-[#764ba2]/60 text-white shadow-lg'
                : 'from-[#18181d]/0 to-[#18181d]/0 text-white/70 hover:bg-[#f093fb]/60 hover:text-white'
              }`
            }>Watchlist</NavLink>
            <NavLink to="/history" className={({ isActive }) =>
              `font-semibold text-sm px-3 py-2 rounded-lg transition bg-gradient-to-r ${isActive 
                ? 'from-[#FF9245] to-[#EB423B] text-white shadow-lg'
                : 'from-[#18181d]/0 to-[#18181d]/0 text-white/70 hover:bg-[#FF9245]/60 hover:text-white'
              }`
            }>History</NavLink>
          </nav>

          {/* Desktop actions */}
          <div className="flex items-center gap-4">
            {/* Search */}
            <button 
              onClick={onOpenSearch} 
              className="hidden md:inline-flex items-center justify-center p-2 rounded-lg hover:bg-[#764ba2]/20 text-white hover:text-[#f093fb] transition-all focus:outline-none"
              aria-label="Open search"
            >
              <SearchIcon className="h-6 w-6" />
            </button>

            {/* Profile/Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(v => !v)}
                className="flex items-center gap-2 p-1 rounded-full transition-all focus:outline-none hover:ring-2 hover:ring-[#764ba2] hover:ring-offset-2"
                aria-label="Profile"
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={userName}
                    className="h-8 w-8 rounded-full border-2 border-[#764ba2] shadow-xl object-cover"
                  />
                ) : (
                  <span className="h-8 w-8 rounded-full bg-gradient-to-br from-[#667eea] to-[#f093fb] text-white font-bold flex items-center justify-center">{initials}</span>
                )}
                <ChevronDown className="h-4 w-4 text-white/70" />
              </button>
              {/* Dropdown */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-3 w-64 rounded-xl bg-gradient-to-br from-[#18181d] via-[#18181d]/80 to-[#0B1120] border border-white/10 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-30">
                  <div className="px-5 py-4 border-b border-white/10">
                    <div className="font-bold text-white text-lg">{userName}</div>
                    <div className="text-xs text-white/50">{userEmail}</div>
                  </div>
                  <div className="py-2 flex flex-col">
                    <Link to="/account" className="flex items-center gap-3 px-5 py-2 text-sm text-white/80 hover:text-[#f093fb] transition"><Settings className="h-4 w-4"/>Account</Link>
                    <Link to="/watchlist" className="flex items-center gap-3 px-5 py-2 text-sm text-white/80 hover:text-[#f093fb] transition"><Bookmark className="h-4 w-4"/>Watchlist</Link>
                    <Link to="/history" className="flex items-center gap-3 px-5 py-2 text-sm text-white/80 hover:text-[#f093fb] transition"><Clock className="h-4 w-4"/>History</Link>
                  </div>
                  <div className="border-t border-white/10 py-2">
                    <button onClick={signOut} className="w-full flex items-center gap-3 px-5 py-2 text-sm text-[#f093fb] hover:bg-[#764ba2]/10 transition"><LogOut className="h-4 w-4"/>Sign Out</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile nav bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-[#667eea] via-[#764ba2] to-[#0B1120] backdrop-blur border-t border-[#764ba2] shadow-2xl" style={{paddingBottom: "env(safe-area-inset-bottom, 0.75rem)"}}>
        <div className="flex items-center justify-around px-2 pt-2">
          {mobileTabs.map(tab => {
            const Icon = tab.icon
            const active = location.pathname.startsWith(tab.link)
            return (
              <NavLink
                key={tab.link}
                to={tab.link}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center gap-1 px-3 py-1 transition select-none ${
                    isActive || active
                      ? 'text-[#f093fb] scale-105 drop-shadow-lg'
                      : 'text-white/70 hover:text-[#764ba2]'
                  }`
                }
                end
              >
                <Icon className="h-6 w-6" />
                <span className="text-xs font-medium">{tab.label}</span>
              </NavLink>
            )
          })}
          {/* Account avatar shortcut */}
          <button
            onClick={() => navigate('/account')}
            className="flex flex-col items-center gap-1 px-3 py-1 transition select-none"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="Account" className="h-6 w-6 rounded-full ring-2 ring-[#764ba2] ring-offset-2" />
            ) : (
              <span className="h-6 w-6 rounded-full bg-gradient-to-br from-[#667eea] to-[#f093fb] text-white text-xs font-bold flex items-center justify-center">{initials}</span>
            )}
            <span className="text-xs font-medium text-white/80">Account</span>
          </button>
        </div>
      </nav>
      {/* Spacing for fixed header and nav */}
      <div className="h-16 md:block hidden" />
      <div className="pb-14 md:hidden block" />
    </>
  )
}
