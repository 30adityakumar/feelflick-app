// src/features/landing/components/Footer.jsx
import { Link } from 'react-router-dom'
import { Mail, Twitter, Github } from 'lucide-react'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  const socialLinks = [
    { icon: Mail, href: 'mailto:hello@feelflick.com', label: 'Email' },
    { icon: Twitter, href: 'https://twitter.com/feelflick', label: 'Twitter' },
    { icon: Github, href: 'https://github.com/feelflick', label: 'GitHub' },
  ]

  return (
    <footer className="relative z-10 bg-black border-t border-white/10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {/* Brand */}
          <div>
            <Link to="/" className="inline-block mb-4">
              <span className="text-2xl font-black bg-gradient-to-r from-[#FF9245] via-[#EB423B] to-[#E03C9E] bg-clip-text text-transparent">
                FEELFLICK
              </span>
            </Link>
            <p className="text-sm text-white/60 max-w-xs">
              Your mood-based movie companion. Discover films that match how you feel.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-bold text-white mb-4">Product</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/browse"
                  className="text-sm text-white/60 hover:text-white transition-colors"
                >
                  Browse Movies
                </Link>
              </li>
              <li>
                <Link
                  to="/home"
                  className="text-sm text-white/60 hover:text-white transition-colors"
                >
                  Get Started
                </Link>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h3 className="font-bold text-white mb-4">Connect</h3>
            <div className="flex items-center gap-3">
              {socialLinks.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all hover:scale-110 active:scale-95"
                >
                  <Icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-white/40">
            © {currentYear} FeelFlick. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link
              to="/privacy"
              className="text-sm text-white/40 hover:text-white/60 transition-colors"
            >
              Privacy
            </Link>
            <Link
              to="/terms"
              className="text-sm text-white/40 hover:text-white/60 transition-colors"
            >
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
