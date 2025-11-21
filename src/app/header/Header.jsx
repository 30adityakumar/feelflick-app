// src/app/header/Header.jsx
import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  Home, Compass, Search as SearchIcon, ChevronDown, LogOut, User as UserIcon,
  Settings, Bookmark, Clock, X, ChevronRight, HelpCircle, Shield,
} from 'lucide-react'
import { supabase } from '@/shared/lib/supabase/client'

export default function Header({ onOpenSearch }) {
  const pathname = useLocation()
  const [user, setUser] = useState(null)
  const [scrolled, setScrolled] = useState(false)
  const [scrollDirection, setScrollDirection] = useState('up')
  const [lastScrollY, setLastScrollY] = useState(0)
  const hdrRef = useRef(null)

  // User session
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
      const currentScrollY = window.scrollY
      setScrolled(currentScrollY > 10)
      setScrollDirection(currentScrollY > lastScrollY ? 'down' : 'up')
      setLastScrollY(currentScrollY)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  // Navigation links
  const links = [
    { to: '/', icon: <Home />, label: 'Home', exact: true },
    { to: '/discover', icon: <Compass />, label: 'Discover' },
    { to: '/watchlist', icon: <Bookmark />, label: 'Watchlist' },
    { to: '/history', icon: <Clock />, label: 'History' }
  ]

  // Color theme gradients
  const gradientText = "bg-gradient-to-r from-purple-500 via-pink-400 to-amber-400 bg-clip-text text-transparent"
  const buttonGradient = "bg-gradient-to-r from-purple-500 via-pink-500 to-amber-400"
  const glowShadow = "shadow-2xl shadow-purple-500/60"

  return (
    <>
      {/* Desktop Header */}
      <header
        ref={hdrRef}
        className={`fixed top-0 left-0 right-0 z-40 flex items-center justify-between h-16 px-6 sm:px-10 bg-gradient-to-b from-black/80 via-[#0c1017]/90 to-transparent backdrop-blur-md border-b border-white/10 transition-all duration-500 ${scrolled ? 'shadow-2xl shadow-purple-500/20' : ''}`}
      >
        {/* Logo */}
        <Link to="/" className="inline-flex items-center gap-2 group">
          <span className={`block text-xl md:text-2xl font-black tracking-tight select-none ${gradientText} transition-all duration-300`}>
            FEELFLICK
          </span>
        </Link>

        {/* Main Nav */}
        <nav className="hidden md:flex items-center gap-6 flex-1 justify-center xl:gap-10">
          {links.map((link, idx) => (
            <NavLink
              key={link.to}
              exact={link.exact}
              to={link.to}
              className={({ isActive }) =>
                `relative flex items-center gap-2 px-3 py-2 rounded-xl text-base font-semibold transition-all duration-300 group
                ${isActive
                  ? `${gradientText} ${glowShadow}`
                  : "text-white/70 hover:text-white hover:bg-white/5 hover:shadow-lg hover:shadow-purple-500/40"
                }`
              }
            >
              <span className="mr-1">{link.icon}</span>
              <span>{link.label}</span>
            </NavLink>
          ))}

          {/* Search Button */}
          <button
            onClick={onOpenSearch}
            className={`inline-flex items-center gap-2 h-10 px-5 rounded-full font-semibold text-base ${buttonGradient} text-white ${glowShadow} border border-white/10 hover:border-white/30 transition-all duration-300 group`}
            aria-label="Search movies"
          >
            <SearchIcon className="h-5 w-5 text-white group-hover:text-amber-400 transition-colors" />
            <span className="ml-2 hidden lg:inline group-hover:text-amber-400 transition-colors">Search</span>
          </button>
        </nav>

        {/* Account Menu */}
        {user ? (
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-amber-400 flex items-center justify-center text-base font-bold text-white ring-2 ring-white/20 shadow-2xl shadow-purple-500/30">
              {user?.user_metadata?.name?.charAt(0) ?? <UserIcon className="h-4 w-4 text-white" />}
            </div>
            {/* Name */}
            <span
              className={`text-lg font-bold ${gradientText} transition-all duration-300 truncate max-w-[140px]`}
              title={user?.user_metadata?.name}
            >
              {user?.user_metadata?.name?.split(' ')[0]}
            </span>
            {/* Dropdown */}
            <button
              className="pl-2 pr-1 py-2 hover:bg-white/10 rounded-xl text-white"
              aria-label="Account menu"
            >
              <ChevronDown className="h-5 w-5" />
            </button>
          </div>
        ) : (
          <Link
            to="/login"
            className={`ml-6 px-5 py-2 rounded-full font-semibold text-base ${buttonGradient} text-white ${glowShadow} transition-all duration-300 hover:scale-105 hover:shadow-2xl`}
          >
            Login
          </Link>
        )}
      </header>

      {/* MOBILE Navigation / Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-b from-black/90 via-purple-950 to-black/90 backdrop-blur-md border-t border-white/10 shadow-2xl shadow-purple-500/20 flex justify-around items-center h-16 px-3">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `relative flex flex-col items-center justify-center px-2 pt-1 rounded-xl text-xs font-semibold group transition-all
              ${isActive ? "text-amber-400" : "text-white/70 hover:text-white"}`
            }
          >
            <span className={`mb-1 ${isActive ? "text-amber-400" : "text-white/70 group-hover:text-pink-400"}`}>
              {link.icon}
            </span>
            <span>{link.label}</span>
          </NavLink>
        ))}

        {/* Mobile Avatar */}
        {user && (
          <div className="h-7 w-7 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-amber-400 flex items-center justify-center text-xs font-bold ring-2 ring-white/20 shadow-lg shadow-purple-500/30 ml-2">
            {user.user_metadata?.name?.charAt(0) ?? <UserIcon className="h-3 w-3 text-white" />}
          </div>
        )}
      </nav>
    </>
  )
}
