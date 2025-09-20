import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Film, Menu, X, LogIn } from 'lucide-react'

export default function TopNav() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const [logoSrc, setLogoSrc] = useState('/logo.svg') // will auto-fallback to png, then icon
  const btnRef = useRef(null)
  const drawerRef = useRef(null)
  const firstLinkRef = useRef(null)
  const prevFocusRef = useRef(null)
  const navigate = useNavigate()

  // Solid/blurred bar after a tiny scroll (throttled)
  useEffect(() => {
    let ticking = false
    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        setScrolled((s) => {
          const next = window.scrollY > 8
          return s === next ? s : next
        })
        ticking = false
      })
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Mobile drawer: outside click, Esc, focus trap-ish, and scroll lock
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
    // lock scroll
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'
    // focus mgmt
    prevFocusRef.current = document.activeElement
    const id = setTimeout(() => firstLinkRef.current?.focus(), 0)

    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
      clearTimeout(id)
      // restore focus back to toggle
      if (prevFocusRef.current && prevFocusRef.current.focus) prevFocusRef.current.focus()
    }
  }, [open])

  // Brand logo fallback (svg -> png -> icon)
  const onLogoError = () => {
    if (logoSrc === '/logo.svg') setLogoSrc('/logo.png')
    else setLogoSrc('') // triggers icon fallback
  }

  const navLinks = useMemo(
    () => [
      { to: '/movies', label: 'Browse' },
      { to: '/trending', label: 'Trending' },
    ],
    []
  )

  function onGetStarted() {
    // public entry → /auth (RedirectIfAuthed will bounce authed users to /home)
    navigate('/auth')
  }

  const shellClass =
    'fixed inset-x-0 top-0 z-50 transition-colors will-change-backdrop-filter ' +
    (scrolled
      ? 'border-b border-white/10 bg-neutral-950/80 backdrop-blur'
      : 'bg-transparent')

  return (
    <header className={shellClass} data-scrolled={scrolled}>
      <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-4 py-3 md:px-6">
        {/* Brand (larger on mobile for prominence) */}
        <Link to="/" className="flex items-center gap-2 text-white">
          {logoSrc ? (
            <img
              src={logoSrc}
              alt=""
              width="28"
              height="28"
              className="h-7 w-7 rounded-md object-contain"
              onError={onLogoError}
              fetchpriority="high"
            />
          ) : (
            <Film className="h-6 w-6" aria-hidden />
          )}
          <span className="text-base font-extrabold tracking-tight sm:text-lg">
            FeelFlick
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="ml-4 hidden items-center gap-1 sm:flex">
          {navLinks.map((l) => (
            <NavItem key={l.to} to={l.to} label={l.label} />
          ))}
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Desktop actions (bigger tap targets) */}
        <div className="hidden items-center gap-2 sm:flex">
          <Link
            to="/auth"
            className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/20 px-3.5 py-2 text-sm text-white/90 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-brand/60"
          >
            <LogIn className="h-4 w-4" aria-hidden />
            <span>Sign in</span>
          </Link>
          <button
            onClick={onGetStarted}
            className="inline-flex min-h-10 items-center justify-center rounded-full bg-gradient-to-r from-brand-500 to-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-lift transition-transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-brand/60"
          >
            Get started
          </button>
        </div>

        {/* Mobile toggle (larger hit area) */}
        <button
          ref={btnRef}
          className="inline-flex h-10 w-10 items-center justify-center rounded-md text-white/85 hover:bg-white/10 sm:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label="Menu"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
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
                  className="block rounded-lg px-3 py-3 text-[0.95rem] text-white hover:bg-white/10 focus:bg-white/10 focus:outline-none"
                >
                  {l.label}
                </Link>
              </li>
            ))}
            <li className="mt-1 border-t border-white/10 pt-2">
              <Link
                to="/auth"
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-3 text-[0.95rem] text-white/90 hover:bg-white/10 focus:bg-white/10 focus:outline-none"
              >
                Sign in
              </Link>
            </li>
            <li className="mt-1">
              <button
                onClick={() => {
                  setOpen(false)
                  onGetStarted()
                }}
                className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-3 py-3 text-[0.95rem] font-semibold text-white shadow-lift focus:outline-none focus:ring-2 focus:ring-brand/60"
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

/* ----------------------------- helpers ----------------------------- */
function NavItem({ to, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `rounded-lg px-3 py-2 text-[0.95rem] transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-brand/60 ${
          isActive ? 'bg-white/15 text-white' : 'text-white/80'
        }`
      }
    >
      {label}
    </NavLink>
  )
}