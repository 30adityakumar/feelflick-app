// src/app/header/Header.jsx
import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Search as SearchIcon, ChevronDown, LogOut, User as UserIcon, Settings, Bookmark, Clock, Fingerprint, Users, ListVideo, LogIn, Bell } from 'lucide-react'
import { supabase } from '@/shared/lib/supabase/client'
import { useAuthSession } from '@/shared/hooks/useAuthSession'
import { useGoogleAuth } from '@/features/landing/utils/useGoogleAuth'
import { useUnreadFeed } from '@/shared/hooks/useUnreadFeed'

export default function Header({ onOpenSearch }) {
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const { user, isAuthenticated } = useAuthSession()
  const { signInWithGoogle, isAuthenticating } = useGoogleAuth()
  const userId = user?.id ?? null
  const { hasUnread } = useUnreadFeed(userId)

  const hdrRef = useRef(null)
  const dropdownRef = useRef(null)

  // Scrolled state (for backdrop)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    onScroll()
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

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handler)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('keydown', handleEscape)
    }
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
      className={`w-full transition-all duration-500 ease-in-out ${
        scrolled
          ? 'bg-black/75 backdrop-blur-xl border-b border-white/[0.08] shadow-lg shadow-black/20'
          : 'bg-black/30 backdrop-blur-md border-b border-white/[0.06]'
      }`}
    >
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-4">

          {/* ── Logo ─────────────────────────────────────────────── */}
          <Link
            to={isAuthenticated ? '/home' : '/'}
            className="shrink-0 text-xl sm:text-2xl font-black bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent hover:opacity-85 transition-opacity duration-200"
          >
            FEELFLICK
          </Link>

          {/* ── Desktop nav ──────────────────────────────────────── */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
            {(isAuthenticated
              ? [
                  { to: '/home',      label: 'Home'      },
                  { to: '/browse',    label: 'Browse'    },
                  { to: '/discover',  label: 'Discover'  },
                  { to: '/watchlist', label: 'Watchlist' },
                ]
              : [
                  { to: '/discover',  label: 'Discover'  },
                  { to: '/browse',    label: 'Browse'    },
                ]
            ).map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `relative rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors duration-200
                  ${isActive
                    ? 'text-white/90 border-b-2 border-white/40'
                    : 'text-white/50 hover:text-white/85 hover:bg-white/5'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>

          {/* ── Right actions ─────────────────────────────────────── */}
          <div className="flex items-center gap-2">

            {/* Search */}
            <button
              type="button"
              onClick={onOpenSearch}
              aria-label="Search films"
              className="flex items-center gap-2.5 rounded-full border border-white/10 bg-white/5 py-2 pl-3.5 pr-3 text-white/45 transition-colors duration-200 hover:border-white/18 hover:bg-white/9 hover:text-white/80 active:scale-95"
            >
              <SearchIcon className="h-4 w-4 shrink-0" />
              <span className="hidden lg:flex items-center gap-2 text-sm pr-0.5">
                Search films…
                <kbd className="hidden xl:inline-block text-[10px] px-1.5 py-0.5 rounded border border-white/10 bg-white/5 text-white/30 font-mono leading-none">/</kbd>
              </span>
            </button>

            {user && (
              <button
                type="button"
                onClick={() => navigate('/feed')}
                aria-label="Activity feed"
                className="relative w-9 h-9 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/8 transition-all duration-200"
              >
                <Bell className="w-[18px] h-[18px]" />
                {hasUnread && (
                  <span
                    aria-hidden="true"
                    className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-black"
                  />
                )}
              </button>
            )}

            {/* Sign In — unauthenticated users only */}
            {!user && (
              <button
                type="button"
                onClick={signInWithGoogle}
                disabled={isAuthenticating}
                className="hidden md:flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white/80 transition-all duration-200 hover:border-purple-500/40 hover:bg-white/10 hover:text-white active:scale-95 disabled:opacity-50"
                aria-label="Sign in with Google"
              >
                <LogIn className="h-4 w-4" />
                {isAuthenticating ? 'Signing in…' : 'Sign In'}
              </button>
            )}

            {/* Avatar + dropdown */}
            {user && (
              <div className="hidden md:block relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setDropdownOpen(v => !v)}
                  aria-label="Account menu"
                  aria-expanded={dropdownOpen}
                  className="group flex items-center gap-1.5 rounded-full p-1 transition-colors duration-200 hover:bg-white/8"
                >
                  {userAvatar ? (
                    <img
                      src={userAvatar}
                      alt={userName}
                      width="32"
                      height="32"
                      className="h-8 w-8 rounded-full object-cover ring-2 ring-white/10 transition group-hover:ring-purple-500/40"
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
                      <DropdownLink to="/account"     icon={UserIcon}    onClick={() => setDropdownOpen(false)}>Profile</DropdownLink>
                      <DropdownLink to="/profile"     icon={Fingerprint} onClick={() => setDropdownOpen(false)}>Taste Profile</DropdownLink>
                      <DropdownLink to="/watchlist"   icon={Bookmark}    onClick={() => setDropdownOpen(false)}>Watchlist</DropdownLink>
                      <DropdownLink to="/history"     icon={Clock}    onClick={() => setDropdownOpen(false)}>Watch history</DropdownLink>
                      <DropdownLink to="/people"      icon={Users}    onClick={() => setDropdownOpen(false)}>People</DropdownLink>
                      <DropdownLink to="/lists"       icon={ListVideo} onClick={() => setDropdownOpen(false)}>Lists</DropdownLink>
                      <DropdownLink to="/preferences" icon={Settings} onClick={() => setDropdownOpen(false)}>Settings</DropdownLink>
                    </div>

                    {/* Sign out */}
                    <div className="border-t border-white/5 py-1.5">
                      <button
                        type="button"
                        onClick={handleSignOut}
                        className="mx-0 flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm text-white/50 transition-colors duration-150 hover:bg-red-500/8 hover:text-red-400"
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
      className="mx-1.5 flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm text-white/55 transition-colors duration-150 hover:bg-white/5 hover:text-white/90"
    >
      <Icon className="h-4 w-4 shrink-0 text-white/30" />
      {children}
    </Link>
  )
}
