// src/app/header/Header.jsx
// FeelFlick — Header (v2 redesign).
// Wordmark + nav · command-palette search · sign-in / avatar · mobile hamburger.
// Bell removed 2026-05-24: linked to /feed which router.jsx redirects to /home
// ("Confirmed unfinished — redirect until shipped"). Restore alongside the Feed
// route when /feed ships — keep `useUnreadFeed` (consumed by Feed.jsx for markRead).
//
// Control system (industry-standard, consistent):
//   • Text controls (nav, search, sign-in) — one restrained rounded-rectangle radius
//     (rounded-xl) at a shared 40px visual height; icon-only controls (mobile search,
//     hamburger, avatar) are circles. (Per .claude/rules/design-system.md.)
//   • Touch targets are >=44px even where the visible control is smaller.
//   • Restrained weight scale: wordmark 800, nav 500/600, body 400, actions 500.
//   • One focus-visible treatment (paper-white outline) on EVERY control, so keyboard
//     focus is visible on app routes too (not only inside .ff-landing).

import { useEffect, useRef, useState, useLayoutEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  Search as SearchIcon, LogOut, User as UserIcon, Settings,
  Bookmark, Clock, Users, ListVideo, LogIn, Mail, LayoutGrid, Menu, X,
} from 'lucide-react'

import { supabase } from '@/shared/lib/supabase/client'
import { clearDraft } from '@/features/onboarding/draft'
import { useAuthSession } from '@/shared/hooks/useAuthSession'
import { useGoogleAuth } from '@/shared/hooks/useGoogleAuth'

// Ambient accent — ivory secondary (neutral chrome, not a brand colour).
const AMBIENT_HEX = '#beb8ad'

// Shared, restrained keyboard focus ring (paper-white). Applied to every control so
// focus is visible on all routes — not just where the .ff-landing scoped rule exists.
const FOCUS = 'focus-visible:[outline:2px_solid_#f5f2eb] focus-visible:[outline-offset:2px]'

// Platform-aware command-palette hint: ⌘ on Apple, Ctrl elsewhere. Matches the real
// binding (Cmd/Ctrl+K, plus "/") in SiteHeaderHost — no false affordance.
const IS_MAC = typeof navigator !== 'undefined' &&
  /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent || '')

// IA v2 (F2): Core + Supporting only. "Tonight" (/home) is primary; Discover and DNA
// (/profile) are the two Supporting surfaces. Utility surfaces live in the avatar menu.
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

// ── Desktop nav (segmented) ────────────────────────────────────────────────────
function MorphNav({ items }) {
  const location = useLocation()
  const refs = useRef({})
  const [rect, setRect] = useState({ left: 0, width: 0 })

  // Active item by pathname (NavLink-equivalent). null on off-nav routes so we don't
  // mislead users into thinking they're on Home.
  const activeItem = items.find(i => location.pathname.startsWith(i.to)) || null

  useLayoutEffect(() => {
    if (!activeItem) { setRect({ left: 0, width: 0 }); return }
    const el = refs.current[activeItem.to]
    if (el) setRect({ left: el.offsetLeft, width: el.offsetWidth })
  }, [activeItem, items.length])

  return (
    <nav
      aria-label="Main navigation"
      className="relative hidden md:flex items-center h-10 px-1 rounded-xl border border-white/8 bg-white/[0.025]"
    >
      {activeItem && (
        <span
          aria-hidden="true"
          className="absolute top-1 bottom-1 rounded-lg border transition-all duration-300"
          style={{
            left: rect.left,
            width: rect.width,
            background: `${AMBIENT_HEX}1f`,
            borderColor: `${AMBIENT_HEX}55`,
            transitionTimingFunction: 'cubic-bezier(0.2, 0.7, 0.2, 1)',
          }}
        />
      )}
      {items.map(n => {
        const active = activeItem?.to === n.to
        return (
          <Link
            key={n.to}
            to={n.to}
            ref={el => { refs.current[n.to] = el }}
            aria-current={active ? 'page' : undefined}
            className={`relative px-3.5 py-1.5 rounded-lg text-[13px] transition-colors duration-200 select-none ${FOCUS} ${
              active ? 'text-white font-semibold' : 'text-white/70 hover:text-white font-medium'
            }`}
            style={{ fontFamily: '"Inter", system-ui, sans-serif' }}
          >
            {n.label}
          </Link>
        )
      })}
    </nav>
  )
}

// ── Desktop command-palette search launcher ────────────────────────────────────
function CenterSearch({ onOpen }) {
  const [focused, setFocused] = useState(false)
  return (
    <button
      type="button"
      onClick={onOpen}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      aria-label="Search films"
      aria-haspopup="dialog"
      className={`hidden lg:flex w-full max-w-[440px] items-center gap-3 px-3.5 h-10 rounded-xl border transition-colors duration-200 ${FOCUS}`}
      style={{
        background: focused ? 'rgba(190,184,173,0.06)' : 'rgba(255,255,255,0.04)',
        borderColor: focused ? `${AMBIENT_HEX}66` : 'rgba(255,255,255,0.10)',
      }}
    >
      <SearchIcon className="h-4 w-4 shrink-0" style={{ color: focused ? AMBIENT_HEX : 'rgba(248,250,252,0.6)' }} />
      <span className="flex-1 text-left text-[13.5px] text-white/65 truncate" style={{ fontFamily: '"Inter", system-ui, sans-serif' }}>
        Search films, directors, moods…
      </span>
      <span className="inline-flex items-center gap-1 text-[10px] text-white/55 shrink-0" style={{ fontFamily: '"Inter", system-ui, sans-serif' }}>
        <kbd className="px-1.5 py-0.5 rounded border border-white/15 bg-white/6 leading-none">{IS_MAC ? '⌘' : 'Ctrl'}</kbd>
        <kbd className="px-1.5 py-0.5 rounded border border-white/15 bg-white/6 leading-none">K</kbd>
      </span>
    </button>
  )
}

// ── Avatar (authenticated) with disclosure dropdown ────────────────────────────
function AvatarMenu({ userName, userInitial, userEmail, userAvatar, onSignOut }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const triggerRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    const esc = (e) => { if (e.key === 'Escape') { setOpen(false); triggerRef.current?.focus() } }
    document.addEventListener('mousedown', handler)
    document.addEventListener('keydown', esc)
    return () => { document.removeEventListener('mousedown', handler); document.removeEventListener('keydown', esc) }
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-label="Account menu"
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls="ff-account-menu"
        className={`flex items-center justify-center min-w-[44px] min-h-[44px] p-0 bg-transparent border-0 cursor-pointer rounded-full ${FOCUS}`}
      >
        <span className="relative w-[34px] h-[34px]">
          {/* Ivory ring (flat, neutral chrome — no brand gradient) */}
          <span
            aria-hidden="true"
            className="absolute inset-[-3px] rounded-full opacity-75"
            style={{ background: 'var(--color-surface-raised, #2d2621)' }}
          />
          <span className="relative block w-full h-full rounded-full p-[2px]" style={{ background: 'var(--color-canvas, #15120f)' }}>
            {userAvatar ? (
              <img src={userAvatar} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              <span
                className="w-full h-full rounded-full flex items-center justify-center text-[13px] font-semibold"
                style={{ background: 'var(--color-surface-raised, #2d2621)', color: 'var(--color-text-primary, #f3ecdf)', fontFamily: '"Inter", system-ui, sans-serif' }}
              >
                {userInitial}
              </span>
            )}
          </span>
        </span>
      </button>

      {open && (
        // The outside-click listener on the wrapping `ref` div would close this menu
        // the moment a user clicked inside it. stopPropagation keeps interactions intact.
        // eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events
        <div
          id="ff-account-menu"
          onClick={e => e.stopPropagation()}
          className="absolute right-0 top-[calc(100%+10px)] w-[248px] rounded-2xl bg-black/95 border border-white/8 shadow-2xl shadow-black/60 backdrop-blur-xl overflow-hidden z-50"
          style={{ animation: 'ffDropIn 0.18s cubic-bezier(.2,.7,.2,1)' }}
        >
          <div className="h-px" style={{ background: `linear-gradient(90deg, transparent, ${AMBIENT_HEX}66, transparent)` }} />

          <div className="px-4 py-3.5 border-b border-white/5 flex items-center gap-3">
            <div className="relative w-9 h-9 shrink-0">
              <div className="absolute inset-[-2px] rounded-full opacity-40 blur-md" style={{ background: 'var(--color-surface-raised, #2d2621)' }} />
              {userAvatar ? (
                <img src={userAvatar} alt="" className="relative h-9 w-9 rounded-full object-cover" />
              ) : (
                <div
                  className="relative h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{ background: 'var(--color-surface-raised, #2d2621)', color: 'var(--color-text-primary, #f3ecdf)' }}
                >{userInitial}</div>
              )}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-white truncate">{userName}</div>
              <div className="text-xs text-white/55 truncate">{userEmail}</div>
            </div>
          </div>

          <div className="py-1.5">
            <DropdownLink to="/account"     icon={UserIcon}    onClick={() => setOpen(false)}>Account</DropdownLink>
            <DropdownLink to="/browse"      icon={LayoutGrid}  onClick={() => setOpen(false)}>Browse</DropdownLink>
            <DropdownLink to="/watchlist"   icon={Bookmark}    onClick={() => setOpen(false)}>Watchlist</DropdownLink>
            <DropdownLink to="/history"     icon={Clock}       onClick={() => setOpen(false)}>Diary</DropdownLink>
            <DropdownLink to="/people"      icon={Users}       onClick={() => setOpen(false)}>People</DropdownLink>
            <DropdownLink to="/lists"       icon={ListVideo}   onClick={() => setOpen(false)}>Lists</DropdownLink>
            <DropdownLink to="/preferences" icon={Settings}    onClick={() => setOpen(false)}>Settings</DropdownLink>
            <a
              href="mailto:hello@feelflick.com?subject=Feelflick%20feedback"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className={`mx-1.5 flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm text-white/70 transition-colors duration-150 hover:bg-white/5 hover:text-white ${FOCUS}`}
            >
              <Mail className="h-4 w-4 shrink-0 text-white/55" />
              Send feedback
            </a>
          </div>

          <div className="border-t border-white/5 py-1.5">
            <button
              type="button"
              onClick={() => { setOpen(false); onSignOut() }}
              className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm text-white/70 transition-colors duration-150 hover:bg-red-500/8 hover:text-red-400 ${FOCUS}`}
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
      className={`mx-1.5 flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm text-white/70 transition-colors duration-150 hover:bg-white/5 hover:text-white ${FOCUS}`}
    >
      <Icon className="h-4 w-4 shrink-0 text-white/55" />
      {children}
    </Link>
  )
}

// ── Anonymous mobile menu (hamburger) ──────────────────────────────────────────
// Below md the desktop nav + Sign in are hidden, and anonymous users have no bottom
// bar — so the primary destinations (Discover/Browse) and Sign in live here.
function MobileMenu({ items, onSignIn, isAuthenticating }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const triggerRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    const esc = (e) => { if (e.key === 'Escape') { setOpen(false); triggerRef.current?.focus() } }
    document.addEventListener('mousedown', handler)
    document.addEventListener('keydown', esc)
    return () => { document.removeEventListener('mousedown', handler); document.removeEventListener('keydown', esc) }
  }, [open])

  return (
    <div className="relative md:hidden" ref={ref}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls="ff-mobile-menu"
        className={`w-11 h-11 rounded-full flex items-center justify-center text-white/75 hover:text-white hover:bg-white/8 transition-colors duration-200 ${FOCUS}`}
      >
        {open ? <X className="h-[20px] w-[20px]" /> : <Menu className="h-[20px] w-[20px]" />}
      </button>

      {open && (
        // eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events
        <div
          id="ff-mobile-menu"
          onClick={e => e.stopPropagation()}
          className="absolute right-0 top-[calc(100%+10px)] w-[224px] rounded-2xl bg-black/95 border border-white/8 shadow-2xl shadow-black/60 backdrop-blur-xl overflow-hidden z-50"
          style={{ animation: 'ffDropIn 0.18s cubic-bezier(.2,.7,.2,1)' }}
        >
          <nav aria-label="Site" className="py-1.5">
            {items.map(n => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className={`mx-1.5 flex items-center rounded-lg px-3.5 py-2.5 text-sm font-medium text-white/80 transition-colors duration-150 hover:bg-white/5 hover:text-white ${FOCUS}`}
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="border-t border-white/5 py-1.5">
            <button
              type="button"
              disabled={isAuthenticating}
              onClick={() => { setOpen(false); onSignIn() }}
              aria-label="Sign in with Google"
              className={`mx-1.5 flex w-[calc(100%-12px)] items-center gap-2 rounded-lg px-3.5 py-2.5 text-sm font-medium text-white/85 transition-colors duration-150 hover:bg-white/5 hover:text-white disabled:opacity-50 ${FOCUS}`}
            >
              <LogIn className="h-4 w-4 shrink-0" />
              {isAuthenticating ? 'Signing in…' : 'Sign in'}
            </button>
          </div>
        </div>
      )}
    </div>
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
    // Drop this user's onboarding draft (+ the legacy global key) before the session
    // is gone, so it can't rehydrate into the next user on a shared browser.
    clearDraft(user?.id)
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
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-7">
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 sm:gap-5 lg:gap-7 h-14 sm:h-16">

          {/* Left: wordmark + nav */}
          <div className="flex items-center gap-5 lg:gap-7 min-w-0">
            <Link
              to={isAuthenticated ? '/home' : '/'}
              className={`shrink-0 text-xl sm:text-2xl font-extrabold tracking-tight hover:opacity-85 transition-opacity duration-200 rounded ${FOCUS}`}
              style={{ color: 'var(--color-text-primary, #f3ecdf)', fontFamily: '"Inter", system-ui, sans-serif' }}
            >
              FEELFLICK
            </Link>
            <MorphNav items={navItems} />
          </div>

          {/* Center: search, right-aligned within its 1fr track. */}
          <div className="flex justify-end">
            <CenterSearch onOpen={onOpenSearch} />
          </div>

          {/* Right: search (mobile) + sign in / avatar + hamburger */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Mobile + tablet search trigger (icon). Circle, 44×44, no rest pill. */}
            <button
              type="button"
              onClick={onOpenSearch}
              aria-label="Search films"
              aria-haspopup="dialog"
              className={`lg:hidden w-11 h-11 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/8 transition-colors duration-200 ${FOCUS}`}
            >
              <SearchIcon className="h-[18px] w-[18px]" />
            </button>

            {/* Anonymous Sign in — desktop + tablet (md+); on mobile it lives in the
                hamburger menu. Rounded-rectangle, 40px visual, 44px touch target. */}
            {!user && (
              <button
                type="button"
                onClick={signInWithGoogle}
                disabled={isAuthenticating}
                className={`hidden md:flex items-center min-h-[44px] disabled:opacity-50 group ${FOCUS} rounded-xl`}
                aria-label="Sign in with Google"
              >
                <span className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 h-10 text-[13px] font-medium text-white/85 whitespace-nowrap transition-colors duration-200 group-hover:border-white/40 group-hover:bg-white/10 group-hover:text-white group-active:scale-95">
                  <LogIn className="h-3.5 w-3.5 shrink-0" />
                  {isAuthenticating ? 'Signing in…' : 'Sign in'}
                </span>
              </button>
            )}

            {/* Authenticated avatar — desktop + tablet (md+). On mobile, authed users
                navigate via the bottom navigation. */}
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

            {/* Anonymous mobile menu (hamburger) — the only <md path to Discover/Browse
                + Sign in. Authed mobile uses the bottom navigation instead. */}
            {!user && (
              <MobileMenu items={navItems} onSignIn={signInWithGoogle} isAuthenticating={isAuthenticating} />
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
