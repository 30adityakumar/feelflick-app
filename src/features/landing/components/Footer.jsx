// src/app/footer/Footer.jsx
import { Link, useLocation, useNavigate } from 'react-router-dom'
import logoPng from '@/assets/images/logo.png'

export default function Footer() {
  const navigate = useNavigate()
  const location = useLocation()
  const year = new Date().getFullYear()

  function onBrandClick(e) {
    e.preventDefault()
    if (location.pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      navigate('/', { replace: false })
      setTimeout(() => window.scrollTo({ top: 0, behavior: 'auto' }), 0)
    }
  }

  return (
    <footer className="relative mt-10 md:mt-16 border-t border-white/10 bg-neutral-950/60 backdrop-blur-md">
      {/* hairline glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-brand-600/40 via-white/10 to-transparent"
      />

      <div className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14">
        <div className="grid gap-10 md:grid-cols-12 md:gap-8">
          {/* Brand + copy */}
          <div className="md:col-span-5">
            <a
              href="/"
              onClick={onBrandClick}
              className="inline-flex items-center gap-2 rounded-md focus:outline-none focus:ring-2 focus:ring-brand/60"
              aria-label="Back to top"
            >
              <img
                src={logoPng}
                alt="FeelFlick logo"
                width="40"
                height="40"
                className="h-10 w-10 rounded-md object-contain"
                loading="lazy"
                decoding="async"
              />
              <span className="text-2xl font-extrabold tracking-tight text-brand-100">FEELFLICK</span>
            </a>

            <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/70">
              Movies that match how you feel. Shortlists you’ll actually watch—no endless scrolling.
            </p>

            {/* TMDb attribution */}
            <p className="mt-4 text-[12px] leading-relaxed text-white/50">
              This product uses the TMDB API but is not endorsed or certified by TMDB.
            </p>

            {/* Socials: Instagram + TikTok only */}
            <div className="mt-5 flex items-center gap-2.5">
              <FooterIconLink
                href="https://www.instagram.com/feelflick"
                label="Instagram"
                icon={<InstaIcon className="h-4 w-4" />}
              />
              <FooterIconLink
                href="https://www.tiktok.com/@feelflick"
                label="TikTok"
                icon={<TikTokIcon className="h-4 w-4" />}
              />
            </div>
          </div>

          {/* Links */}
          <div className="md:col-span-7">
            <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
              <FooterCol
                title="Product"
                links={[
                  { to: '/auth/sign-in', label: 'Sign in' },
                  { to: '/auth/sign-up', label: 'Get started' },
                ]}
              />
              <FooterCol
                title="Company"
                links={[
                  { to: '/about', label: 'About' },
                  { to: '/contact', label: 'Contact' },
                  { to: '/changelog', label: 'Changelog' },
                ]}
              />
              <FooterCol
                title="Legal"
                links={[
                  { to: '/privacy', label: 'Privacy' },
                  { to: '/terms', label: 'Terms' },
                  { to: '/cookies', label: 'Cookies' },
                ]}
              />
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 border-t border-white/10 pt-6 text-sm text-white/50 md:mt-10">
          <div className="flex flex-col items-start justify-between gap-3 sm:flex-row">
            <div>© {year} FeelFlick. All rights reserved.</div>
            <div className="flex items-center gap-4">
              <FooterTextLink to="/privacy">Privacy</FooterTextLink>
              <FooterTextLink to="/terms">Terms</FooterTextLink>
              <FooterTextLink to="/status">Status</FooterTextLink>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

/* --------------------------- small components --------------------------- */

function FooterIconLink({ href, label, icon }) {
  const isExternal = href.startsWith('http')
  const classes =
    'inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-[12px] ' +
    'font-medium text-white/85 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-brand/60'
  return isExternal ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={classes} aria-label={label} title={label}>
      {icon} <span className="sr-only">{label}</span>
    </a>
  ) : (
    <Link to={href} className={classes} aria-label={label} title={label}>
      {icon} <span className="sr-only">{label}</span>
    </Link>
  )
}

function FooterCol({ title, links }) {
  return (
    <div>
      <div className="text-sm font-semibold text-white/90">{title}</div>
      <ul className="mt-3 space-y-2">
        {links.map((l) => (
          <li key={l.to}>
            <FooterTextLink to={l.to}>{l.label}</FooterTextLink>
          </li>
        ))}
      </ul>
    </div>
  )
}

function FooterTextLink({ to, children }) {
  const isExternal = to.startsWith('http')
  const cls = 'text-sm text-white/70 hover:text-white/90 focus:outline-none focus:ring-2 focus:ring-brand/60 rounded'
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
  // Minimal Instagram glyph (rounded square + lens)
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle cx="12" cy="12" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
    </svg>
  )
}

function TikTokIcon({ className = '' }) {
  // Simple TikTok-like note mark
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        d="M14 3v9.2a3.8 3.8 0 1 1-2.4-3.56V4.5c1.2 1.6 3.06 2.7 5.2 2.94V10a6.7 6.7 0 0 1-4.8-2.1V3h2Z"
        fill="currentColor"
      />
    </svg>
  )
}