import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { Menu, X, Film, User2, Settings, LogOut, BookmarkCheck, History } from 'lucide-react'
import SearchBar from '@/app/header/components/SearchBar'
import { supabase } from '@/shared/lib/supabase/client'

export default function Header() {
  const [user, setUser] = useState(null)
  const [avatarText, setAvatarText] = useState('U')
  const [menuOpen, setMenuOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  const navigate = useNavigate()
  const loc = useLocation()
  const menuRef = useRef(null)

  // Keep user session in sync
  useEffect(() => {
    let unsubscribe
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user || null)
      setAvatarText(user?.email?.[0]?.toUpperCase?.() || 'U')
    })
    const { data } = supabase.auth.onAuthStateChange((_evt, session) => {
      const u = session?.user ?? null
      setUser(u)
      setAvatarText(u?.email?.[0]?.toUpperCase?.() || 'U')
    })
    unsubscribe = data?.subscription?.unsubscribe
    return () => { if (typeof unsubscribe === 'function') unsubscribe() }
  }, [])

  // Close menu on route change or outside click
  useEffect(() => { setMenuOpen(false) }, [loc.pathname])
  useEffect(() => {
    function onClickOutside(e) {
      if (!menuRef.current) return
      if (!menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    if (menuOpen) document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [menuOpen])

  async function handleSignOut() {
    if (signingOut) return
    setSigningOut(true)
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Sign out failed:', error)
        // Fall back to server-side signout route if anything goes wrong
        window.location.assign('/logout')
        return
      }
      // Navigate only AFTER session is cleared
      navigate('/auth', { replace: true })
    } finally {
      setMenuOpen(false)
      setSigningOut(false)
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-neutral-950/70 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-4 py-3 md:px-6">
        {/* Left: brand */}
        <Link to="/" className="flex items-center gap-2 text-white">
          <Film className="h-5 w-5" />
          <span className="text-sm font-semibold tracking-wide">FeelFlick</span>
        </Link>

        {/* Center: search (hidden on xs) */}
        <div className="ml-3 hidden flex-1 sm:block">
          <SearchBar />
        </div>

        {/* Right: auth / user menu */}
        <div className="ml-auto flex items-center gap-2">
          {/* Mobile search / nav toggler (optional) */}
          <button
            className="inline-flex items-center justify-center rounded-md p-2 text-white/80 hover:bg-white/10 sm:hidden"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          {/* If not logged in: show Auth link */}
          {!user && (
            <Link
              to="/auth"
              className="hidden rounded-full border border-white/20 px-3 py-1.5 text-sm text-white/90 hover:bg-white/10 sm:inline-block"
            >
              Sign in
            </Link>
          )}

          {/* User menu trigger */}
          {user && (
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-sm font-semibold text-white"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-label="Open user menu"
            >
              {avatarText}
            </button>
          )}
        </div>
      </div>

      {/* Desktop nav bar (under header row) */}
      <div className="hidden border-t border-white/10 sm:block">
        <nav className="mx-auto flex w-full max-w-7xl items-center gap-4 px-4 py-2 text-sm md:px-6">
          <NavItem to="/home" label="Home" />
          <NavItem to="/movies" label="Browse" />
          <NavItem to="/trending" label="Trending" />
          {user ? (
            <>
              <NavItem to="/watchlist" label="Watchlist" />
              <NavItem to="/watched" label="History" />
            </>
          ) : null}
        </nav>
      </div>

      {/* Dropdown / mobile menu */}
      {(menuOpen || !user) && (
        <div className="sm:hidden" ref={menuRef}>
          <div className="space-y-1 border-t border-white/10 px-3 pb-3 pt-2">
            {/* If signed out, show quick auth button on mobile */}
            {!user && (
              <Link
                to="/auth"
                className="block rounded-md px-3 py-2 text-sm text-white hover:bg-white/10"
                onClick={() => setMenuOpen(false)}
              >
                Sign in
              </Link>
            )}

            {/* Mobile nav links */}
            <LinkItem to="/home" icon={<Film className="h-4 w-4" />} text="Home" onNavigate={() => setMenuOpen(false)} />
            <LinkItem to="/movies" icon={<Film className="h-4 w-4" />} text="Browse" onNavigate={() => setMenuOpen(false)} />
            <LinkItem to="/trending" icon={<Film className="h-4 w-4" />} text="Trending" onNavigate={() => setMenuOpen(false)} />

            {user && (
              <>
                <LinkItem to="/watchlist" icon={<BookmarkCheck className="h-4 w-4" />} text="Watchlist" onNavigate={() => setMenuOpen(false)} />
                <LinkItem to="/watched" icon={<History className="h-4 w-4" />} text="History" onNavigate={() => setMenuOpen(false)} />
                <LinkItem to="/account" icon={<User2 className="h-4 w-4" />} text="Account" onNavigate={() => setMenuOpen(false)} />
                <LinkItem to="/preferences" icon={<Settings className="h-4 w-4" />} text="Preferences" onNavigate={() => setMenuOpen(false)} />
                <button
                  onClick={handleSignOut}
                  disabled={signingOut}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-white hover:bg-white/10 disabled:opacity-50"
                >
                  <LogOut className="h-4 w-4" />
                  {signingOut ? 'Signing out…' : 'Sign out'}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Desktop user dropdown */}
      {user && (
        <div
          className={`absolute right-4 top-14 z-50 hidden min-w-56 rounded-xl border border-white/15 bg-neutral-900/95 p-2 shadow-xl backdrop-blur sm:block ${menuOpen ? '' : 'pointer-events-none opacity-0'}`}
          ref={menuRef}
          role="menu"
        >
          <button
            onClick={() => navigate('/account')}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-white hover:bg-white/10"
            role="menuitem"
          >
            <User2 className="h-4 w-4" /> Account
          </button>
          <button
            onClick={() => navigate('/preferences')}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-white hover:bg-white/10"
            role="menuitem"
          >
            <Settings className="h-4 w-4" /> Preferences
          </button>
          <button
            onClick={() => navigate('/watchlist')}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-white hover:bg-white/10"
            role="menuitem"
          >
            <BookmarkCheck className="h-4 w-4" /> Watchlist
          </button>
          <button
            onClick={() => navigate('/watched')}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-white hover:bg-white/10"
            role="menuitem"
          >
            <History className="h-4 w-4" /> History
          </button>
          <div className="my-1 border-t border-white/10" />
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-white hover:bg-white/10 disabled:opacity-50"
            role="menuitem"
          >
            <LogOut className="h-4 w-4" />
            {signingOut ? 'Signing out…' : 'Sign out'}
          </button>
          {/* Pure anchor fallback if you ever want zero-JS signout:
          <a href="/logout" className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-white hover:bg-white/10">
            <LogOut className="h-4 w-4" /> Sign out
          </a> */}
        </div>
      )}
    </header>
  )
}

/* ----------------------------- helpers ----------------------------- */

function NavItem({ to, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `rounded-md px-3 py-1.5 ${isActive ? 'bg-white/15 text-white' : 'text-white/80 hover:bg-white/10 hover:text-white'}`
      }
    >
      {label}
    </NavLink>
  )
}

function LinkItem({ to, icon, text, onNavigate }) {
  return (
    <Link
      to={to}
      onClick={onNavigate}
      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-white hover:bg-white/10"
    >
      {icon}
      {text}
    </Link>
  )
}