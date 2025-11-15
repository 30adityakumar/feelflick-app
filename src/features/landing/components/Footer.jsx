// src/features/landing/components/Footer.jsx
import { Link } from 'react-router-dom'
import { Github, Twitter, Heart } from 'lucide-react'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="relative bg-black border-t border-white/10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12 mb-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link to="/" className="inline-block mb-4 group">
              <span className="text-2xl font-black tracking-tight bg-gradient-to-r from-[#FF9245] via-[#EB423B] to-[#E03C9E] bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300 inline-block">
                FEELFLICK
              </span>
            </Link>
            <p className="text-sm text-white/60 max-w-md mb-4">
              Your mood-based movie companion. Discover films that match how you feel, 
              build watchlists, and track your viewing journey.
            </p>
            <div className="flex items-center gap-4">
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-all duration-200"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-all duration-200"
                aria-label="GitHub"
              >
                <Github className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-sm font-bold text-white mb-4">Product</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/"
                  className="text-sm text-white/60 hover:text-white transition-colors duration-200"
                >
                  Features
                </Link>
              </li>
              <li>
                <Link
                  to="/"
                  className="text-sm text-white/60 hover:text-white transition-colors duration-200"
                >
                  How It Works
                </Link>
              </li>
              <li>
                <Link
                  to="/"
                  className="text-sm text-white/60 hover:text-white transition-colors duration-200"
                >
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-sm font-bold text-white mb-4">Company</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/"
                  className="text-sm text-white/60 hover:text-white transition-colors duration-200"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  to="/"
                  className="text-sm text-white/60 hover:text-white transition-colors duration-200"
                >
                  Privacy
                </Link>
              </li>
              <li>
                <Link
                  to="/"
                  className="text-sm text-white/60 hover:text-white transition-colors duration-200"
                >
                  Terms
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-white/40 flex items-center gap-1.5">
            © {currentYear} FeelFlick. Made with 
            <Heart className="h-4 w-4 text-red-500 fill-current" /> 
            for movie lovers.
          </p>
          <p className="text-xs text-white/30">
            Powered by TMDB
          </p>
        </div>
      </div>
    </footer>
  )
}
