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
    <header ref={barRef} className={shellClass}>
      <div className="mx-auto flex h-16 items-center justify-between px-4 sm:h-[72px] sm:px-6 md:px-8">
        {/* Logo with FeelFlick Gradient - Netflix-sized */}
        <Link
          to="/"
          onClick={onBrandClick}
          className="group flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 rounded"
        >
          <span className="text-[1.75rem] sm:text-[2rem] md:text-[2.25rem] lg:text-[2.5rem] font-black tracking-tight leading-none bg-gradient-to-r from-[#FF9245] via-[#EB423B] to-[#E03C9E] bg-clip-text text-transparent transition-opacity group-hover:opacity-80">
            FEELFLICK
          </span>
        </Link>

        {/* Auth CTA */}
        {!hideAuthCta && (
          <button
            onClick={() => onAuthOpen?.()}
            className="group inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-white/10 hover:border-white/25 focus:outline-none focus:ring-2 focus:ring-white/50 active:scale-95"
          >
            <LogIn className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            <span>Sign In</span>
          </button>
        )}
      </div>
    </header>
  )
}
