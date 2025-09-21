// src/features/landing/components/TopNav.jsx
import { useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LogIn } from 'lucide-react'
import logoPng from '@/assets/images/logo.png'

export default function TopNav() {
  const navRef = useRef(null)
  const location = useLocation()
  const navigate = useNavigate()
  const isHome = location.pathname === '/'

  // Expose height to CSS so LandingHero can start below the fixed bar
  useEffect(() => {
    const el = navRef.current
    if (!el) return
    const set = () =>
      document.documentElement.style.setProperty(
        '--topnav-h',
        `${Math.round(el.getBoundingClientRect().height)}px`
      )
    set()
    const ro = new ResizeObserver(set)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const handleBrandClick = (e) => {
    e.preventDefault()
    if (isHome) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      navigate('/')
    }
  }

  return (
    <header
      ref={navRef}
      className="fixed inset-x-0 top-0 z-40 border-b border-white/10 bg-neutral-950/70 backdrop-blur-md"
    >
      <div className="mx-auto max-w-7xl px-4 py-3 md:px-6">
        <div className="flex items-center justify-between gap-3">
          {/* Brand */}
          <a
            href="/"
            onClick={handleBrandClick}
            className="inline-flex items-center gap-2 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/60"
            aria-label="FeelFlick — back to top"
          >
            <img
              src={logoPng}
              width="28"
              height="28"
              alt="FeelFlick logo"
              className="h-7 w-7 rounded object-contain"
              decoding="async"
            />
            <span className="text-lg font-extrabold tracking-wide text-brand-100">
              FEELFLICK
            </span>
          </a>

          {/* Right side: ONLY Sign in (removed Get started) */}
          <nav className="flex items-center gap-2">
            <Link
              to="/auth/sign-in"
              className="inline-flex h-9 items-center gap-2 rounded-full border border-white/20 px-4 text-sm font-semibold text-white/95 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/60"
            >
              <LogIn className="h-4 w-4" aria-hidden />
              <span>Sign in</span>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  )
}