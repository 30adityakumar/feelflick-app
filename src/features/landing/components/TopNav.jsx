// src/app/header/TopNav.jsx
import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LogIn, Menu, X } from 'lucide-react'
import logoPng from '@/assets/images/logo.png'

export default function TopNav() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const barRef = useRef(null)
  const navigate = useNavigate()
  const location = useLocation()

  // Close mobile panel on route change
  useEffect(() => setOpen(false), [location.pathname])

  // Set --topnav-h immediately and on resize (prevents micro-CLS)
  useEffect(() => {
    const setVar = () => {
      const h = barRef.current?.offsetHeight || 72
      document.documentElement.style.setProperty('--topnav-h', `${h}px`)
    }
    setVar()
    const ro = new ResizeObserver(setVar)
    if (barRef.current) ro.observe(barRef.current)
    return () => ro.disconnect()
  }, [])

  // Toggle scrolled style
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

  const onBrandClick = (e) => {
    e.preventDefault()
    if (location.pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      navigate('/')
      // ensure top after nav
      setTimeout(() => window.scrollTo({ top: 0, behavior: 'auto' }), 0)
    }
  }

  const shellClass =
    'fixed inset-x-0 top-0 z-50 transition-colors duration-200 ' +
    (scrolled ? 'bg-neutral-950/60 backdrop-blur-md ring-1 ring-white/10' : 'bg-transparent')

  return (
    <header className={shellClass} data-scrolled={scrolled}>
      {/* Skip to content for a11y */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:rounded-md focus:bg-neutral-900 focus:px-3 focus:py-2 focus:text-white focus:ring-2 focus:ring-brand/60"
      >
        Skip to content
      </a>

      <div
        ref={barRef}
        className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-3 pt-[calc(env(safe-area-inset-top)+6px)] pb-3 sm:py-4 md:px-6"
      >
        {/* Brand */}
        <a
          href="/"
          onClick={onBrandClick}
          className="flex items-center gap-2 rounded-md focus:outline-none focus:ring-2 focus:ring-brand/60"
          aria-label="FeelFlick home"
        >
          <img
            src={logoPng}
            alt=""
            width="36"
            height="36"
            className="h-9 w-9 object-contain"
            loading="eager"
            decoding="async"
          />
          <span className="text-[clamp(1.25rem,4.5vw,1.75rem)] font-extrabold tracking-tight text-brand-100">
            FEELFLICK
          </span>
        </a>

        {/* Right side actions */}
        <div className="hidden md:flex items-center gap-2">
          <Link
            to="/auth/sign-in"
            className="group relative inline-flex h-10 items-center gap-2 rounded-full border border-white/20 px-4 text-[0.9rem] font-semibold text-white/95 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/60 active:scale-[.98]"
          >
            <LogIn className="h-4 w-4 text-white/90" aria-hidden />
            <span>Sign in</span>
          </Link>
          <Link
            to="/auth/sign-up"
            className="inline-flex h-10 items-center justify-center rounded-full px-5 text-[0.95rem] font-semibold text-white shadow-lift transition-transform hover:scale-[1.02] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/60 active:scale-[.98] bg-gradient-to-r from-[#fe9245] to-[#eb423b]"
          >
            Get started
          </Link>
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-menu"
          className="md:hidden inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-white/90 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-brand/60"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          <span className="sr-only">Toggle menu</span>
        </button>
      </div>

      {/* Mobile panel */}
      <div
        id="mobile-menu"
        className={`md:hidden ${open ? 'pointer-events-auto opacity-100 translate-y-0' : 'pointer-events-none opacity-0 -translate-y-2'} 
                    fixed inset-x-0`}
        style={{ top: 'var(--topnav-h, 72px)' }}
      >
        <div className="mx-3 rounded-2xl border border-white/10 bg-neutral-950/85 px-3 py-3 backdrop-blur-xl shadow-2xl">
          <div className="flex flex-col gap-2">
            <Link
              to="/auth/sign-in"
              className="group inline-flex h-11 items-center justify-center gap-2 rounded-full border border-white/20 bg-black/30 px-4 text-[0.95rem] font-semibold text-white/95 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-brand/60 active:scale-[.98]"
            >
              <LogIn className="h-4 w-4 text-white/90" aria-hidden />
              <span>Sign in</span>
            </Link>
            <Link
              to="/auth/sign-up"
              className="inline-flex h-11 items-center justify-center rounded-full px-5 text-[0.95rem] font-semibold text-white shadow-lift transition-transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-brand/60 active:scale-[.98] bg-gradient-to-r from-[#fe9245] to-[#eb423b]"
            >
              Get started
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}