import { Link, useLocation, useNavigate } from 'react-router-dom'
import logoPng from '@/assets/images/logo.png'

export default function Footer({ variant = 'full' }) {
  return variant === 'micro' ? <MicroFooter /> : <FullFooter />
}

/* --------------------------- MICRO VARIANT --------------------------- */
function MicroFooter() {
  const year = new Date().getFullYear()
  return (
    <footer className="relative mt-8 border-t border-white/10 bg-neutral-950/60 backdrop-blur-md">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-brand-600/40 via-white/10 to-transparent"
      />
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
          <div className="text-xs text-white/60">
            © {year} FeelFlick ·{' '}
            <FooterTextLink to="/privacy">Privacy</FooterTextLink>{' · '}
            <FooterTextLink to="/terms">Terms</FooterTextLink>{' · '}
            <FooterTextLink to="/status">Status</FooterTextLink>
          </div>
          <div className="flex items-center gap-2.5">
            <FooterIconLink href="https://www.instagram.com/feelflick" label="Instagram" icon={<InstaIcon className="h-4 w-4" />} />
            <FooterIconLink href="https://www.tiktok.com/@feelflick" label="TikTok" icon={<TikTokIcon className="h-4 w-4" />} />
          </div>
        </div>
      </div>
    </footer>
  )
}