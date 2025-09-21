// src/app/footer/Footer.jsx
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Github, Twitter, Mail } from 'lucide-react'
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
    <footer className="relative mt-16 border-t border-white/10 bg-neutral-950/60 backdrop-blur-md">
      {/* subtle top gradient line */}
      <div className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-brand-600/40 via-white/10 to-transparent" aria-hidden />

      <div className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14">
        <div className="grid gap-10 md:grid-cols-12 md:gap-8">
          {/* Brand + attribution */}
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

            {/* TMDb attribution (required to be present somewhere – we keep it in the footer) */}
            <p className="mt-4 text-[12px] leading-relaxed text-white/50">
              This product uses the TMDB API but is not endorsed or certified by TMDB.
            </p>

            {/* Socials */}
            <div className="mt-5 flex items-center gap-3">
              <FooterIconLink
                href="https://github.com/30adityakumar/feelflick-app"
                label="GitHub"
                icon={<Github className="h-4 w-4" aria-hidden />}
              />
              <FooterIconLink
                href="https://twitter.com/intent/follow?screen_name=feelflick"
                label="Twitter / X"
                icon={<Twitter className="h-4 w-4" aria-hidden />}
              />
              <FooterIconLink
                href="/contact"
                label="Email"
                icon={<Mail className="h-4 w-4" aria-hidden />}
              />
            </div>
          </div>

          {/* Link columns */}
          <div className="md:col-span-7">
            <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
              <FooterCol title="Product" links={[
                { to: '/browse', label: 'Browse' },
                { to: '/trending', label: 'Trending' },
                { to: '/auth/sign-in', label: 'Sign in' },
                { to: '/auth/sign-up', label: 'Get started' },
              ]} />
              <FooterCol title="Company" links={[
                { to: '/about', label: 'About' },
                { to: '/contact', label: 'Contact' },
                { to: '/changelog', label: 'Changelog' },
              ]} />
              <FooterCol title="Legal" links={[
                { to: '/privacy', label: 'Privacy' },
                { to: '/terms', label: 'Terms' },
                { to: '/cookies', label: 'Cookies' },
              ]} />
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-col items-start justify-between gap-4 border-t border-white/10 pt-6 text-sm text-white/50 sm:flex-row">
          <div>© {year} FeelFlick. All rights reserved.</div>
          <div className="flex items-center gap-4">
            <Link to="/privacy" className="hover:text-white/80 focus:outline-none focus:ring-2 focus:ring-brand/60 rounded">
              Privacy
            </Link>
            <Link to="/terms" className="hover:text-white/80 focus:outline-none focus:ring-2 focus:ring-brand/60 rounded">
              Terms
            </Link>
            <Link to="/status" className="hover:text-white/80 focus:outline-none focus:ring-2 focus:ring-brand/60 rounded">
              Status
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

/* --------------------------- small components --------------------------- */

function FooterIconLink({ href, label, icon }) {
  const isExternal = href.startsWith('http')
  if (isExternal) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2.5 py-2 text-[13px] font-medium text-white/85 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-brand/60"
        aria-label={label}
        title={label}
      >
        {icon} <span className="sr-only">{label}</span>
      </a>
    )
  }
  return (
    <Link
      to={href}
      className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2.5 py-2 text-[13px] font-medium text-white/85 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-brand/60"
      aria-label={label}
      title={label}
    >
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
            <FooterLink to={l.to}>{l.label}</FooterLink>
          </li>
        ))}
      </ul>
    </div>
  )
}

function FooterLink({ to, children }) {
  const isExternal = to.startsWith('http')
  if (isExternal) {
    return (
      <a
        href={to}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-white/70 hover:text-white/90 focus:outline-none focus:ring-2 focus:ring-brand/60 rounded"
      >
        {children}
      </a>
    )
  }
  return (
    <Link
      to={to}
      className="text-sm text-white/70 hover:text-white/90 focus:outline-none focus:ring-2 focus:ring-brand/60 rounded"
    >
      {children}
    </Link>
  )
}