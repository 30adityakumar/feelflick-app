// src/features/landing/components/Footer.jsx
import { useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Instagram, Heart, Film } from 'lucide-react'
import { motion } from 'framer-motion'

const TikTokIcon = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
  </svg>
)

export default function Footer() {
  const location = useLocation()
  const navigate = useNavigate()
  const barRef = useRef(null)

  // Set CSS variable for footer height
  useEffect(() => {
    const setVar = () => {
      const h = barRef.current?.offsetHeight || 80
      document.documentElement.style.setProperty('--footer-h', `${h}px`)
    }
    setVar()
    const ro = new ResizeObserver(setVar)
    if (barRef.current) ro.observe(barRef.current)
    return () => ro.disconnect()
  }, [])

  // All hooks above — safe to return early now
  if (location.pathname.startsWith('/onboarding')) {
    return null
  }

  const year = new Date().getFullYear()

  const scrollToSection = (sectionId) => {
    const doScroll = () => {
      const element = document.getElementById(sectionId)
      if (element) {
        const elementPosition = element.getBoundingClientRect().top + window.scrollY
        window.scrollTo({ top: elementPosition - 80, behavior: 'smooth' })
      }
    }
    if (location.pathname !== '/') {
      navigate('/')
      setTimeout(doScroll, 100)
    } else {
      doScroll()
    }
  }

  return (
    <footer
      ref={barRef}
      className="relative bg-black overflow-hidden"
      role="contentinfo"
    >
      {/* Top glow line — FeelFlick gradient */}
      <div
        className="absolute top-0 inset-x-0 h-px pointer-events-none"
        style={{ background: 'linear-gradient(to right, transparent, rgba(168,85,247,0.6), rgba(236,72,153,0.5), transparent)' }}
        aria-hidden="true"
      />

      {/* Ambient purple bloom — very subtle */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 70% 40% at 50% 0%, rgba(88,28,135,0.08) 0%, transparent 70%)' }}
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-6xl px-6 lg:px-8 pt-16 pb-10">

        {/* Main grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-16 mb-14">

          {/* Brand column */}
          <div className="md:col-span-5 space-y-5">
            <Link
              to="/"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="inline-block"
              aria-label="FeelFlick home"
            >
              <span className="font-black text-2xl tracking-tight bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                FEELFLICK
              </span>
            </Link>

            <p className="text-white/45 text-sm leading-relaxed max-w-xs">
              Mood first. Always. The film that fits how you feel — not what everyone else is watching.
            </p>

            {/* Social icons */}
            <div className="flex gap-3" role="list" aria-label="Social media links">
              <SocialLink
                href="https://instagram.com/feelflick"
                icon={Instagram}
                label="Instagram"
              />
              <SocialLink
                href="https://tiktok.com/@feelflick"
                icon={TikTokIcon}
                label="TikTok"
              />
            </div>
          </div>

          {/* Links */}
          <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8">

            <div>
              <h3 className="text-white/80 font-bold text-xs tracking-[0.16em] uppercase mb-5">
                Product
              </h3>
              <ul className="space-y-3.5" role="list">
                <li><FooterLink onClick={() => scrollToSection('how-it-works')}>How it Works</FooterLink></li>
                <li><FooterLink to="/browse">Browse Movies</FooterLink></li>
              </ul>
            </div>

            <div>
              <h3 className="text-white/80 font-bold text-xs tracking-[0.16em] uppercase mb-5">
                Company
              </h3>
              <ul className="space-y-3.5" role="list">
                <li><FooterLink to="/about">About Us</FooterLink></li>
              </ul>
            </div>

            <div>
              <h3 className="text-white/80 font-bold text-xs tracking-[0.16em] uppercase mb-5">
                Legal
              </h3>
              <ul className="space-y-3.5" role="list">
                <li><FooterLink to="/privacy">Privacy Policy</FooterLink></li>
                <li><FooterLink to="/terms">Terms of Service</FooterLink></li>
              </ul>
            </div>

          </div>
        </div>

        {/* Divider */}
        <div
          className="h-px mb-8"
          style={{ background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.08), transparent)' }}
          aria-hidden="true"
        />

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-white/30 text-xs">
            &copy; {year} FeelFlick. All rights reserved.
          </p>
          <p className="text-white/25 text-xs flex items-center gap-1.5">
            <Film className="w-3 h-3 text-purple-500/60" aria-hidden="true" />
            <span>Made with</span>
            <Heart className="w-3 h-3 text-pink-500/80 fill-pink-500/80" aria-label="love" />
            <span>for movie lovers</span>
          </p>
        </div>

      </div>
    </footer>
  )
}

function FooterLink({ to, onClick, children }) {
  const base = 'group relative text-white/45 hover:text-white/90 text-sm transition-colors duration-200 inline-block'
  const underline = (
    <span
      className="absolute -bottom-0.5 left-0 w-0 h-px group-hover:w-full transition-all duration-300"
      style={{ background: 'linear-gradient(to right, rgb(168,85,247), rgb(236,72,153))' }}
      aria-hidden="true"
    />
  )

  if (onClick) {
    return (
      <button onClick={onClick} className={base}>
        {children}
        {underline}
      </button>
    )
  }

  return (
    <Link to={to} className={base} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
      {children}
      {underline}
    </Link>
  )
}

function SocialLink({ href, icon: Icon, label }) {
  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Follow FeelFlick on ${label}`}
      role="listitem"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white/45 hover:text-white transition-colors duration-200 touch-target"
      style={{ background: 'rgba(255,255,255,0.04)' }}
      onMouseEnter={e => e.currentTarget.style.background = 'linear-gradient(135deg, rgba(168,85,247,0.2), rgba(236,72,153,0.15))'}
      onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
    </motion.a>
  )
}
