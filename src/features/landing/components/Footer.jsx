import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'

export default function Footer({ variant = 'micro', subtle = false }) {
  return <MicroFooter subtle={subtle} />
}

function MicroFooter({ subtle }) {
  const year = new Date().getFullYear()
  const ref = useRef(null)

  // Measure footer height -> --footer-h
  useEffect(() => {
    const setVar = () => {
      const h = ref.current?.offsetHeight || 64
      document.documentElement.style.setProperty('--footer-h', `${h}px`)
    }
    setVar()
    const ro = new ResizeObserver(setVar)
    if (ref.current) ro.observe(ref.current)
    return () => ro.disconnect()
  }, [])

  return (
    <footer
      ref={ref}
      className={
        'relative border-t ' +
        (subtle ? 'border-white/10 bg-black/30 backdrop-blur-sm' : 'border-white/10 bg-neutral-950/60 backdrop-blur-md')
      }
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-brand-600/40 via-white/10 to-transparent"
      />
      <div className="mx-auto max-w-7xl px-4 py-5 md:px-6 md:py-6">
        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
          <div className="text-xs text-white/65">
            © {year} FeelFlick · <FooterTextLink to="/privacy">Privacy</FooterTextLink>{' · '}
            <FooterTextLink to="/terms">Terms</FooterTextLink>{' · '}
            <FooterTextLink to="/status">Status</FooterTextLink>
          </div>

          {/* socials kept minimal; remove if you prefer ultra-minimal */}
          <div className="flex items-center gap-2.5">
            <FooterIconLink href="https://www.instagram.com/feelflick" label="Instagram" icon={<InstaIcon className="h-4 w-4" />} />
            <FooterIconLink href="https://www.tiktok.com/@feelflick"  label="TikTok"    icon={<TikTokIcon className="h-4 w-4" />} />
          </div>
        </div>
      </div>
    </footer>
  )
}

/* shared bits */
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

/* icons */
function InstaIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
    </svg>
  )
}
function TikTokIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path d="M14 3v9.2a3.8 3.8 0 1 1-2.4-3.56V4.5c1.2 1.6 3.06 2.7 5.2 2.94V10a6.7 6.7 0 0 1-4.8-2.1V3h2Z" fill="currentColor" />
    </svg>
  )
}