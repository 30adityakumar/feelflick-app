import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { Film, Menu, X, LogIn } from 'lucide-react'
import logoPng from '@/assets/images/logo.png'

export default function TopNav() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const btnRef = useRef(null)
  const drawerRef = useRef(null)
  const firstLinkRef = useRef(null)
  const prevFocusRef = useRef(null)

  const navigate = useNavigate()
  const location = useLocation()

  // Solid/blurred bar after tiny scroll (rAF-throttled)
  useEffect(() => {
    let ticking = false
    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        const next = window.scrollY > 8
        setScrolled((s) => (s === next ? s : next))
        ticking = false
      })
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Mobile drawer a11y: outside click, Esc, focus, scroll lock
  useEffect(() => {
    if (!open) return
    const onPointerDown = (e) => {
      const t = e.target
      if (drawerRef.current?.contains(t) || btnRef.current?.contains(t)) return
      setOpen(false)
    }
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKey)
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'
    prevFocusRef.current = document.activeElement
    const id = setTimeout(() => firstLinkRef.current?.focus(), 0)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
      clearTimeout(id)
      if (prevFocusRef.current && prevFocusRef.current.focus) prevFocusRef.current.focus()
    }
  }, [open])

  // Brand click → scroll to top if already on home
  function onBrandClick(e) {
    if (location.pathname === '/') {
      e.preventDefault()
      window.scrollTo({ top: 0, behavior: 'smooth' })
      if (open) setOpen(false)
    } else {
      if (open) setOpen(false)
      navigate('/', { replace: false })
    }
  }

  const navLinks = useMemo(
    () => [
      { to: '/movies', label: 'Browse' },
      { to: '/trending', label: 'Trending' },
    ],
    []
  )

  function onGetStarted() {
    if (open) setOpen(false)
    navigate('/auth')
  }

  const shellClass =
    'fixed inset-x-0 top-0 z-50 transition-colors will-change-backdrop-filter ' +
    (scrolled
      ? 'border-b border-white/10 bg-neutral-950/80 backdrop-blur'
      : 'bg-transparent')

  return (
    <header className={shellClass} data-scrolled={scrolled}>
      {/* Bigger on mobile: py-5; slightly tighter on ≥sm */}
      <div className="mx-auto flex w-full max-w-7xl items-center gap-4 px-4 py-5 md:px-6 sm:py-4">
        {/* Brand — logo before FEELFLICK, larger & closer */}
        <a
          href="/"
          onClick={onBrandClick}
          className="flex items-center gap-1.5 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-brand/60"
          aria-label="Go to top"
        >
          <img
            src={logoPng}
            alt="FeelFlick logo"
            width="36"
            height="36"
            className="h-9 w-9 rounded-md object-contain sm:h-8 sm:w-8"
            fetchpriority="high"
          />
          <span className="text-[1.5rem] font-black tracking-tight text-brand-200 sm:text-xl">
            FEELFLICK
          </span>
        </a>

        {/* Desktop nav */}
        <nav className="ml-1 hidden items-center gap-1 sm:flex">
          {navLinks.map((l) => (
            <NavItem key={l.to} to={l.to} label={l.label} />
          ))}
        </nav>

        <div className="flex-1" />

        {/* Desktop actions — Sign in (bordered pill, as before) */}
        <div className="hidden items-center gap-3 sm:flex">
          <Link
            to="/auth"
            className="inline-flex h-10 items-center gap-2 rounded-full border border-white/20 px-4 text-sm font-semibold text-white/90 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-brand/60"
          >
            <LogIn className="h-4 w-4" aria-hidden />
            <span>Sign in</span>
          </Link>
          <button
            onClick={onGetStarted}
            className="inline-flex h-10 items-center justify-center rounded-full bg-gradient-to-r from-brand-500 to-brand-600 px-4 text-sm font-semibold text-white shadow-lift transition-transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-brand/60"
          >
            Get started
          </button>
        </div>

        {/* Mobile menu toggle — bigger target */}
        <button
          ref={btnRef}
          className="inline-flex h-12 w-12 items-center justify-center rounded-md text-white/85 hover:bg-white/10 sm:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label="Menu"
        >
          {open ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
        </button>
      </div>

      {/* Mobile drawer */}
      <div
        id="mobile-menu"
        ref={drawerRef}
        className={`sm:hidden transition-[max-height,opacity] ${
          open ? 'max-h-[70vh] opacity-100' : 'pointer-events-none max-h-0 opacity-0'
        }`}
      >
        <div className="mx-4 mb-3 rounded-2xl border border-white/10 bg-neutral-900/95 p-2 shadow-xl backdrop-blur">
          <ul className="flex flex-col">
            {navLinks.map((l, i) => (
              <li key={l.to}>
                <Link
                  ref={i === 0 ? firstLinkRef : undefined}
                  to={l.to}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-3.5 text-[1.05rem] text-white hover:bg-white/10 focus:bg-white/10 focus:outline-none"
                >
                  {l.label}
                </Link>
              </li>
            ))}
            <li className="mt-1 border-t border-white/10 pt-2">
              <Link
                to="/auth"
                onClick={() => setOpen(false)}
                className="block rounded-full border border-white/20 px-3 py-3.5 text-center text-[1.05rem] font-semibold text-white/90 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-brand/60"
              >
                Sign in
              </Link>
            </li>
            <li className="mt-1">
              <button
                onClick={onGetStarted}
                className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-3 py-3.5 text-[1.05rem] font-semibold text-white shadow-lift focus:outline-none focus:ring-2 focus:ring-brand/60"
              >
                Get started
              </button>
            </li>
          </ul>
        </div>
      </div>
    </header>
  )
}

/* -------------------------------- helpers -------------------------------- */
function NavItem({ to, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `rounded-lg px-3 py-2 text-[0.98rem] transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-brand/60 ${
          isActive ? 'bg-white/15 text-white' : 'text-white/80'
        }`
      }
    >
      {label}
    </NavLink>
  )
}