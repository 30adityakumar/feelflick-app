// src/app/header/Header.jsx
import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '@/shared/lib/supabase/client'
import {
  Home, Compass, Search as SearchIcon, ChevronDown, LogOut, User as UserIcon,
  Settings, Bookmark, Clock
} from 'lucide-react'

export default function Header({ onOpenSearch }) {
  const pathname = useLocation().pathname
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [scrolled, setScrolled] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const hdrRef = useRef(null)
  const dropdownRef = useRef(null)
  const scrollDirection = useRef('up')
  const lastScrollY = useRef(0)

  // Session
  useEffect(() => {
    let unsub
    const getUser = async () => {
      const { data } = await supabase.auth.getUser()
      setUser(data?.user || null)
    }
    getUser()
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user || null))
    unsub = data?.subscription?.unsubscribe
    return () => { if (typeof unsub === 'function') unsub() }
  }, [])

  // Smart scroll for header hide/reveal
  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY
      setScrolled(currentY > 8)
      scrollDirection.current = currentY > lastScrollY.current ? 'down' : 'up'
      lastScrollY.current = currentY
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Click outside dropdown
  useEffect(() => {
    if (!dropdownOpen) return
    const closeDropdown = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', closeDropdown)
    return () => document.removeEventListener('mousedown', closeDropdown)
  }, [dropdownOpen])

  // Visual orb effects
  const Orb = ({ className, style }) => (
    <div className={`absolute pointer-events-none rounded-full blur-3xl opacity-40 animate-float ${className}`} style={style} />
  )

  // Brand gradient for logo
  const BrandLogo = (
    <Link to="/" className="flex items-center">
      <span className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-amber-400 bg-clip-text text-transparent shadow-2xl shadow-purple-500/60 transition-transform hover:scale-105 duration-300 select-none">
        FEELFLICK
      </span>
    </Link>
  )

  // Navigation items & icons
  const navLinks = [
    { to: '/home', label: 'Home', icon: Home },
    { to: '/browse', label: 'Discover', icon: Compass },
    { to: '/watchlist', label: 'Watchlist', icon: Bookmark },
    { to: '/history', label: 'History', icon: Clock },
  ]

  // Color classes for nav states
  const getNavClass = (isActive) =>
    `text-sm font-bold pb-0.5 transition-all ${
      isActive
        ? 'text-white border-b-2 border-amber-400'
        : 'text-white/70 border-b-2 border-transparent'
    } hover:text-white hover:border-pink-400`

  return (
    <header
      ref={hdrRef}
      className={`
        fixed top-0 left-0 right-0 z-50
        backdrop-blur-md
        bg-[#0a121a] bg-gradient-to-b from-black/75 to-[#0d1722]/80
        shadow-2xl shadow-purple-500/60
        transition-all duration-300
        ${scrolled ? 'md:translate-y-0 -translate-y-full translate-y-0' : ''}
      `}
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      {/* Orb effects */}
      <Orb className="left-0 top-0 w-40 h-40 bg-purple-400/30" />
      <Orb className="right-0 bottom-0 w-32 h-32 bg-pink-400/20 animate-float-delayed" />

      <div className="relative flex items-center justify-between h-[62px] px-4 md:px-12">
        {/* Logo */}
        <div className="flex-1 flex items-center gap-8">
          {BrandLogo}
        </div>

        {/* Main Nav */}
        <nav className="hidden md:flex gap-2 items-center ml-4">
          {navLinks.map(({ to, label }, idx) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => getNavClass(isActive)}
            >
              {label}
            </NavLink>
          ))}
          <button
            type="button"
            onClick={onOpenSearch}
            className="ml-2 p-2 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-amber-400 shadow-lg shadow-purple-500/40 text-white hover:scale-110 transition"
            aria-label="Search"
          >
            <SearchIcon className="h-5 w-5" />
          </button>
        </nav>

        {/* User dropdown */}
        <div className="flex items-center gap-3 ml-6">
          {user ? (
            <button
              ref={dropdownRef}
              onClick={() => setDropdownOpen((v) => !v)}
              className="flex items-center gap-2 group"
            >
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-amber-400 flex items-center justify-center text-white text-sm font-bold shadow-md">
                {user.user_metadata?.name?.charAt(0).toUpperCase()}
              </div>
              <ChevronDown className="h-4 w-4 text-amber-400 group-hover:text-pink-400" />
            </button>
          ) : (
            <Link to="/account" className="h-8 w-8 bg-gradient-to-br from-purple-500 via-pink-500 to-amber-400 rounded-full flex items-center justify-center text-white shadow-md">
              <UserIcon className="h-5 w-5" />
            </Link>
          )}
          {/* Dropdown menu */}
          {dropdownOpen && (
            <div className="absolute right-8 top-12 w-56 rounded-xl bg-[#0d1722] bg-gradient-to-br from-purple-900 via-black to-pink-900 border border-white/10 shadow-2xl overflow-hidden backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-200 z-50">
              <Link to="/account" className="flex items-center gap-3 px-5 py-4 text-sm font-bold text-white hover:text-amber-400 transition">
                <UserIcon className="h-4 w-4 text-purple-400 mr-2" />
                My Account
              </Link>
              <Link to="/settings" className="flex items-center gap-3 px-5 py-4 text-sm font-bold text-white hover:text-amber-400 transition">
                <Settings className="h-4 w-4 text-pink-400 mr-2" />
                Settings
              </Link>
              <button
                onClick={async () => {
                  await supabase.auth.signOut()
                  navigate('/landing')
                }}
                className="flex items-center gap-3 px-5 py-4 w-full text-sm font-bold text-white hover:text-red-500 border-t border-white/10 transition"
              >
                <LogOut className="h-4 w-4 text-red-500 mr-2" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="
        md:hidden fixed bottom-0 left-0 right-0 z-50
        bg-[#0c1017] bg-gradient-to-t from-[#0d1722] to-transparent
        backdrop-blur-md border-t border-white/10 shadow-2xl
      " style={{paddingBottom: 'max(env(safe-area-inset-bottom), 0.5rem)'}}>
        <div className="flex items-center justify-between px-6 py-3">
          {navLinks.map(({ to, icon: Icon }, idx) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 text-xs font-bold
                ${isActive
                  ? 'text-amber-400'
                  : 'text-white/70'
                } hover:text-pink-400`}
            >
              <Icon className={`h-6 w-6 mb-1 ${window.location.pathname === to ? 'drop-shadow-lg' : ''}`} />
            </NavLink>
          ))}
          <button
            type="button"
            onClick={onOpenSearch}
            className="p-2 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-amber-400 shadow-lg text-white"
            aria-label="Search"
          >
            <SearchIcon className="h-6 w-6" />
          </button>
        </div>
      </nav>
    </header>
  )
}


