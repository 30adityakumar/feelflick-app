// src/features/landing/components/Footer.jsx
import { Github, Twitter, Mail } from 'lucide-react'

const SOCIAL_LINKS = [
  {
    name: 'GitHub',
    href: 'https://github.com/feelflick',
    icon: Github,
    label: 'Follow us on GitHub',
  },
  {
    name: 'Twitter',
    href: 'https://twitter.com/feelflick',
    icon: Twitter,
    label: 'Follow us on Twitter',
  },
  {
    name: 'Email',
    href: 'mailto:hello@feelflick.com',
    icon: Mail,
    label: 'Email us',
  },
]

export default function Footer() {
  return (
    <footer className="relative z-10 border-t border-white/5 bg-black/60 backdrop-blur-lg">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-6">
          {/* Social Links */}
          <div className="flex items-center gap-6">
            {SOCIAL_LINKS.map((link) => {
              const Icon = link.icon
              return (
                <a
                  key={link.name}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={link.label}
                  className="grid h-10 w-10 place-items-center rounded-lg text-white/60 transition-all hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                >
                  <Icon className="h-5 w-5" />
                </a>
              )
            })}
          </div>

          {/* Copyright */}
          <p className="text-sm text-white/50">
            © {new Date().getFullYear()} FeelFlick. All rights reserved.
          </p>

          {/* Legal Links (Optional) */}
          <div className="flex items-center gap-6 text-xs text-white/40">
            <a
              href="/privacy"
              className="hover:text-white/60 transition-colors focus:outline-none focus:ring-2 focus:ring-white/50 rounded"
            >
              Privacy Policy
            </a>
            <span>·</span>
            <a
              href="/terms"
              className="hover:text-white/60 transition-colors focus:outline-none focus:ring-2 focus:ring-white/50 rounded"
            >
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
