import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { Menu, X, LogIn } from 'lucide-react'
import logoPng from '@/assets/images/logo.png'

export default function TopNav() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const btnRef = useRef(null)
  const drawerRef = useRef(null)
  const firstLinkRef = useRef(null)
  const prevFocusRef = useRef(null)
  const barRef = useRef(null) // NEW: measure visible bar height

  const navigate = useNavigate()
  const location = useLocation()

  // rAF-throttled scroll state (for blur)
  useEffect(() => {
    let ticking = false
    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        const next = window.scrollY > 4
        if (next !== scrolled) setScrolled(next)
        ticking = false
      })
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [scrolled])

  // Mobile drawer a11y + scroll lock
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
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    prevFocusRef.current = document.activeElement
    const id = setTimeout(() => firstLinkRef.current?.focus(), 0)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
      clearTimeout(id)
      prevFocusRef.current?.focus?.()
    }
  }, [open])

  // Brand click → scroll to top or navigate then scroll
  function onBrandClick(e) {
    e.preventDefault()
    if (open) setOpen(false)
    if (location.pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      navigate('/', { replace: false })
      setTimeout(() => window.scrollTo({ top: 0, behavior: 'auto' }), 0)
    }
  }

  function onGetStarted() {
    if (open) setOpen(false)
    navigate('/auth/sign-up')
  }

  // NEW: publish actual bar height → CSS var (--topnav-h)
  useEffect(() => {
    const setVar = () => {
      const h = barRef.current?.offsetHeight || 72
      document.documentElement.style.setProperty('--topnav-h', `${h}px`)
    }
    setVar()
    const ro = new ResizeObserver(setVar)
    if (barRef.current) ro.observe(barRef.current)
    window.addEventListener('resize', setVar)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', setVar)
    }
  }, [])

  const shellClass =
    'fixed inset-x-0 top-0 z-50 transition-colors ' +
    (scrolled
      ? 'border-b border-white/10 bg-neutral-950/60 backdrop-blur-md'
      : 'bg-transparent')

  return (
    <header className={shellClass} data-scrolled={scrolled}>
      {/* Measured bar (ref) */}
      <div
        ref={barRef}
        className="mx-auto flex w-full max-w-7xl items-center gap-3 px-2 pt-2 pb-5 sm:py-4 md:px-6"
      >
        {/* Brand */}
        <a
          href="/"
          onClick={onBrandClick}
          className="flex items-center gap-1 rounded-md focus:outline-none focus:ring-2 focus:ring-brand/60"
          aria-label="Go to top"
        >
          <img
            src={logoPng}
            alt="FeelFlick logo"
            width="48"
            height="48"
            className="h-12 w-12 rounded-md object-contain sm:h-11 sm:w-11"
            fetchpriority="high"
          />
          <span className="text-[2rem] font-black tracking-tight text-brand-100 sm:text-[1.7rem]">
            FEELFLICK
          </span>
        </a>

        <div className="flex-1" />

        {/* Desktop actions */}
        <div className="hidden items-center gap-2 sm:flex">
          <Link
            to="/auth/sign-in"
            className="inline-flex h-9 items-center gap-2 rounded-full border border-white/25 px-3.5 text-[0.85rem] font-semibold text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-brand/60"
          >
            <LogIn className="h-4 w-4" aria-hidden />
            <span>Sign in</span>
          </Link>
          <button
            onClick={onGetStarted}
            className="inline-flex h-9 items-center justify-center rounded-full px-4 text-[0.9rem] font-semibold text-white shadow-lift transition-transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-brand/60 bg-gradient-to-r from-[#fe9245] to-[#eb423b]"
          >
            Get started
          </button>
        </div>

        {/* Mobile menu toggle */}
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
        <div className="mx-2 mb-3 rounded-2xl border border-white/10 bg-neutral-900/95 p-2 shadow-xl backdrop-blur">
          <ul className="flex flex-col">
            <li>
              <Link
                ref={firstLinkRef}
                to="/auth/sign-in"
                onClick={() => setOpen(false)}
                className="block rounded-full border border-white/25 px-3 py-2.5 text-center text-[1.02rem] font-semibold text-white hover:bg-white/10 focus:outline-none focus:ring-1 focus:ring-white/40"
              >
                Sign in
              </Link>
            </li>
            <li className="mt-1">
              <Link
                to="/auth/sign-up"
                onClick={() => setOpen(false)}
                className="flex w-full items-center justify-center rounded-lg px-3 py-2.5 text-[1.02rem] font-semibold text-white shadow-lift focus:outline-none focus:ring-1 focus:ring-white/30 bg-gradient-to-r from-[#fe9245] to-[#eb423b]"
              >
                Get started
              </Link>
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
        `rounded-lg px-3 py-2 text-[0.95rem] transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-brand/60 ${
          isActive ? 'bg-white/15 text-white' : 'text-white/80'
        }`
      }
    >
      {label}
    </NavLink>
  )
}