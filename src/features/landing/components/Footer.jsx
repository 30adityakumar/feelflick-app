// src/features/landing/components/Footer.jsx
import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'

export default function Footer() {
  return <MicroFooter />
}

/* --------------------------- MICRO ONLY (centered, tiny) --------------------------- */
function MicroFooter() {
  const year = new Date().getFullYear()
  const barRef = useRef(null)

  // Expose footer height so the hero can perfectly center itself
  useEffect(() => {
    const setVar = () => {
      const h = barRef.current?.offsetHeight || 32
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
      className="fixed inset-x-0 bottom-0 z-40 bg-transparent"
    >
      {/* ultra-tight padding, centered content */}
      <div className="mx-auto max-w-7xl px-2 py-1 md:px-3">
        <div className="flex items-center justify-center">
          <div className="text-[11px] md:text-[12px] leading-5 text-white/65 text-center">
            © {year} FeelFlick ·{' '}
            <FooterTextLink to="/about">About</FooterTextLink>{' · '}
            <FooterTextLink to="/privacy">Privacy</FooterTextLink>{' · '}
            <FooterTextLink to="/terms">Terms</FooterTextLink>
          </div>
        </div>
      </div>
    </footer>
  )
}

/* --------------------------- helper --------------------------- */
function FooterTextLink({ to, children }) {
  const isExternal = to.startsWith('http')
  const cls =
    'underline-offset-2 hover:underline text-white/50 hover:text-white focus:outline-none focus:ring-2 focus:ring-brand/60 rounded'
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