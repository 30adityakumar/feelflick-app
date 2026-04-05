// src/app/header/Header.jsx
import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { supabase } from '@/shared/lib/supabase/client'
import { Search as SearchIcon, ChevronDown, LogOut, User as UserIcon, Settings, Bookmark, Clock } from 'lucide-react'

export default function Header({ onOpenSearch }) {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [scrolled, setScrolled] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const hdrRef = useRef(null)
  const dropdownRef = useRef(null)

  // User session
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data?.user ?? null))
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user ?? null))
    return () => data?.subscription?.unsubscribe?.()
  }, [])

  // Scrolled state (for backdrop)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [dropdownOpen])

  // Expose header height as CSS var
  useEffect(() => {
    const update = () => {
      document.documentElement.style.setProperty(
        '--hdr-h',
        `${hdrRef.current?.offsetHeight || 56}px`
      )
    }
    update()
    const ro = new ResizeObserver(update)
    if (hdrRef.current) ro.observe(hdrRef.current)
    return () => ro.disconnect()
  }, [])

  const handleSignOut = async () => {
    setDropdownOpen(false)
    await supabase.auth.signOut()
    navigate('/')
  }

  const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'User'
  const userInitial = userName.charAt(0).toUpperCase()
  const userEmail = user?.email
  const userAvatar = user?.user_metadata?.avatar_url || null

  return (
    <header
      ref={hdrRef}
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
      className={`w-full transition-all duration-300 ${
        scrolled
          ? 'bg-black/88 backdrop-blur-xl border-b border-white/[0.06] shadow-lg shadow-black/30'
          : 'bg-gradient-to-b from-black/70 to-transparent'
      }`}
    >
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-4">

          {/* ── Logo ─────────────────────────────────────────────── */}
          <Link
            to="/home"
            className="shrink-0 text-xl sm:text-2xl font-black bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent hover:opacity-85 transition-opacity duration-200"
          >
            FEELFLICK
          </Link>

          {/* ── Desktop nav ──────────────────────────────────────── */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
            {[
              { to: '/home',      label: 'Home'      },
              { to: '/discover',  label: 'Discover'  },
              { to: '/browse',    label: 'Browse'    },
              { to: '/watchlist', label: 'Watchlist' },
            ].map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `relative px-3.5 py-2 text-sm font-semibold rounded-lg transition-all duration-200 group
                  ${isActive
                    ? 'text-white'
                    : 'text-white/50 hover:text-white/85 hover:bg-white/5'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {label}
                    {isActive && (
                      <span className="absolute bottom-0.5 left-3.5 right-3.5 h-[2px] rounded-full bg-gradient-to-r from-purple-500 to-pink-500" />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* ── Right actions ─────────────────────────────────────── */}
          <div className="flex items-center gap-2">

            {/* Search */}
            <button
              onClick={onOpenSearch}
              aria-label="Search films"
              className="flex items-center gap-2.5 pl-3.5 pr-3 py-2 rounded-full border border-white/10 bg-white/5 text-white/45 hover:text-white/80 hover:bg-white/9 hover:border-white/18 transition-all duration-200 active:scale-95"
            >
              <SearchIcon className="h-4 w-4 shrink-0" />
              <span className="hidden lg:flex items-center gap-2 text-sm pr-0.5">
                Search films…
                <kbd className="hidden xl:inline-block text-[10px] px-1.5 py-0.5 rounded border border-white/10 bg-white/5 text-white/30 font-mono leading-none">/</kbd>
              </span>
            </button>

            {/* Avatar + dropdown */}
            {user && (
              <div className="hidden md:block relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(v => !v)}
                  aria-label="Account menu"
                  aria-expanded={dropdownOpen}
                  className="flex items-center gap-1.5 p-1 rounded-full hover:bg-white/8 transition-all duration-200 group"
                >
                  {userAvatar ? (
                    <img
                      src={userAvatar}
                      alt={userName}
                      className="h-8 w-8 rounded-full object-cover ring-2 ring-white/10 group-hover:ring-purple-500/40 transition-all"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-purple-500/20">
                      {userInitial}
                    </div>
                  )}
                  <ChevronDown
                    className={`h-3.5 w-3.5 text-white/40 transition-transform duration-250 ${dropdownOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {/* Dropdown panel */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2.5 w-56 rounded-2xl bg-black/95 border border-white/10 shadow-2xl shadow-black/60 backdrop-blur-xl overflow-hidden z-50"
                    style={{ animation: 'dropdownIn 0.15s ease-out' }}
                  >
                    {/* Top accent line */}
                    <div className="h-px bg-gradient-to-r from-transparent via-purple-500/40 to-transparent" />

                    {/* Profile header */}
                    <div className="px-4 py-3.5 border-b border-white/5">
                      <div className="flex items-center gap-3">
                        {userAvatar ? (
                          <img src={userAvatar} alt={userName} className="h-9 w-9 rounded-full object-cover ring-1 ring-white/10" />
                        ) : (
                          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                            {userInitial}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-white truncate">{userName}</div>
                          <div className="text-xs text-white/40 truncate">{userEmail}</div>
                        </div>
                      </div>
                    </div>

                    {/* Menu items */}
                    <div className="py-1.5">
                      <DropdownLink to="/account"     icon={UserIcon} onClick={() => setDropdownOpen(false)}>Profile</DropdownLink>
                      <DropdownLink to="/watchlist"   icon={Bookmark} onClick={() => setDropdownOpen(false)}>Watchlist</DropdownLink>
                      <DropdownLink to="/history"     icon={Clock}    onClick={() => setDropdownOpen(false)}>Watch history</DropdownLink>
                      <DropdownLink to="/preferences" icon={Settings} onClick={() => setDropdownOpen(false)}>Settings</DropdownLink>
                    </div>

                    {/* Sign out */}
                    <div className="border-t border-white/5 py-1.5">
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white/50 hover:text-red-400 hover:bg-red-500/8 transition-all duration-150 rounded-lg mx-0"
                      >
                        <LogOut className="h-4 w-4 shrink-0" />
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      </div>

      <style>{`
        @keyframes dropdownIn {
          from { opacity: 0; transform: translateY(-6px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
      `}</style>
    </header>
  )
}

function DropdownLink({ to, icon: Icon, children, onClick }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/55 hover:text-white/90 hover:bg-white/5 transition-all duration-150 rounded-lg mx-1.5"
    >
      <Icon className="h-4 w-4 shrink-0 text-white/30" />
      {children}
    </Link>
  )
}
