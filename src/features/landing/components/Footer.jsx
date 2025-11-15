// src/features/landing/components/Footer.jsx
import { Link } from 'react-router-dom'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-white/5 bg-black/50 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="inline-block mb-4">
              <span className="text-2xl font-black bg-gradient-to-r from-[#FF9245] via-[#EB423B] to-[#E03C9E] bg-clip-text text-transparent">
                FEELFLICK
              </span>
            </Link>
            <p className="text-sm text-white/60 leading-relaxed max-w-sm">
              Your mood-based movie companion. Discover films that match how you feel, not just what's trending.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-bold text-white mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/browse" className="text-sm text-white/60 hover:text-white transition-colors">
                  Discover
                </Link>
              </li>
              <li>
                <Link to="/watchlist" className="text-sm text-white/60 hover:text-white transition-colors">
                  Watchlist
                </Link>
              </li>
              <li>
                <Link to="/history" className="text-sm text-white/60 hover:text-white transition-colors">
                  Watch History
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-bold text-white mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <a href="/privacy" className="text-sm text-white/60 hover:text-white transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="/terms" className="text-sm text-white/60 hover:text-white transition-colors">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="/contact" className="text-sm text-white/60 hover:text-white transition-colors">
                  Contact
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/40">
            © {currentYear} FeelFlick. All rights reserved.
          </p>
          <p className="text-xs text-white/40">
            Made with <span className="text-[#EB423B]">❤️</span> for movie lovers
          </p>
        </div>
      </div>
    </footer>
  )
}
