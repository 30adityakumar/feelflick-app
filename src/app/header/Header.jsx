// src/app/header/Header.jsx
import { useEffect, useRef, useState, useMemo } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { Home as HomeIcon, Compass, Search as SearchIcon, User as UserIcon, LogOut, SlidersHorizontal, Settings, Clock, Heart } from 'lucide-react'
import logoPng from '@/assets/images/logo.png'

export default function Header({ onOpenSearch }) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const barRef = useRef(null)
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  // expose header height via CSS var for layout spacing
  useEffect(() => {
    const setVar = () => {
      const h = barRef.current?.offsetHeight || 56
      document.documentElement.style.setProperty('--app-header-h', `${h}px`)
    }
    setVar()
    const ro = new ResizeObserver(setVar)
    if (barRef.current) ro.observe(barRef.current)
    return () => ro.disconnect()
  }, [])

  // subtle style on scroll
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

  // close profile menu on outside click
  useEffect(() => {
    const onDoc = (e) => {
      if (!menuOpen) return
      if (!barRef.current) return
      if (!barRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('touchstart', onDoc, { passive: true })
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('touchstart', onDoc)
    }
  }, [menuOpen])

  // active checks
  const isHome = useMemo(() => pathname === '/home' || pathname === '/', [pathname])
  const isBrowse = useMemo(() => pathname.startsWith('/browse'), [pathname])

  const shell =
    'fixed inset-x-0 top-0 z-50 transition-colors duration-200 ' +
    (scrolled ? 'bg-neutral-950/60 backdrop-blur-md ring-1 ring-white/10' : 'bg-transparent')

  return (
    <>
      <header className={shell} role="banner" aria-label="Site header">
        <div
          ref={barRef}
          className="mx-auto flex w-full max-w-[1200px] items-center justify-between gap-3 px-4 md:px-6 py-3 md:py-4"
        >
          {/* Left: Brand */}
          <Link
            to="/home"
            className="flex items-center gap-2 rounded-md focus:outline-none focus:ring-2 focus:ring-brand/60"
            aria-label="FeelFlick home"
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
            <span className="hidden sm:inline text-[clamp(1.05rem,3.5vw,1.35rem)] font-extrabold tracking-tight text-brand-100">
              FEELFLICK
            </span>
          </Link>

          {/* Center: Primary nav (desktop) */}
          <nav className="hidden md:flex items-center gap-1.5" aria-label="Primary">
            <NavItem to="/home" active={isHome}>Home</NavItem>
            <NavItem to="/browse" active={isBrowse}>Browse</NavItem>
          </nav>

          {/* Right: Search + Profile */}
          <div className="flex items-center gap-2">
            {/* Search trigger (desktop & mobile) */}
            <button
              type="button"
              onClick={onOpenSearch}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/90 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-brand/60"
              aria-label="Search movies"
              title="Search ( / )"
            >
              <SearchIcon className="h-5 w-5" />
            </button>

            {/* Profile menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((s) => !s)}
                className="inline-flex h-10 items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 text-white/90 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-brand/60"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                aria-label="Account menu"
              >
                <span className="grid h-6 w-6 place-items-center rounded-full bg-gradient-to-br from-[#fe9245] to-[#eb423b] text-[12px] font-bold">
                  FF
                </span>
                <span className="hidden sm:inline text-sm font-semibold">Account</span>
              </button>

              {/* menu popover */}
              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-white/10 bg-neutral-950/95 backdrop-blur-lg shadow-2xl"
                >
                  <MenuLink to="/account" onClick={() => setMenuOpen(false)}>
                    <UserIcon className="h-4 w-4" />
                    Profile
                  </MenuLink>
                  <MenuLink to="/preferences" onClick={() => setMenuOpen(false)}>
                    <Settings className="h-4 w-4" />
                    Preferences
                  </MenuLink>
                  <div className="my-1 h-px bg-white/10" />
                  <MenuLink to="/watchlist" onClick={() => setMenuOpen(false)}>
                    <Heart className="h-4 w-4" />
                    Watchlist
                  </MenuLink>
                  <MenuLink to="/history" onClick={() => setMenuOpen(false)}>
                    <Clock className="h-4 w-4" />
                    History
                  </MenuLink>
                  <div className="my-1 h-px bg-white/10" />
                  <MenuLink to="/logout" onClick={() => setMenuOpen(false)}>
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </MenuLink>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile bottom tab bar */}
      <MobileBottomBar
        isHome={isHome}
        isBrowse={isBrowse}
        onOpenSearch={onOpenSearch}
        navigate={navigate}
      />
    </>
  )
}

/* ------------------------ Small building blocks ------------------------- */

function NavItem({ to, active, children }) {
  return (
    <NavLink
      to={to}
      className={
        'relative inline-flex items-center rounded-full px-3.5 py-2 text-sm font-semibold text-white/85 hover:text-white focus:outline-none focus:ring-2 focus:ring-brand/60 ' +
        (active ? 'text-white' : '')
      }
      aria-current={active ? 'page' : undefined}
    >
      {children}
      {/* animated underline for active */}
      <span
        className={
          'pointer-events-none absolute inset-x-2 bottom-1 h-[2px] rounded ' +
          (active ? 'bg-[linear-gradient(90deg,#fe9245_0%,#eb423b_40%,#2D77FF_85%)] opacity-95' : 'opacity-0')
        }
      />
    </NavLink>
  )
}

function MenuLink({ to, onClick, children }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center gap-2 px-3.5 py-2.5 text-[0.93rem] text-white/90 hover:bg-white/5 focus:bg-white/10 focus:outline-none"
      role="menuitem"
    >
      {children}
    </Link>
  )
}

function MobileBottomBar({ isHome, isBrowse, onOpenSearch, navigate }) {
  return (
    <nav
      aria-label="Mobile"
      className="fixed bottom-0 inset-x-0 z-40 border-t border-white/10 bg-neutral-950/75 backdrop-blur-md md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="mx-auto flex h-14 items-stretch justify-around px-2">
        <TabButton
          label="Home"
          active={isHome}
          onClick={() => navigate('/home')}
          icon={<HomeIcon className="h-5 w-5" />}
        />
        <button
          type="button"
          onClick={onOpenSearch}
          className="group -mt-3 inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white/95 active:scale-95 focus:outline-none focus:ring-2 focus:ring-brand/60"
          aria-label="Search"
        >
          <SearchIcon className="h-[22px] w-[22px]" />
        </button>
        <TabButton
          label="Browse"
          active={isBrowse}
          onClick={() => navigate('/browse')}
          icon={<Compass className="h-5 w-5" />}
        />
      </div>
    </nav>
  )
}

function TabButton({ label, active, icon, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        'flex flex-1 flex-col items-center justify-center gap-0.5 text-[12px] ' +
        (active ? 'text-white' : 'text-white/70')
      }
      aria-current={active ? 'page' : undefined}
    >
      <span
        className={
          'grid h-8 w-8 place-items-center rounded-full ' +
          (active ? 'bg-white/10 border border-white/15' : '')
        }
      >
        {icon}
      </span>
      <span className="leading-none">{label}</span>
    </button>
  )
}