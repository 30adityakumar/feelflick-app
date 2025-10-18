// src/app/header/Header.jsx
import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { Search, Home as HomeIcon, Compass, ChevronDown } from 'lucide-react'
import { supabase } from '@/shared/lib/supabase/client'
import Account from '@/app/header/components/Account'

export default function Header({ onOpenSearch }) {
  const nav = useNavigate()
  const { pathname } = useLocation()
  const [user, setUser] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const buttonRef = useRef(null)
  const popRef = useRef(null)

  // Keep a CSS var with the header height (prevents layout jank)
  const barRef = useRef(null)
  useEffect(() => {
    const setVar = () => {
      const h = barRef.current?.offsetHeight || 64
      document.documentElement.style.setProperty('--app-header-h', `${h}px`)
    }
    setVar()
    const ro = new ResizeObserver(setVar)
    if (barRef.current) ro.observe(barRef.current)
    return () => ro.disconnect()
  }, [])

  // Auth presence
  useEffect(() => {
    let unsub
    supabase.auth.getSession().then(({ data }) => setUser(data?.session?.user || null))
    const { data } = supabase.auth.onAuthStateChange((_evt, session) => {
      setUser(session?.user || null)
    })
    unsub = data?.subscription?.unsubscribe
    return () => { if (typeof unsub === 'function') unsub() }
  }, [])

  // Close account popover on outside click / Esc / route change
  useEffect(() => { setMenuOpen(false) }, [pathname])
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setMenuOpen(false) }
    const onClick = (e) => {
      if (!menuOpen) return
      const withinBtn = buttonRef.current?.contains(e.target)
      const withinPop = popRef.current?.contains(e.target)
      if (!withinBtn && !withinPop) setMenuOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onClick)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onClick)
    }
  }, [menuOpen])

  const initials = (() => {
    const n = user?.user_metadata?.name || user?.email || ''
    return n.trim().slice(0, 2).toUpperCase()
  })()

  const Brand = (
    <Link to="/home" className="group flex items-center gap-2 focus:outline-none">
      <img
        src="/logo.png"
        alt=""
        width="28"
        height="28"
        className="h-7 w-7 rounded-md"
        loading="eager"
        decoding="async"
      />
      <span className="text-lg sm:text-xl font-extrabold tracking-tight text-brand-100 group-hover:opacity-95">
        FEELFLICK
      </span>
    </Link>
  )

  const NavItem = ({ to, icon: Icon, children }) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold',
          'text-white/80 hover:text-white transition-colors',
          isActive ? 'bg-white/10 ring-1 ring-white/15' : 'bg-transparent'
        ].join(' ')
      }
    >
      <Icon className="h-4 w-4" />
      <span className="hidden sm:inline">{children}</span>
    </NavLink>
  )

  return (
    <header
      ref={barRef}
      className="sticky top-0 z-40 backdrop-blur-md bg-neutral-950/55 ring-1 ring-white/10"
    >
      <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between gap-3 px-4 py-3 md:px-6">
        {/* Left: brand */}
        <div className="flex min-w-0 items-center gap-3">{Brand}</div>

        {/* Center: primary nav (desktop only) */}
        <nav className="hidden md:flex items-center gap-2">
          <NavItem to="/home" icon={HomeIcon}>Home</NavItem>
          <NavItem to="/browse" icon={Compass}>Browse</NavItem>
        </nav>

        {/* Right: actions */}
        <div className="flex items-center gap-2">
          {/* Search */}
          <button
            type="button"
            onClick={onOpenSearch}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/8 text-white/90 hover:bg-white/12 focus:outline-none"
            aria-label="Search movies"
          >
            <Search className="h-5 w-5" />
          </button>

          {/* Account */}
          <div className="relative">
            <button
              ref={buttonRef}
              type="button"
              onClick={() => setMenuOpen((s) => !s)}
              className="inline-flex items-center gap-2 rounded-full bg-white/8 px-2.5 py-1.5 text-sm font-semibold text-white/90 hover:bg-white/12 focus:outline-none"
              aria-expanded={menuOpen}
              aria-haspopup="menu"
            >
              <span className="inline-grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-[#fe9245] to-[#eb423b] text-[12px] font-extrabold text-white">
                {initials || 'FF'}
              </span>
              <span className="hidden sm:inline">{user ? 'Account' : 'Sign in'}</span>
              <ChevronDown className="hidden sm:block h-4 w-4 opacity-80" />
            </button>

            {/* Popover */}
            {menuOpen && (
              <div
                ref={popRef}
                role="menu"
                className="absolute right-0 mt-2 w-[320px] rounded-2xl border border-white/10 bg-black/70 p-2 shadow-2xl backdrop-blur-xl"
              >
                <Account
                  user={user && {
                    id: user.id,
                    email: user.email,
                    name: user.user_metadata?.name || ''
                  }}
                  onProfileUpdate={(patch) => {
                    // optimistic name update for the badge
                    if (patch?.name) {
                      setUser((u) =>
                        u ? { ...u, user_metadata: { ...(u.user_metadata || {}), name: patch.name } } : u
                      )
                    }
                  }}
                  onClose={() => setMenuOpen(false)}
                  variant="dropdown"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile bottom bar */}
      <nav
        className="
          fixed inset-x-0 bottom-0 z-40 grid grid-cols-3 gap-2 border-t border-white/10 bg-neutral-950/70
          px-3 py-2 backdrop-blur-md md:hidden
        "
        aria-label="Primary"
      >
        <TabLink to="/home" label="Home" icon={<HomeIcon className="h-5 w-5" />} />
        <button
          type="button"
          onClick={onOpenSearch}
          className="group inline-flex flex-col items-center justify-center gap-1 rounded-xl bg-white/8 px-2 py-1.5 text-[12px] font-semibold text-white/85 hover:bg-white/12 focus:outline-none"
        >
          <Search className="h-5 w-5" />
          <span>Search</span>
        </button>
        <TabLink to="/browse" label="Browse" icon={<Compass className="h-5 w-5" />} />
      </nav>
    </header>
  )
}

function TabLink({ to, label, icon }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          'inline-flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-1.5 text-[12px] font-semibold',
          'text-white/80 hover:text-white',
          isActive ? 'bg-white/10 ring-1 ring-white/15' : 'bg-white/0'
        ].join(' ')
      }
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  )
}