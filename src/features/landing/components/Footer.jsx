// src/features/landing/components/Footer.jsx
import { Link } from 'react-router-dom'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-white/10 bg-black py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <Link to="/" className="inline-block mb-4">
              <span className="text-xl font-black bg-gradient-to-r from-[#FF9245] via-[#EB423B] to-[#E03C9E] bg-clip-text text-transparent">
                FEELFLICK
              </span>
            </Link>
            <p className="text-sm text-white/60">
              Your mood-based movie companion
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-sm font-bold text-white mb-4">Product</h3>
            <ul className="space-y-2 text-sm text-white/60">
              <li>
                <Link to="/browse" className="hover:text-white transition-colors">
                  Browse Movies
                </Link>
              </li>
              <li>
                <Link to="/watchlist" className="hover:text-white transition-colors">
                  Watchlist
                </Link>
              </li>
              <li>
                <Link to="/history" className="hover:text-white transition-colors">
                  Watch History
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-sm font-bold text-white mb-4">Company</h3>
            <ul className="space-y-2 text-sm text-white/60">
              <li>
                <a href="#about" className="hover:text-white transition-colors">
                  About
                </a>
              </li>
              <li>
                <a href="#privacy" className="hover:text-white transition-colors">
                  Privacy
                </a>
              </li>
              <li>
                <a href="#terms" className="hover:text-white transition-colors">
                  Terms
                </a>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-sm font-bold text-white mb-4">Support</h3>
            <ul className="space-y-2 text-sm text-white/60">
              <li>
                <a href="#help" className="hover:text-white transition-colors">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#contact" className="hover:text-white transition-colors">
                  Contact
                </a>
              </li>
              <li>
                <a href="#feedback" className="hover:text-white transition-colors">
                  Feedback
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-white/50">
          <p>© {currentYear} FeelFlick. All rights reserved.</p>
          <p className="text-xs">
            Powered by{' '}
            <a
              href="https://www.themoviedb.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/70 hover:text-white transition-colors"
            >
              TMDB
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
