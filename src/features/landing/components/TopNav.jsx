// src/features/landing/components/TopNav.jsx
import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LogIn } from 'lucide-react'

export default function TopNav({ hideAuthCta = false, onAuthOpen }) {
  const [scrolled, setScrolled] = useState(false)
  const barRef = useRef(null)
  const navigate = useNavigate()
  const location = useLocation()

  // 🚫 Do not render TopNav on onboarding route (true in-app feel)
  if (location.pathname.startsWith('/onboarding')) {
    return null
  }

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
      setTimeout(() => window.scrollTo({ top: 0, behavior: 'auto' }), 0)
    }
  }

  const shellClass =
    'fixed inset-x-0 top-0 z-50 transition-colors duration-200 ' +
    (scrolled ? 'bg-neutral-950/60 backdrop-blur-md ring-1 ring-white/10' : 'bg-transparent')

  return (
    <header className={shellClass} data-scrolled={scrolled}>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:rounded-md focus:bg-neutral-900 focus:px-3 focus:py-2 focus:text-white"
      >
        Skip to content
      </a>

      <div
        ref={barRef}
        className="mx-auto flex w-full max-w-7xl items-center justify-between gap-2 px-3 pt-[calc(env(safe-area-inset-top)+14px)] pb-3 sm:py-4 md:px-6"
      >
        {/* Brand */}
        <a
          href="/"
          onClick={onBrandClick}
          className="flex items-center rounded-md"
          aria-label="FeelFlick home"
        >
          <span className="text-[clamp(1.6rem,5.2vw,2.25rem)] font-extrabold tracking-tight text-brand-100 uppercase">
            FEELFLICK
          </span>
        </a>

        {!hideAuthCta && (
          <>
            {/* Desktop */}
            <div className="hidden md:flex items-center gap-2">
              {onAuthOpen ? (
                <button
                  type="button"
                  onClick={onAuthOpen}
                  className="group relative inline-flex h-10 items-center gap-2 rounded-full border border-white/20 px-4 text-[0.9rem] font-semibold text-white/95 hover:bg-white/10 active:scale-[.98] focus:outline-none"
                  aria-label="Log in"
                >
                  <LogIn className="h-4 w-4 text-white/90" aria-hidden />
                  <span>Log in</span>
                </button>
              ) : (
                <Link
                  to="/auth/log-in-or-create-account"
                  className="group relative inline-flex h-10 items-center gap-2 rounded-full border border-white/20 px-4 text-[0.9rem] font-semibold text-white/95 hover:bg-white/10 active:scale-[.98] focus:outline-none"
                >
                  <LogIn className="h-4 w-4 text-white/90" aria-hidden />
                  <span>Log in</span>
                </Link>
              )}
            </div>

            {/* Mobile */}
            <div className="md:hidden">
              {onAuthOpen ? (
                <button
                  type="button"
                  onClick={onAuthOpen}
                  className="inline-flex items-center gap-2 h-10 px-4 rounded-full border border-white/20 bg-white/5 text-[0.95rem] font-semibold text-white/95 hover:bg-white/10 active:scale-[.98] focus:outline-none"
                  aria-label="Log in"
                >
                  <LogIn className="h-4 w-4 text-white/90" aria-hidden />
                  <span>Log in</span>
                </button>
              ) : (
                <Link
                  to="/auth/log-in-or-create-account"
                  className="inline-flex items-center gap-2 h-10 px-4 rounded-full border border-white/20 bg-white/5 text-[0.95rem] font-semibold text-white/95 hover:bg-white/10 active:scale-[.98] focus:outline-none"
                >
                  <LogIn className="h-4 w-4 text-white/90" aria-hidden />
                  <span>Log in</span>
                </Link>
              )}
            </div>
          </>
        )}
      </div>
    </header>
  )
}