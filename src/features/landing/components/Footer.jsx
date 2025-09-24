// src/features/landing/components/Footer.jsx
import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'

export default function Footer() {
  return <MicroFooter />
}

/* --------------------------- MICRO ONLY --------------------------- */
function MicroFooter() {
  const year = new Date().getFullYear()
  const barRef = useRef(null)

  // Keep Hero perfectly centered by exposing --footer-h (actual px)
  useEffect(() => {
    const setVar = () => {
      const h = barRef.current?.offsetHeight || 56
      document.documentElement.style.setProperty('--footer-h', `${h}px`)
    }
    setVar()
    const ro = new ResizeObserver(setVar)
    if (barRef.current) ro.observe(barRef.current)
    return () => ro.disconnect()
  }, [])

  return (
    <footer
      ref={barRef}
      // Fixed to the bottom; transparent so it blends with the hero bg.
      className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-transparent"
    >
      {/* Tight vertical padding → no visual gap under the footer */}
      <div className="mx-auto max-w-7xl px-4 py-3 md:px-6">
        <div className="flex items-center justify-between gap-3">
          {/* Left: text (uniform size) */}
          <div className="text-[13px] text-white/65">
            © {year} FeelFlick ·{' '}
            <FooterTextLink to="/privacy">Privacy</FooterTextLink>{' · '}
            <FooterTextLink to="/terms">Terms</FooterTextLink>{' · '}
            <FooterTextLink to="/status">Status</FooterTextLink>
          </div>

          {/* Right: socials */}
          <div className="flex items-center gap-2.5">
            <FooterIconLink
              href="https://www.instagram.com/feelflick"
              label="Instagram"
            >
              <InstaIcon className="h-4 w-4" />
            </FooterIconLink>
            <FooterIconLink
              href="https://www.tiktok.com/@feelflick"
              label="TikTok"
            >
              <TikTokIcon className="h-4 w-4" />
            </FooterIconLink>
          </div>
        </div>
      </div>
    </footer>
  )
}

/* --------------------------- helpers --------------------------- */

function FooterIconLink({ href, label, children }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      title={label}
      className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/85 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-brand/60"
    >
      {children}
    </a>
  )
}

function FooterTextLink({ to, children }) {
  const isExternal = to.startsWith('http')
  const cls =
    'text-[13px] text-white/70 hover:text-white/90 focus:outline-none focus:ring-2 focus:ring-brand/60 rounded'
  return isExternal ? (
    <a href={to} target="_blank" rel="noopener noreferrer" className={cls}>
      {children}
    </a>
  ) : (
    <Link to={to} className={cls}>
      {children}
    </Link>
  )
}

/* --------------------------- inline icons --------------------------- */

function InstaIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle
        cx="12"
        cy="12"
        r="3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
    </svg>
  )
}

function TikTokIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        d="M14 3v9.2a3.8 3.8 0 1 1-2.4-3.56V4.5c1.2 1.6 3.06 2.7 5.2 2.94V10a6.7 6.7 0 0 1-4.8-2.1V3h2Z"
        fill="currentColor"
      />
    </svg>
  )
}