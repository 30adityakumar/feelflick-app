// src/features/landing/components/Footer.jsx
import { useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'

// === CONSTANTS ===

const LINK_CLS =
  'text-sm text-white/40 hover:text-white/60 transition-colors duration-200 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black'

const PRODUCT_LINKS = [
  { label: 'Discover',  to: '/discover'  },
  { label: 'Browse',    to: '/browse'    },
  { label: 'Moods',     to: '/discover'  },
]

const COMPANY_LINKS = [
  { label: 'About',   to: '/about'   },
  { label: 'Privacy', to: '/privacy' },
  { label: 'Terms',   to: '/terms'   },
]

const CONNECT_LINKS = [
  { label: 'Twitter / X', href: 'https://twitter.com/feelflick' },
  { label: 'GitHub',      href: 'https://github.com/30adityakumar/feelflick-app' },
  { label: 'Contact',     href: 'mailto:hello@feelflick.com' },
]

// === MAIN COMPONENT ===

/**
 * Footer — back cover of the landing page.
 *
 * Intentionally low-contrast and decoration-free so it recedes
 * behind the FinalCTA section above rather than competing with it.
 * No animations, no glows, no icons — pure structure.
 */
export default function Footer() {
  const barRef   = useRef(null)
  const location = useLocation()

  // Keeps --footer-h CSS variable in sync with the rendered height.
  // Downstream components (e.g. sticky elements) use this variable.
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

  // Footer is hidden on the onboarding flow — check after all hooks
  if (location.pathname.startsWith('/onboarding')) return null

  return (
    <footer ref={barRef} className="bg-black" role="contentinfo">

      {/* Top border — same purple gradient as every section above */}
      <div
        className="h-px"
        style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(168,85,247,0.2) 50%, transparent 100%)' }}
        aria-hidden="true"
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* === THREE-COLUMN LINK GRID === */}
        <nav aria-label="Footer navigation" className="pt-12 sm:pt-16 pb-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8">

            {/* Column 1 — Product */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-4">
                Product
              </p>
              <ul className="space-y-3">
                {PRODUCT_LINKS.map(({ label, to }) => (
                  <li key={label}>
                    <Link to={to} className={LINK_CLS}>
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 2 — Company */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-4">
                Company
              </p>
              <ul className="space-y-3">
                {COMPANY_LINKS.map(({ label, to }) => (
                  <li key={label}>
                    <Link to={to} className={LINK_CLS}>
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 3 — Connect */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-4">
                Connect
              </p>
              <ul className="space-y-3">
                {CONNECT_LINKS.map(({ label, href }) => (
                  <li key={label}>
                    <a
                      href={href}
                      className={LINK_CLS}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </nav>

        {/* Divider */}
        <div className="h-px bg-white/[0.06] mt-8 mb-6" aria-hidden="true" />

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 text-center sm:text-left pb-8">

          {/* Brand — display only, not a link in footer context */}
          <div>
            <p className="text-lg font-black tracking-tight bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent select-none">
              FEELFLICK
            </p>
            <p className="text-xs text-white/20">Films That Know You</p>
          </div>

          {/* Right — human signal + copyright */}
          <div className="text-center sm:text-right">
            <p className="text-xs text-white/20">Built by Aditya Kumar in Toronto. One developer, 6,700 films, and a belief that recommendations should feel personal.</p>
            <p className="text-xs text-white/20">&copy; 2026 FeelFlick</p>
          </div>

        </div>
      </div>

    </footer>
  )
}
