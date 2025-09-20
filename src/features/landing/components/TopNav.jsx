import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Film, Menu, X, LogIn, Sparkles } from 'lucide-react'

/**
 * Landing Top Nav (public pages only)
 * - Transparent over hero; solid/blurred on scroll
 * - Mobile drawer with focus management & outside-click close
 * - Uses Tailwind + your theme tokens (see index.css)
 */
export default function TopNav() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const navRef = useRef(null)
  const btnRef = useRef(null)
  const firstLinkRef = useRef(null)
  const navigate = useNavigate()

  // Solidify nav after small scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close on outside click (mobile drawer)
  useEffect(() => {
    if (!open) return
    function onPointerDown(e) {
      const t = e.target
      if (navRef.current?.contains(t) || btnRef.current?.contains(t)) return
      setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  // Focus first item when opening the drawer
  useEffect(() => {
    if (open) {
      const id = setTimeout(() => firstLinkRef.current?.focus(), 0)
      return () => clearTimeout(id)
    }
  }, [open])

  const navLinks = [
    { to: '/movies', label: 'Browse' },
    { to: '/trending', label: 'Trending' },
  ]

  function onGetStarted() {
    // Public entry → /auth (RedirectIfAuthed will bounce signed-in users to /home)
    navigate('/auth')
  }

  const shellClass = scrolled
    ? 'border-b border-white/10 bg-neutral-950/80 backdrop-blur'
    : 'bg-transparent'

  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition-colors ${shellClass}`}>
      <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-4 py-3 md:px-6">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2 text-white">
          <Film className="h-5 w-5" />
          <span className="text-sm font-semibold tracking-wide">FeelFlick</span>
        </Link>

        {/* Desktop nav */}
        <nav className="ml-6 hidden items-center gap-1 sm:flex">
          {navLinks.map((l) => (
            <NavItem key={l.to} to={l.to} label={l.label} />
          ))}
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Desktop actions */}
        <div className="hidden items-center gap-2 sm:flex">
          <Link
            to="/auth"
            className="inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1.5 text-sm text-white/90 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-brand/60"
          >
            <LogIn className="h-4 w-4" />
            Sign in
          </Link>
          <button
            onClick={onGetStarted}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-500 to-brand-600 px-4 py-1.5 text-sm font-semibold text-white shadow-lift transition-transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-brand/60"
          >
            <Sparkles className="h-4 w-4" />
            Get started
          </button>
        </div>

        {/* Mobile toggle */}
        <button
          ref={btnRef}
          className="inline-flex items-center justify-center rounded-md p-2 text-white/85 hover:bg-white/10 sm:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label="Menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile drawer */}
      <div
        id="mobile-menu"
        ref={navRef}
        className={`sm:hidden transition-[max-height,opacity] ${open ? 'max-h-[60vh] opacity-100' : 'pointer-events-none max-h-0 opacity-0'}`}
      >
        <div className="mx-4 mb-3 rounded-xl border border-white/10 bg-neutral-900/95 p-2 shadow-xl backdrop-blur">
          <ul className="flex flex-col">
            {navLinks.map((l, i) => (
              <li key={l.to}>
                <Link
                  ref={i === 0 ? firstLinkRef : undefined}
                  to={l.to}
                  onClick={() => setOpen(false)}
                  className="block rounded-md px-3 py-2 text-sm text-white hover:bg-white/10 focus:bg-white/10 focus:outline-none"
                >
                  {l.label}
                </Link>
              </li>
            ))}
            <li className="mt-1 border-t border-white/10 pt-2">
              <Link
                to="/auth"
                onClick={() => setOpen(false)}
                className="block rounded-md px-3 py-2 text-sm text-white/90 hover:bg-white/10 focus:bg-white/10 focus:outline-none"
              >
                Sign in
              </Link>
            </li>
            <li className="mt-1">
              <button
                onClick={() => { setOpen(false); onGetStarted() }}
                className="flex w-full items-center justify-center gap-2 rounded-md bg-gradient-to-r from-brand-500 to-brand-600 px-3 py-2 text-sm font-semibold text-white shadow-lift focus:outline-none focus:ring-2 focus:ring-brand/60"
              >
                <Sparkles className="h-4 w-4" />
                Get started
              </button>
            </li>
          </ul>
        </div>
      </div>
    </header>
  )
}

function NavItem({ to, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `rounded-md px-3 py-1.5 text-sm transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-brand/60 ${
          isActive ? 'bg-white/15 text-white' : 'text-white/80'
        }`
      }
    >
      {label}
    </NavLink>
  )
}