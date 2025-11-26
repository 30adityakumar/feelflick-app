// src/app/header/Header.jsx
import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '@/shared/lib/supabase/client'
import { 
  Home, Compass, Search as SearchIcon, ChevronDown, LogOut, 
  User as UserIcon, Settings, Bookmark, Clock 
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
      setUser(data?.user ?? null)
    }
    getUser()
    const { data } = supabase.auth.onAuthStateChange((_e, s) => {
      setUser(s?.user ?? null)
    })
    unsub = data?.subscription?.unsubscribe
    return () => { if (typeof unsub === 'function') unsub() }
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
  const userEmail = user?.email
  const userAvatar = user?.user_metadata?.avatar_url || null

  return (
    <>
      {/* Desktop / Tablet Header */}
      <header 
          ref={hdrRef}
          className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
            scrolled 
              ? 'bg-[#0a0a0a]/95 backdrop-blur-xl shadow-lg shadow-purple-900/5 border-b border-white/5' 
              : 'bg-gradient-to-b from-black/95 via-black/80 to-transparent'
          } ${scrollDirection === 'down' ? 'md:-translate-y-full' : 'translate-y-0'}`}
          style={{ paddingTop: 'env(safe-area-inset-top)' }}
        >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between min-h-[4rem] sm:min-h-[5rem] py-3">

            
            {/* Logo */}
            <Link to="/home" className="flex items-center gap-2 group relative">
              <div className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300">
                FEELFLICK
              </div>
              {/* Subtle glow effect behind logo */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <DesktopNavLink to="/home">Home</DesktopNavLink>
              <DesktopNavLink to="/browse">Discover</DesktopNavLink>
              <DesktopNavLink to="/watchlist">Watchlist</DesktopNavLink>
            </nav>

            {/* Right Side Actions */}
            <div className="flex items-center gap-3 sm:gap-4">
              {/* Search Button */}
              <button 
                onClick={onOpenSearch}
                className="p-2.5 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all active:scale-95"
                aria-label="Search"
              >
                <SearchIcon className="h-5 w-5" />
              </button>

              {/* User Dropdown (Desktop only) */}
              {user && (
                <div className="hidden md:block relative" ref={dropdownRef}>
                  <button 
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 p-1.5 hover:bg-white/10 rounded-full transition-all group"
                  >
                    {userAvatar ? (
                      <img 
                        src={userAvatar} 
                        alt={userName} 
                        className="h-9 w-9 rounded-full object-cover ring-2 ring-white/10 group-hover:ring-purple-500/50 transition-all" 
                      />
                    ) : (
                      <div className="h-9 w-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-purple-500/20">
                        {userName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <ChevronDown className={`h-4 w-4 text-white/70 transition-transform duration-300 ${dropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Menu */}
                  {dropdownOpen && (
                    <div className="absolute right-0 mt-3 w-60 rounded-2xl bg-[#1a1a1a] border border-white/10 shadow-2xl shadow-black/50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 origin-top-right">
                      <div className="px-5 py-4 border-b border-white/5 bg-white/5">
                        <div className="font-bold text-white text-sm truncate">{userName}</div>
                        <div className="text-xs text-white/50 truncate">{userEmail}</div>
                      </div>
                      
                      <div className="py-2">
                        <DropdownLink to="/account" icon={UserIcon}>Profile</DropdownLink>
                        <DropdownLink to="/watchlist" icon={Bookmark}>Watchlist</DropdownLink>
                        <DropdownLink to="/history" icon={Clock}>History</DropdownLink>
                        <DropdownLink to="/preferences" icon={Settings}>Settings</DropdownLink>
                      </div>

                      <div className="border-t border-white/5 py-2 bg-white/[0.02]">
                        <button 
                          onClick={handleSignOut}
                          className="w-full flex items-center gap-3 px-5 py-2.5 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
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

      {/* Mobile Bottom Navigation - ALWAYS visible */}
      <nav 
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-xl border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 0.5rem)' }}
      >
        <div className="flex items-center justify-around px-2 pt-2">
          <MobileNavLink to="/home" icon={Home} label="Home" />
          <MobileNavLink to="/browse" icon={Compass} label="Discover" />
          
          {/* Search is special on mobile bottom bar */}
          <button 
            onClick={onOpenSearch}
            className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl text-white/60 hover:text-white transition-colors active:scale-95"
          >
            <SearchIcon className="h-6 w-6" />
            <span className="text-[10px] font-medium">Search</span>
          </button>

          {/* Account Nav Item */}
          <NavLink 
            to="/mobile-account"
            className={({ isActive }) => `
              flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-300
              ${isActive ? 'text-white' : 'text-white/60 hover:text-white'}
            `}
          >
            {({ isActive }) => (
              <>
                {userAvatar ? (
                  <img 
                    src={userAvatar} 
                    alt={userName} 
                    className={`h-6 w-6 rounded-full object-cover transition-all ${isActive ? 'ring-2 ring-purple-500' : 'ring-1 ring-white/20'}`}
                  />
                ) : (
                  <div className={`h-6 w-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-[10px] font-bold ${isActive ? 'ring-2 ring-purple-400' : ''}`}>
                    {userName.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className={`text-[10px] font-medium ${isActive ? 'text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 font-bold' : ''}`}>
                  Account
                </span>
              </>
            )}
          </NavLink>
        </div>
      </nav>
    </>
  )
}

// ------------------------------------------------------------------
// Sub-components for cleaner code & TopNav alignment
// ------------------------------------------------------------------

function DesktopNavLink({ to, children }) {
  return (
    <NavLink 
      to={to} 
      className={({ isActive }) => `
        relative px-1 py-2 text-sm font-bold transition-colors duration-300 group
        ${isActive ? 'text-white' : 'text-white/60 hover:text-white'}
      `}
    >
      {({ isActive }) => (
        <>
          {children}
          {/* Expanding underline animation from TopNav */}
          <span className={`absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300 ${isActive ? 'w-full' : 'w-0 group-hover:w-full'}`} />
        </>
      )}
    </NavLink>
  )
}

function DropdownLink({ to, icon: Icon, children, onClick }) {
  return (
    <Link 
      to={to} 
      onClick={onClick}
      className="flex items-center gap-3 px-5 py-2.5 text-sm text-white/70 hover:bg-white/10 hover:text-white transition-all hover:translate-x-1"
    >
      <Icon className="h-4 w-4" />
      {children}
    </Link>
  )
}

function MobileNavLink({ to, icon: Icon, label }) {
  return (
    <NavLink 
      to={to} 
      className={({ isActive }) => `
        flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-300
        ${isActive ? 'text-white' : 'text-white/60 hover:text-white'}
      `}
    >
      {({ isActive }) => (
        <>
          <Icon 
            className={`h-6 w-6 transition-all duration-300 ${isActive ? 'stroke-purple-400 scale-110 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]' : ''}`} 
            strokeWidth={isActive ? 2.5 : 2}
          />
          <span className={`text-[10px] font-medium transition-colors ${isActive ? 'text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 font-bold' : ''}`}>
            {label}
          </span>
        </>
      )}
    </NavLink>
  )
}
