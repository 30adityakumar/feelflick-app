// src/app/header/Header.jsx
// FeelFlick — Header (v2 redesign).
// Wordmark + morphing-pill nav · centered command-palette search · conic-ring avatar.
// Bell removed 2026-05-24: linked to /feed which router.jsx redirects to /home
// ("Confirmed unfinished — redirect until shipped"). The bell promised an
// activity feed that doesn't exist; tapping it dead-ended. Restore alongside
// the Feed route when /feed is ready — keep `useUnreadFeed` (still
// consumed by src/app/pages/feed/Feed.jsx for markRead).

import { useEffect, useRef, useState, useLayoutEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  Search as SearchIcon, LogOut, User as UserIcon, Settings,
  Bookmark, Clock, Users, ListVideo, LogIn, Mail, LayoutGrid,
} from 'lucide-react'

import { supabase } from '@/shared/lib/supabase/client'
import { useAuthSession } from '@/shared/hooks/useAuthSession'
import { useGoogleAuth } from '@/shared/hooks/useGoogleAuth'

// Mood-tinted accent. Wire to a context later (see notes in README).
const AMBIENT_HEX = '#A78BFA'

// IA v2 (F2): the primary pills encode the doctrine's surface hierarchy —
// Core + Supporting only. "Tonight" (/home, the Briefing) is the primary
// destination; Discover (exploration) and DNA (/profile, taste identity) are the
// two Supporting surfaces that stay visible. Utility surfaces (Browse, Watchlist,
// History, Lists) and parked People live in the avatar menu so they stay
// reachable without competing with the nightly pick. The wordmark also links to
// /home. DNA stays top-level (2026-05-24): the Taste Profile is FeelFlick's
// signature "we know you" artifact (/profile is your own DNA; /profile/:userId is
// another user's). Exported as the desktop IA contract.
// See docs/ia-v2-decision-record.md.
export const NAV_AUTHED = [
  { to: '/home',     label: 'Tonight'  },
  { to: '/discover', label: 'Discover' },
  { to: '/profile',  label: 'DNA'      },
]
const NAV_ANON = [
  { to: '/discover', label: 'Discover' },
  { to: '/browse',   label: 'Browse'   },
]

// ── Morphing-pill nav ────────────────────────────────────────────────────────
function MorphNav({ items }) {
  const location = useLocation()
  const refs = useRef({})
  const [rect, setRect] = useState({ left: 0, width: 0 })

  // Find the active item based on the current pathname (NavLink-equivalent matching).
  // null when on an off-nav route (e.g. /history, /people, /account, /movie/:id) —
  // we don't fall back to items[0] because that misleads users into thinking
  // they're on Home when they're not.
  const activeItem = items.find(i => location.pathname.startsWith(i.to)) || null

  useLayoutEffect(() => {
    if (!activeItem) {
      setRect({ left: 0, width: 0 })
      return
    }
    const el = refs.current[activeItem.to]
    if (el) setRect({ left: el.offsetLeft, width: el.offsetWidth })
  }, [activeItem, items.length])

  return (
    <nav
      aria-label="Main navigation"
      className="relative hidden md:flex items-center p-1 rounded-full border border-white/8 bg-white/2.5"
    >
      {activeItem && (
        <span
          aria-hidden="true"
          className="absolute top-1 bottom-1 rounded-full border transition-all duration-350"
          style={{
            left: rect.left,
            width: rect.width,
            background: `${AMBIENT_HEX}1f`,
            borderColor: `${AMBIENT_HEX}55`,
            boxShadow: `0 0 16px ${AMBIENT_HEX}33`,
            transitionTimingFunction: 'cubic-bezier(0.2, 0.7, 0.2, 1)',
          }}
        />
      )}
      {items.map(n => (
        <Link
          key={n.to}
          to={n.to}
          ref={el => { refs.current[n.to] = el }}
          className={`relative px-4 py-1.5 rounded-full text-[13px] transition-colors duration-200 select-none ${
            activeItem?.to === n.to
              ? 'text-white font-semibold'
              : 'text-white/45 hover:text-white/80 font-medium'
          }`}
          style={{ fontFamily: '"Outfit", "Inter", sans-serif' }}
        >
          {n.label}
        </Link>
      ))}
    </nav>
  )
}

// ── Center command-palette search ─────────────────────────────────────────────
function CenterSearch({ onOpen }) {
  const [focused, setFocused] = useState(false)
  return (
    <button
      type="button"
      onClick={onOpen}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      aria-label="Search films"
      className="hidden lg:flex w-full max-w-[440px] items-center gap-3 px-3.5 py-2.5 rounded-[10px] border transition-all duration-200"
      style={{
        background: focused ? 'rgba(167,139,250,0.06)' : 'rgba(255,255,255,0.04)',
        borderColor: focused ? `${AMBIENT_HEX}66` : 'rgba(255,255,255,0.08)',
        boxShadow: focused ? '0 0 0 4px rgba(167,139,250,0.12)' : 'none',
      }}
    >
      <SearchIcon className="h-4 w-4 shrink-0" style={{ color: focused ? AMBIENT_HEX : 'rgba(248,250,252,0.45)' }} />
      <span className="flex-1 text-left text-[13.5px] text-white/45 truncate" style={{ fontFamily: '"Outfit", "Inter", sans-serif' }}>
        Search films, directors, moods, or ask M…
      </span>
      <span className="inline-flex items-center gap-1 text-[10px] text-white/30 shrink-0" style={{ fontFamily: '"Outfit", sans-serif' }}>
        <kbd className="px-1.5 py-0.5 rounded border border-white/10 bg-white/6 leading-none">⌘</kbd>
        <kbd className="px-1.5 py-0.5 rounded border border-white/10 bg-white/6 leading-none">K</kbd>
      </span>
    </button>
  )
}

// ── Avatar with conic ring + dropdown ─────────────────────────────────────────
function AvatarMenu({ userName, userInitial, userEmail, userAvatar, onSignOut }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    const esc = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', handler)
    document.addEventListener('keydown', esc)
    return () => { document.removeEventListener('mousedown', handler); document.removeEventListener('keydown', esc) }
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-label="Account menu"
        aria-expanded={open}
        className="flex items-center p-0 bg-transparent border-0 cursor-pointer"
      >
        <span className="relative w-[34px] h-[34px]">
          {/* Conic ring */}
          <span
            aria-hidden="true"
            className="absolute inset-[-3px] rounded-full opacity-75"
            style={{ background: `conic-gradient(${AMBIENT_HEX}, #EC4899, ${AMBIENT_HEX})` }}
          />
          <span className="relative block w-full h-full rounded-full p-[2px]" style={{ background: '#06060a' }}>
            {userAvatar ? (
              <img src={userAvatar} alt={userName} className="w-full h-full rounded-full object-cover" />
            ) : (
              <span
                className="w-full h-full rounded-full flex items-center justify-center text-white text-[13px] font-semibold"
                style={{ background: 'linear-gradient(135deg, #9333ea 0%, #ec4899 100%)', fontFamily: '"Outfit", sans-serif' }}
              >
                {userInitial}
              </span>
            )}
          </span>
        </span>
      </button>

      {open && (
        // The outside-click listener on the wrapping `ref` div would close
        // this menu the moment a user clicked inside it. stopPropagation on
        // the dropdown root keeps interactions inside intact.
        // eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events
        <div
          onClick={e => e.stopPropagation()}
          className="absolute right-0 top-[calc(100%+10px)] w-[248px] rounded-2xl bg-black/95 border border-white/8 shadow-2xl shadow-black/60 backdrop-blur-xl overflow-hidden z-50"
          style={{ animation: 'ffDropIn 0.18s cubic-bezier(.2,.7,.2,1)' }}
        >
          <div className="h-px" style={{ background: `linear-gradient(90deg, transparent, ${AMBIENT_HEX}66, transparent)` }} />

          <div className="px-4 py-3.5 border-b border-white/5 flex items-center gap-3">
            <div className="relative w-9 h-9 shrink-0">
              <div className="absolute inset-[-2px] rounded-full opacity-40 blur-md" style={{ background: 'linear-gradient(135deg,#9333ea,#ec4899)' }} />
              {userAvatar ? (
                <img src={userAvatar} alt={userName} className="relative h-9 w-9 rounded-full object-cover" />
              ) : (
                <div
                  className="relative h-9 w-9 rounded-full flex items-center justify-center text-white text-sm font-bold"
                  style={{ background: 'linear-gradient(135deg,#9333ea,#ec4899)' }}
                >{userInitial}</div>
              )}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-white truncate">{userName}</div>
              <div className="text-xs text-white/40 truncate">{userEmail}</div>
            </div>
          </div>

          <div className="py-1.5">
            <DropdownLink to="/account"     icon={UserIcon}    onClick={() => setOpen(false)}>Account</DropdownLink>
            <DropdownLink to="/browse"      icon={LayoutGrid}  onClick={() => setOpen(false)}>Browse</DropdownLink>
            <DropdownLink to="/watchlist"   icon={Bookmark}    onClick={() => setOpen(false)}>Watchlist</DropdownLink>
            <DropdownLink to="/history"     icon={Clock}       onClick={() => setOpen(false)}>Watch history</DropdownLink>
            <DropdownLink to="/people"      icon={Users}       onClick={() => setOpen(false)}>People</DropdownLink>
            <DropdownLink to="/lists"       icon={ListVideo}   onClick={() => setOpen(false)}>Lists</DropdownLink>
            <DropdownLink to="/preferences" icon={Settings}    onClick={() => setOpen(false)}>Settings</DropdownLink>
            <a
              href="mailto:hello@feelflick.com?subject=Feelflick%20feedback"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="mx-1.5 flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm text-white/60 transition-colors duration-150 hover:bg-white/5 hover:text-white/90"
            >
              <Mail className="h-4 w-4 shrink-0 text-white/40" />
              Send feedback
            </a>
          </div>

          <div className="border-t border-white/5 py-1.5">
            <button
              type="button"
              onClick={() => { setOpen(false); onSignOut() }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-white/60 transition-colors duration-150 hover:bg-red-500/8 hover:text-red-400"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function DropdownLink({ to, icon: Icon, children, onClick }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="mx-1.5 flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm text-white/60 transition-colors duration-150 hover:bg-white/5 hover:text-white/90"
    >
      <Icon className="h-4 w-4 shrink-0 text-white/40" />
      {children}
    </Link>
  )
}

// ── Header ───────────────────────────────────────────────────────────────────
export default function Header({ onOpenSearch }) {
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  const { user, isAuthenticated } = useAuthSession()
  const { signInWithGoogle, isAuthenticating } = useGoogleAuth()

  const hdrRef = useRef(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Keep --hdr-h in sync (preserves CLS guarantee)
  useEffect(() => {
    const update = () => {
      const measured = hdrRef.current?.offsetHeight
      if (!measured) return
      const current = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--hdr-h'))
      if (Math.abs(measured - current) > 2) {
        document.documentElement.style.setProperty('--hdr-h', `${measured}px`)
      }
    }
    const ro = new ResizeObserver(update)
    if (hdrRef.current) ro.observe(hdrRef.current)
    return () => ro.disconnect()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  const userName    = user?.user_metadata?.name || user?.email?.split('@')[0] || 'User'
  const userInitial = userName.charAt(0).toUpperCase()
  const userEmail   = user?.email
  const userAvatar  = user?.user_metadata?.avatar_url || null

  const navItems = isAuthenticated ? NAV_AUTHED : NAV_ANON

  return (
    <header
      ref={hdrRef}
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
      className={`w-full relative transition-all duration-500 ease-in-out ${
        scrolled
          ? 'bg-black/75 backdrop-blur-xl border-b border-white/8 shadow-lg shadow-black/20'
          : 'bg-black/30 backdrop-blur-md border-b border-white/6'
      }`}
    >
      <div className="max-w-[1400px] mx-auto px-4 sm:px-7 lg:px-7">
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-6 lg:gap-7 h-14 sm:h-16">

          {/* Left: wordmark + morphing nav */}
          <div className="flex items-center gap-6 lg:gap-8 min-w-0">
            <Link
              to={isAuthenticated ? '/home' : '/'}
              className="shrink-0 text-xl sm:text-2xl font-black bg-linear-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent hover:opacity-85 transition-opacity duration-200"
            >
              FEELFLICK
            </Link>
            <MorphNav items={navItems} />
          </div>

          {/* Center column: search right-aligned within its 1fr track so
             its right edge sits close to the avatar (separated only by
             the grid's gap-6 / lg:gap-7). Visually it's no longer page-
             centered, but the search ends near the user's profile —
             tighter feel, less dead space between search and avatar. */}
          <div className="flex justify-end">
            <CenterSearch onOpen={onOpenSearch} />
          </div>

          {/* Right: bell + (sign in / avatar) */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Mobile-only search trigger (icon) — keeps CenterSearch hidden below lg */}
            <button
              type="button"
              onClick={onOpenSearch}
              aria-label="Search films"
              className="lg:hidden w-9 h-9 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/8 transition-all duration-200"
            >
              <SearchIcon className="h-[18px] w-[18px]" />
            </button>

            {/* Bell removed — see file-header comment. Restore alongside the
                Feed route when /feed ships. */}

            {!user && (
              <button
                type="button"
                onClick={signInWithGoogle}
                disabled={isAuthenticating}
                className="hidden md:flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold text-white/80 transition-all duration-200 hover:border-purple-500/40 hover:bg-white/10 hover:text-white active:scale-95 disabled:opacity-50"
                aria-label="Sign in with Google"
              >
                <LogIn className="h-4 w-4" />
                {isAuthenticating ? 'Signing in…' : 'Sign in'}
              </button>
            )}

            {user && (
              <div className="hidden md:flex items-center gap-2">
                <AvatarMenu
                  userName={userName}
                  userInitial={userInitial}
                  userEmail={userEmail}
                  userAvatar={userAvatar}
                  onSignOut={handleSignOut}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mood-tinted ambient hairline beneath */}
      <div
        aria-hidden="true"
        className="absolute -bottom-px left-0 right-0 h-px opacity-50 pointer-events-none"
        style={{ background: `linear-gradient(90deg, transparent 15%, ${AMBIENT_HEX}55 50%, transparent 85%)` }}
      />

      <style>{`
        @keyframes ffDropIn {
          from { opacity: 0; transform: translateY(-8px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </header>
  )
}
