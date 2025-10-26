// src/app/header/Header.jsx
import { memo, useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { Compass, Home as HomeIcon, Search } from 'lucide-react'
import { supabase } from '@/shared/lib/supabase/client'
import Account from '@/app/header/components/Account'

function Header({ onOpenSearch }) {
  const nav = useNavigate()
  const { pathname } = useLocation()

  const [user, setUser] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)

  const rootRef = useRef(null)
  const popRef = useRef(null)
  const btnRef = useRef(null)

  /* Keep header height in a CSS var to avoid layout jank */
  useEffect(() => {
    const syncVar = () => {
      const h = rootRef.current?.offsetHeight || 64
      document.documentElement.style.setProperty('--app-header-h', `${h}px`)
    }
    syncVar()
    const ro = new ResizeObserver(syncVar)
    if (rootRef.current) ro.observe(rootRef.current)
    return () => ro.disconnect()
  }, [])

  /* Auth presence */
  useEffect(() => {
    let unsub
    supabase.auth.getSession().then(({ data }) => setUser(data?.session?.user || null))
    const { data } = supabase.auth.onAuthStateChange((_evt, session) => {
      setUser(session?.user || null)
    })
    unsub = data?.subscription?.unsubscribe
    return () => { if (typeof unsub === 'function') unsub() }
  }, [])

  /* Close popover when route changes / outside click / ESC */
  useEffect(() => setMenuOpen(false), [pathname])
  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e) => e.key === 'Escape' && setMenuOpen(false)
    const onClick = (e) => {
      const inBtn = btnRef.current?.contains(e.target)
      const inPop = popRef.current?.contains(e.target)
      if (!inBtn && !inPop) setMenuOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onClick)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onClick)
    }
  }, [menuOpen])

  const initials = (() => {
    const src = (user?.user_metadata?.name || user?.email || 'FF').trim()
    const nameInitials = src.split(/\s+/).map(s => s[0]).join('').slice(0, 2)
    if (nameInitials) return nameInitials.toUpperCase()
    const beforeAt = (user?.email || '').split('@')[0] || 'ff'
    return beforeAt.slice(0, 2).toUpperCase()
  })()

  function openSearch() {
    onOpenSearch?.()
  }

  return (
    <header
      ref={rootRef}
      className="sticky top-0 z-40 w-full backdrop-blur-md bg-neutral-950/60 ring-1 ring-white/10"
      role="banner"
    >
      <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-3 px-4 py-3 md:px-6">
        {/* Brand */}
        <Link to="/home" className="group flex items-center gap-2 min-w-0" aria-label="FeelFlick home">
          <img
            src="/logo.png"
            alt=""
            width="28"
            height="28"
            className="h-7 w-7 rounded-md"
            loading="eager"
            decoding="async"
          />
          <span className="text-lg sm:text-xl font-extrabold tracking-tight text-white group-hover:opacity-95">
            FEELFLICK
          </span>
        </Link>

        {/* Desktop primary nav */}
        <nav className="hidden md:flex items-center gap-2" aria-label="Primary">
          <TopLink to="/home" icon={<HomeIcon className="h-4.5 w-4.5" />}>Home</TopLink>
          <TopLink to="/browse" icon={<Compass className="h-4.5 w-4.5" />}>Browse</TopLink>
        </nav>

        {/* Actions: search + account */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openSearch}
            className="inline-grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white/90 hover:bg-white/15 focus:outline-none"
            aria-label="Search movies"
          >
            <Search className="h-5 w-5" />
          </button>

          <div className="relative">
            <button
              ref={btnRef}
              type="button"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(s => !s)}
              className="inline-flex items-center gap-2 rounded-full bg-white/10 px-2.5 py-1.5 text-sm font-semibold text-white hover:bg-white/15 focus:outline-none"
            >
              <span className="inline-grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-[#fe9245] to-[#eb423b] text-[12px] font-extrabold text-white">
                {initials}
              </span>
              <span className="hidden sm:inline">{user ? 'Account' : 'Sign in'}</span>
            </button>

            {menuOpen && (
              <div
                ref={popRef}
                role="menu"
                className="absolute right-0 mt-2 w-[320px] rounded-2xl border border-white/10 bg-black/75 p-3 shadow-2xl backdrop-blur-xl"
              >
                <Account
                  user={user && {
                    id: user.id,
                    email: user.email,
                    name: user.user_metadata?.name || ''
                  }}
                  onProfileUpdate={(patch) => {
                    if (patch?.name) {
                      setUser(u => (u ? { ...u, user_metadata: { ...(u.user_metadata || {}), name: patch.name } } : u))
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

      {/* Mobile bottom nav (Home · Search · Browse) */}
      <MobileTabs openSearch={openSearch} />
    </header>
  )
}

function TopLink({ to, icon, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold transition-colors',
          'text-white/85 hover:text-white',
          isActive ? 'bg-white/10 ring-1 ring-white/15' : 'bg-transparent'
        ].join(' ')
      }
    >
      {icon}
      <span>{children}</span>
    </NavLink>
  )
}

function MobileTabs({ openSearch }) {
  // keep bottom tabbar height for safe spacing if you need it later
  useEffect(() => {
    const el = document.getElementById('ff-tabbar')
    if (!el) return
    const sync = () => {
      const h = el.offsetHeight
      document.documentElement.style.setProperty('--app-tabbar-h', `${h}px`)
    }
    sync()
    const ro = new ResizeObserver(sync)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    <nav
      id="ff-tabbar"
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-3 border-t border-white/10 bg-neutral-950/70 px-3 py-2 backdrop-blur-md md:hidden"
      aria-label="Primary"
    >
      <TabLink to="/home" label="Home" icon={<HomeIcon className="h-5 w-5" />} />
      <button
        type="button"
        onClick={openSearch}
        className="group inline-flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-1.5 text-[12px] font-semibold text-white/85 hover:text-white focus:outline-none"
        aria-label="Search movies"
      >
        <Search className="h-5 w-5" />
        <span>Search</span>
      </button>
      <TabLink to="/browse" label="Browse" icon={<Compass className="h-5 w-5" />} />
    </nav>
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
          isActive ? 'bg-white/10 ring-1 ring-white/15' : 'bg-transparent'
        ].join(' ')
      }
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  )
}

export default memo(Header)