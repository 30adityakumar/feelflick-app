// src/app/header/Header.jsx

import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { Home, Compass, Search as SearchIcon, ChevronDown, LogOut, User as UserIcon, Settings, Bookmark, Clock } from 'lucide-react'
import { supabase } from '@/shared/lib/supabase/client'

export default function Header({ onOpenSearch }) {
  const pathname = useLocation()
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [scrolled, setScrolled] = useState(false)
  const [scrollDirection, setScrollDirection] = useState('up')
  const [lastScrollY, setLastScrollY] = useState(0)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const hdrRef = useRef(null)
  const dropdownRef = useRef(null)

  // User session fetch
  useEffect(() => {
    let unsub
    async function getUser() {
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
    function handleScroll() {
      const currentY = window.scrollY
      setScrolled(currentY > 8)
      setScrollDirection(currentY > lastScrollY ? 'down' : 'up')
      setLastScrollY(currentY)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (dropdownOpen && dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [dropdownOpen])

  // Brand gradient and bar style - inspired by TopNav
  return (
    <header
      ref={hdrRef}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300
        ${scrolled ? 'bg-black/85 shadow-lg shadow-black/20 backdrop-blur-xl border-b border-white/10' : 'bg-black/65 backdrop-blur-lg'}
      `}
      style={{ minHeight: 64 }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo (Gradient) */}
          <Link to="/home" className="flex items-center gap-2 group">
            <span className="text-2xl sm:text-3xl font-black tracking-tight
              bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent group-hover:scale-105 transition-transform">
              FEELFLICK
            </span>
          </Link>

          {/* Main Navigation */}
          <nav className="flex items-center gap-1 sm:gap-3">
            <NavLink
              to="/home"
              className={({ isActive }) =>
                `px-4 py-1.5 rounded-lg font-semibold text-sm transition
                ${isActive ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md' : 'text-white/80 hover:text-white/95 hover:bg-white/5'}`
              }
            >
              Home
            </NavLink>
            <NavLink
              to="/explore"
              className={({ isActive }) =>
                `px-4 py-1.5 rounded-lg font-semibold text-sm transition
                ${isActive ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md' : 'text-white/80 hover:text-white/95 hover:bg-white/5'}`
              }
            >
              Explore
            </NavLink>
            <NavLink
              to="/watchlist"
              className={({ isActive }) =>
                `px-4 py-1.5 rounded-lg font-semibold text-sm transition
                ${isActive ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md' : 'text-white/80 hover:text-white/95 hover:bg-white/5'}`
              }
            >
              <Bookmark className="inline h-4 w-4 mr-2" />
              Watchlist
            </NavLink>
            <NavLink
              to="/history"
              className={({ isActive }) =>
                `px-4 py-1.5 rounded-lg font-semibold text-sm transition
                ${isActive ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md' : 'text-white/80 hover:text-white/95 hover:bg-white/5'}`
              }
            >
              <Clock className="inline h-4 w-4 mr-2" />
              History
            </NavLink>
          </nav>

          {/* Actions / Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Search button */}
            <button
              onClick={onOpenSearch}
              className="p-2 rounded-lg bg-white/10 hover:bg-gradient-to-r from-purple-500 to-pink-500 hover:text-white text-white/70 transition shadow hover:shadow-xl"
              title="Search"
            >
              <SearchIcon className="h-5 w-5" />
            </button>

            {/* Profile/Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 
                  hover:bg-gradient-to-r from-purple-500 to-pink-500 text-white/80 hover:text-white font-semibold transition shadow hover:shadow-xl"
                onClick={() => setDropdownOpen(v => !v)}
              >
                <UserIcon className="h-5 w-5" />
                <span className="hidden sm:inline-block">{user?.user_metadata?.name?.split(' ')[0] || 'Account'}</span>
                <ChevronDown className="h-4 w-4 ml-1" />
              </button>
              {/* Dropdown */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48
                  rounded-xl bg-black/90 backdrop-blur-lg border border-white/10 shadow-xl
                  z-50 py-1 animate-fade-in">
                  <NavLink
                    to="/profile"
                    className="block px-4 py-2 text-sm text-white/80 hover:bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg"
                  >
                    <UserIcon className="inline h-4 w-4 mr-2" />
                    Profile
                  </NavLink>
                  <NavLink
                    to="/preferences"
                    className="block px-4 py-2 text-sm text-white/80 hover:bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg"
                  >
                    <Settings className="inline h-4 w-4 mr-2" />
                    Preferences
                  </NavLink>
                  <button
                    className="w-full text-left px-4 py-2 text-sm text-white/80 hover:bg-gradient-to-r from-red-400 to-pink-500 rounded-lg"
                    onClick={async () => {
                      await supabase.auth.signOut()
                      navigate('/login')
                    }}
                  >
                    <LogOut className="inline h-4 w-4 mr-2" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(8px);}
          to { opacity: 1; transform: none;}
        }
        .animate-fade-in { animation: fade-in 0.35s ease-out;}
      `}</style>
    </header>
  )
}
