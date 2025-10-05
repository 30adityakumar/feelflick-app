// src/app/header/Header.jsx
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { Search as SearchIcon, Home, Compass, User2 } from 'lucide-react'
import { supabase } from '@/shared/lib/supabase/client'
import logoPng from '@/assets/images/logo.png'
import Account from '@/app/header/components/Account'

export default function Header({ onOpenSearch }) {
  const loc = useLocation()
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [user, setUser] = useState(null)
  const barRef = useRef(null)
  const acctRef = useRef(null)

  // Lock header height into a CSS var (prevents CLS)
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

  // Scroll state (adds subtle glass tint when scrolled a bit)
  useEffect(() => {
    let ticking = false
    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        setScrolled((window.scrollY || document.documentElement.scrollTop) > 8)
        ticking = false
      })
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Load current user (avatar initials for the chip + account menu)
  useEffect(() => {
    let isMounted = true
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (isMounted) setUser(user || null)
    })
    const { data } = supabase.auth.onAuthStateChange((_evt, session) => {
      setUser(session?.user || null)
    })
    return () => data?.subscription?.unsubscribe?.()
  }, [])

  // Click-away for account popover
  useEffect(() => {
    if (!accountOpen) return
    const onDown = (e) => {
      if (!acctRef.current) return
      if (acctRef.current.contains(e.target)) return
      setAccountOpen(false)
    }
    const onEsc = (e) => {
      if (e.key === 'Escape') setAccountOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onEsc)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onEsc)
    }
  }, [accountOpen])

  const initials = useMemo(() => {
    const name = user?.user_metadata?.name || user?.email || 'FF'
    const parts = String(name).trim().split(' ')
    const first = parts[0]?.[0] || 'F'
    const second = parts[1]?.[0] || (parts[0]?.[1] ?? 'F')
    return (first + second).toUpperCase()
  }, [user])

  const headerClass =
    'fixed top-0 inset-x-0 z-40 transition-colors duration-200 ' +
    (scrolled ? 'bg-neutral-950/60 backdrop-blur-md ring-1 ring-white/10' : 'bg-transparent')

  const linkBase =
    'relative px-3 py-2 text-sm font-semibold text-white/80 hover:text-white transition-colors'
  const activeUnderline =
    'after:absolute after:left-1/2 after:-translate-x-1/2 after:-bottom-[6px] after:h-[2px] after:w-5 after:rounded-full after:bg-gradient-to-r after:from-[#fe9245] after:to-[#2D77FF]'

  return (
    <>
      {/* Skip link for a11y */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:rounded-md focus:bg-neutral-900 focus:px-3 focus:py-2 focus:text-white focus:ring-2 focus:ring-brand/60"
      >
        Skip to content
      </a>

      <header ref={barRef} className={headerClass}>
        <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between gap-3 px-4 py-3 md:px-6">
          {/* Brand */}
          <Link
            to="/home"
            aria-label="FeelFlick home"
            className="group flex items-center gap-2 rounded-md focus:outline-none focus:ring-2 focus:ring-brand/60"
          >
            <img
              src={logoPng}
              alt=""
              width="28"
              height="28"
              className="h-7 w-7 object-contain"
              loading="eager"
              decoding="async"
            />
            <span className="text-[1.1rem] font-extrabold tracking-tight text-brand-100 group-hover:text-white">
              FEELFLICK
            </span>
          </Link>

          {/* Center nav (desktop) */}
          <nav className="hidden md:flex items-center gap-1">
            <NavLink
              to="/home"
              className={({ isActive }) => linkBase + (isActive ? ' text-white ' + activeUnderline : '')}
            >
              Home
            </NavLink>
            <NavLink
              to="/browse"
              className={({ isActive }) => linkBase + (isActive ? ' text-white ' + activeUnderline : '')}
            >
              Browse
            </NavLink>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Search button */}
            <button
              type="button"
              onClick={onOpenSearch}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/90 focus:outline-none focus:ring-2 focus:ring-brand/60"
              aria-label="Search movies (press /)"
              title="Search ( / )"
            >
              <SearchIcon className="h-5 w-5" />
            </button>

            {/* Account chip (avatar + popover) */}
            <div className="relative" ref={acctRef}>
              <button
                type="button"
                onClick={() => setAccountOpen((s) => !s)}
                className="inline-flex items-center gap-2 rounded-full bg-white/5 px-2.5 py-1.5 text-sm font-semibold text-white/90 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-brand/60"
                aria-expanded={accountOpen}
                aria-haspopup="menu"
              >
                <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-[#fe9245] to-[#eb423b] text-[0.8rem] font-black">
                  {initials}
                </span>
                <span className="hidden sm:block">Account</span>
              </button>

              {/* Popover */}
              {accountOpen && (
                <div
                  className="absolute right-0 mt-2 w-[300px] rounded-xl border border-white/10 bg-neutral-900/95 p-2 backdrop-blur-md shadow-xl"
                  role="menu"
                >
                  <Account
                    user={user}
                    onClose={() => setAccountOpen(false)}
                    onGoTo={(path) => {
                      setAccountOpen(false)
                      navigate(path)
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile bottom nav */}
      <MobileNav
        activePath={loc.pathname}
        onOpenSearch={onOpenSearch}
      />
      {/* Spacer to avoid content under the header */}
      <div style={{ height: 'var(--app-header-h,64px)' }} aria-hidden />
    </>
  )
}

/* --------------------------- Mobile bottom nav --------------------------- */
function MobileNav({ activePath, onOpenSearch }) {
  const isHome = activePath.startsWith('/home') || activePath === '/'
  const isBrowse = activePath.startsWith('/browse')

  return (
    <nav
      className="
        fixed bottom-0 inset-x-0 z-40 md:hidden
        bg-neutral-950/80 backdrop-blur-md border-t border-white/10
        px-4 pt-2 pb-[calc(10px+env(safe-area-inset-bottom))]
        flex items-center justify-between
      "
      aria-label="Primary"
    >
      <MobileLink to="/home" label="Home" active={isHome} Icon={Home} />
      {/* Big search FAB in the middle */}
      <button
        type="button"
        onClick={onOpenSearch}
        className="relative -mt-8 grid h-14 w-14 place-items-center rounded-full bg-white text-neutral-900 shadow-lg active:scale-[.98] focus:outline-none"
        aria-label="Search"
      >
        <SearchIcon className="h-6 w-6" />
      </button>
      <MobileLink to="/browse" label="Browse" active={isBrowse} Icon={Compass} />
    </nav>
  )
}

function MobileLink({ to, label, active, Icon }) {
  return (
    <NavLink
      to={to}
      className="
        flex flex-col items-center gap-1 rounded-xl px-3 py-1.5
        text-[13px] font-semibold text-white/80
        focus:outline-none focus:ring-2 focus:ring-brand/60
      "
    >
      <Icon className={`h-6 w-6 ${active ? 'text-white' : 'text-white/75'}`} />
      <span className={active ? 'text-white' : ''}>{label}</span>
    </NavLink>
  )
}