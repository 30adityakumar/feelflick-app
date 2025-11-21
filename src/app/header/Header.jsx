// src/app/header/Header.jsx
import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '@/shared/lib/supabase/client'
import { 
  Home, Compass, Search as SearchIcon, ChevronDown, LogOut, 
  User as UserIcon, Settings, Bookmark, Clock, Bell 
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
    return () => { if (typeof unsub === 'function') unsub() }
  }, [])

  // Smart scroll logic
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
    if (dropdownOpen) document.addEventListener('mousedown', handleClickOutside)
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

  const userName = user?.user_metadata?.name || user?.email?.split('@')[0]
  const userEmail = user?.email
  const userAvatar = user?.user_metadata?.avatar_url || null

  return (
    <>
      {/* Desktop/Tablet Header */}
      <header 
        ref={hdrRef}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out ${
          scrolled 
            ? 'bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/5 shadow-2xl' 
            : 'bg-gradient-to-b from-black/90 via-black/60 to-transparent'
        } ${scrollDirection === 'down' ? '-translate-y-full' : 'translate-y-0'}`}
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            
            {/* Logo */}
            <Link to="/home" className="flex items-center gap-2 group relative z-10">
              <div className="absolute inset-0 bg-[#FF9245]/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="text-2xl sm:text-3xl font-black tracking-tight bg-gradient-to-r from-[#FF9245] to-[#EB423B] bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300">
                FEELFLICK
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1 p-1 bg-white/5 rounded-full border border-white/5 backdrop-blur-sm absolute left-1/2 -translate-x-1/2">
              <NavPill to="/home" icon={Home}>Home</NavPill>
              <NavPill to="/browse" icon={Compass}>Discover</NavPill>
              <NavPill to="/watchlist" icon={Bookmark}>Watchlist</NavPill>
            </nav>

            {/* Right Side Actions */}
            <div className="flex items-center gap-3 sm:gap-5">
              {/* Search Button */}
              <button 
                onClick={onOpenSearch}
                className="group p-2.5 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all duration-300 active:scale-95 relative overflow-hidden"
                aria-label="Search"
              >
                <span className="absolute inset-0 bg-white/5 scale-0 group-hover:scale-100 rounded-full transition-transform duration-300" />
                <SearchIcon className="h-5 w-5 relative z-10" />
              </button>

              {/* Notifications (Placeholder) */}
              <button className="hidden sm:block group p-2.5 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all duration-300 active:scale-95 relative">
                <Bell className="h-5 w-5 relative z-10" />
                <span className="absolute top-2.5 right-2.5 h-2 w-2 bg-[#EB423B] rounded-full ring-2 ring-black animate-pulse" />
              </button>

              {/* User Dropdown (Desktop only) */}
              {user && (
                <div className="hidden md:block relative" ref={dropdownRef}>
                  <button 
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className={`flex items-center gap-3 pl-1 pr-3 py-1 rounded-full transition-all duration-300 border border-transparent ${
                      dropdownOpen ? 'bg-white/10 border-white/10' : 'hover:bg-white/5 hover:border-white/5'
                    }`}
                  >
                    <div className="relative">
                      {userAvatar ? (
                        <img 
                          src={userAvatar} 
                          alt={userName}
                          className="h-8 w-8 rounded-full object-cover ring-2 ring-transparent group-hover:ring-white/20 transition-all"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#FF9245] to-[#EB423B] flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-orange-500/20">
                          {userName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="absolute inset-0 rounded-full ring-1 ring-inset ring-white/10" />
                    </div>
                    <ChevronDown className={`h-4 w-4 text-white/50 transition-transform duration-300 ${dropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Menu */}
                  {dropdownOpen && (
                    <div className="absolute right-0 mt-3 w-64 rounded-2xl bg-[#1a1a1a]/95 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 origin-top-right">
                      <div className="px-5 py-4 border-b border-white/5 bg-white/5">
                        <div className="font-semibold text-white text-sm truncate">{userName}</div>
                        <div className="text-xs text-white/50 truncate mt-0.5">{userEmail}</div>
                      </div>
                      
                      <div className="p-2 space-y-0.5">
                        <MenuLink to="/account" icon={UserIcon} onClick={() => setDropdownOpen(false)}>Profile</MenuLink>
                        <MenuLink to="/watchlist" icon={Bookmark} onClick={() => setDropdownOpen(false)}>Watchlist</MenuLink>
                        <MenuLink to="/history" icon={Clock} onClick={() => setDropdownOpen(false)}>History</MenuLink>
                        <MenuLink to="/preferences" icon={Settings} onClick={() => setDropdownOpen(false)}>Settings</MenuLink>
                      </div>

                      <div className="p-2 border-t border-white/5">
                        <button 
                          onClick={handleSignOut}
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-xl transition-colors group"
                        >
                          <LogOut className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
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

      {/* Mobile Bottom Navigation - iOS Style Glass */}
      <nav 
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0a0a0a]/85 backdrop-blur-xl border-t border-white/10 pb-[env(safe-area-inset-bottom)] pt-1 transition-transform duration-500"
        style={{ transform: scrollDirection === 'down' ? 'translateY(100%)' : 'translateY(0)' }}
      >
        <div className="flex items-center justify-around px-2 h-[3.5rem]">
          <MobileNavIcon to="/home" icon={Home} label="Home" />
          <MobileNavIcon to="/browse" icon={Compass} label="Discover" />
          
          <button 
            onClick={onOpenSearch}
            className="flex flex-col items-center gap-1 p-2 rounded-xl text-white/50 hover:text-white active:scale-95 transition-all duration-200"
          >
            <div className="p-1.5 rounded-full bg-white/5 group-active:bg-white/10 transition-colors">
              <SearchIcon className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-medium">Search</span>
          </button>

          <MobileNavIcon 
            to="/mobile-account" 
            icon={null} 
            label="Account"
            customIcon={
              userAvatar ? (
                <img src={userAvatar} alt="Me" className="h-6 w-6 rounded-full object-cover ring-2 ring-white/10" />
              ) : (
                <div className="h-6 w-6 rounded-full bg-gradient-to-br from-[#FF9245] to-[#EB423B] flex items-center justify-center text-white text-[9px] font-bold ring-2 ring-white/10">
                  {userName?.charAt(0).toUpperCase()}
                </div>
              )
            }
          />
        </div>
      </nav>
    </>
  )
}

// Component: Desktop Nav Pill
function NavPill({ to, children, icon: Icon }) {
  return (
    <NavLink 
      to={to}
      className={({ isActive }) => `
        flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 relative
        ${isActive ? 'text-white shadow-lg shadow-orange-900/20' : 'text-white/60 hover:text-white hover:bg-white/5'}
      `}
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <div className="absolute inset-0 bg-gradient-to-r from-[#FF9245]/20 to-[#EB423B]/20 rounded-full -z-10 animate-in fade-in duration-300" />
          )}
          <Icon className={`h-4 w-4 ${isActive ? 'text-[#FF9245]' : 'opacity-70'}`} />
          <span>{children}</span>
        </>
      )}
    </NavLink>
  )
}

// Component: Dropdown Link
function MenuLink({ to, icon: Icon, children, onClick }) {
  return (
    <Link 
      to={to} 
      onClick={onClick}
      className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200 group"
    >
      <div className="p-1.5 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors">
        <Icon className="h-4 w-4" />
      </div>
      {children}
    </Link>
  )
}

// Component: Mobile Nav Icon
function MobileNavIcon({ to, icon: Icon, label, customIcon }) {
  return (
    <NavLink 
      to={to}
      className={({ isActive }) => `
        flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-300 active:scale-95 w-16
        ${isActive ? 'text-[#FF9245]' : 'text-white/50 hover:text-white/80'}
      `}
    >
      {({ isActive }) => (
        <>
          <div className={`relative ${isActive ? 'scale-110' : 'scale-100'} transition-transform duration-300`}>
            {customIcon ? customIcon : <Icon className={`h-6 w-6 ${isActive ? 'fill-current' : ''}`} />}
            {isActive && <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#FF9245] rounded-full shadow-lg shadow-orange-500" />}
          </div>
          <span className={`text-[10px] font-medium ${isActive ? 'font-bold' : ''}`}>
            {label}
          </span>
        </>
      )}
    </NavLink>
  )
}
