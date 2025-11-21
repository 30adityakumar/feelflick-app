// src/app/header/Header.jsx
import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '@/shared/lib/supabase/client'
import { 
  Home, Compass, Search as SearchIcon, ChevronDown, LogOut, 
  User as UserIcon, Settings, Bookmark, Clock, Menu
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

  // --- User Session ---
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

  // --- Smart Scroll Logic ---
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      // Threshold for background transparency
      setScrolled(currentScrollY > 20)

      // Smart hide/show
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setScrollDirection('down')
        setDropdownOpen(false) // Auto-close dropdown on scroll
      } else {
        setScrollDirection('up')
      }
      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  // --- Close dropdown on outside click ---
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false)
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [dropdownOpen])

  // --- Sign Out ---
  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setDropdownOpen(false)
    navigate('/')
  }

  const userName = user?.user_metadata?.name || user?.email?.split('@')[0]
  const userEmail = user?.email
  const userAvatar = user?.user_metadata?.avatar_url || null

  // --- Helper Components ---
  const NavItem = ({ to, icon: Icon, label }) => (
    <NavLink 
      to={to} 
      className={({ isActive }) => `
        relative group flex items-center gap-2 px-1 py-2 text-sm font-bold transition-colors duration-300
        ${isActive ? 'text-white' : 'text-white/60 hover:text-white'}
      `}
    >
      {({ isActive }) => (
        <>
          {Icon && <Icon className={`w-4 h-4 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />}
          <span>{label}</span>
          {/* Gradient Underline */}
          <span className={`absolute bottom-0 left-0 h-[2px] w-full rounded-full bg-gradient-to-r from-[#FF9245] to-[#EB423B] transform transition-all duration-300 origin-left ${isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`} />
        </>
      )}
    </NavLink>
  )

  return (
    <>
      {/* --- Desktop / Tablet Header --- */}
      <header 
        ref={hdrRef}
        className={`
          fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out
          ${scrolled ? 'bg-[#0a0a0a]/80 backdrop-blur-xl shadow-2xl border-b border-white/5' : 'bg-transparent border-transparent'}
          ${scrollDirection === 'down' ? '-translate-y-full' : 'translate-y-0'}
        `}
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            
            {/* Left: Logo & Desktop Nav */}
            <div className="flex items-center gap-8 lg:gap-12">
              {/* Logo */}
              <Link to="/home" className="group relative flex items-center gap-2 focus:outline-none">
                <div className="text-2xl sm:text-3xl font-black tracking-tight bg-gradient-to-r from-[#FF9245] to-[#EB423B] bg-clip-text text-transparent transition-transform duration-300 group-hover:scale-105">
                  FEELFLICK
                </div>
              </Link>

              {/* Desktop Nav */}
              <nav className="hidden md:flex items-center gap-6">
                <NavItem to="/home" label="Home" />
                <NavItem to="/browse" label="Discover" />
                <NavItem to="/watchlist" label="Watchlist" />
              </nav>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-3 sm:gap-5">
              
              {/* Search Button (Expanded on Desktop?) - For now, icon style */}
              <button 
                onClick={onOpenSearch}
                className="p-2.5 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-all duration-300 active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#FF9245]/50"
                aria-label="Search"
              >
                <SearchIcon className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>

              {/* User Dropdown (Desktop Only) */}
              {user && (
                <div className="hidden md:block relative" ref={dropdownRef}>
                  <button 
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className={`
                      flex items-center gap-3 pl-1.5 pr-3 py-1.5 rounded-full transition-all duration-300 border border-transparent
                      ${dropdownOpen ? 'bg-white/10 border-white/10' : 'hover:bg-white/5 hover:border-white/5'}
                    `}
                  >
                    {userAvatar ? (
                      <img src={userAvatar} alt={userName} className="h-8 w-8 rounded-full object-cover ring-2 ring-[#FF9245]/20" />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#FF9245] to-[#EB423B] flex items-center justify-center text-white text-sm font-bold shadow-lg">
                        {userName?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="text-sm font-medium text-white/90 max-w-[100px] truncate">
                      {userName?.split(' ')[0]}
                    </span>
                    <ChevronDown className={`h-4 w-4 text-white/50 transition-transform duration-300 ${dropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Menu */}
                  {dropdownOpen && (
                    <div className="absolute right-0 mt-3 w-64 origin-top-right rounded-2xl bg-[#161616]/95 backdrop-blur-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 ring-1 ring-white/5">
                      
                      {/* Header */}
                      <div className="px-5 py-4 border-b border-white/5 bg-white/5">
                        <div className="text-sm font-bold text-white truncate">{userName}</div>
                        <div className="text-xs text-white/50 truncate mt-0.5">{userEmail}</div>
                      </div>

                      {/* Links */}
                      <div className="py-2">
                        {[
                          { to: '/account', icon: UserIcon, label: 'Profile' },
                          { to: '/watchlist', icon: Bookmark, label: 'Watchlist' },
                          { to: '/history', icon: Clock, label: 'History' },
                          { to: '/preferences', icon: Settings, label: 'Settings' },
                        ].map((item) => (
                          <Link 
                            key={item.to}
                            to={item.to}
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-3 px-5 py-3 text-sm font-medium text-white/70 hover:text-white hover:bg-gradient-to-r hover:from-[#FF9245]/10 hover:to-transparent transition-all duration-200 border-l-2 border-transparent hover:border-[#FF9245]"
                          >
                            <item.icon className="h-4 w-4" />
                            {item.label}
                          </Link>
                        ))}
                      </div>

                      {/* Footer */}
                      <div className="border-t border-white/5 p-2">
                        <button 
                          onClick={handleSignOut}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all duration-200"
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

      {/* --- Mobile Bottom Navigation (App-like) --- */}
      <nav 
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-xl border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] pb-[env(safe-area-inset-bottom)]"
      >
        <div className="flex items-center justify-around px-2 pt-2 pb-1">
          <MobileNavItem to="/home" icon={Home} label="Home" />
          <MobileNavItem to="/browse" icon={Compass} label="Discover" />
          
          {/* Search Button Mobile */}
          <button 
            onClick={onOpenSearch}
            className="flex flex-col items-center gap-1 p-2 rounded-xl text-white/50 hover:text-white transition-colors active:scale-95"
          >
            <div className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 transition-colors">
              <SearchIcon className="h-6 w-6" />
            </div>
            <span className="text-[10px] font-medium">Search</span>
          </button>

          <MobileNavItem to="/mobile-account" icon={userAvatar ? null : UserIcon} label="Account" customIcon={
            userAvatar ? (
              <img src={userAvatar} alt="Me" className="h-6 w-6 rounded-full object-cover ring-2 ring-white/20" />
            ) : null
          } />
        </div>
      </nav>
    </>
  )
}

// --- Mobile Nav Item Helper ---
function MobileNavItem({ to, icon: Icon, label, customIcon }) {
  return (
    <NavLink 
      to={to} 
      className={({ isActive }) => `
        flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-300 active:scale-95 w-16
        ${isActive ? 'text-[#FF9245]' : 'text-white/50 hover:text-white'}
      `}
    >
      {({ isActive }) => (
        <>
          {customIcon ? (
            <div className={`transition-transform duration-300 ${isActive ? 'scale-110 ring-2 ring-[#FF9245] rounded-full' : ''}`}>
              {customIcon}
            </div>
          ) : (
            <Icon className={`h-6 w-6 transition-all duration-300 ${isActive ? 'fill-current drop-shadow-[0_0_10px_rgba(255,146,69,0.5)]' : ''}`} />
          )}
          <span className={`text-[10px] font-medium transition-all ${isActive ? 'font-bold' : ''}`}>
            {label}
          </span>
        </>
      )}
    </NavLink>
  )
}
