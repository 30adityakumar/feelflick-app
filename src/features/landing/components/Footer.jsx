// src/features/landing/components/Footer.jsx
import { useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Twitter, Instagram, Youtube } from 'lucide-react'

export default function Footer() {
  const location = useLocation()
  const navigate = useNavigate()
  const barRef = useRef(null)

  if (location.pathname.startsWith('/onboarding')) {
    return null
  }

  useEffect(() => {
    const setVar = () => {
      const h = barRef.current?.offsetHeight || 80
      document.documentElement.style.setProperty('--footer-h', `${h}px`)
    }
    setVar()
    const ro = new ResizeObserver(setVar)
    if (barRef.current) ro.observe(barRef.current)
    return () => ro.disconnect()
  }, [])

  const year = new Date().getFullYear()

  const scrollToSection = (sectionId) => {
    const doScroll = () => {
      const element = document.getElementById(sectionId)
      if (element) {
        const offset = 80
        const elementPosition =
          element.getBoundingClientRect().top + window.scrollY
        window.scrollTo({
          top: elementPosition - offset,
          behavior: 'smooth',
        })
      }
    }

    if (location.pathname !== '/') {
      navigate('/')
      setTimeout(doScroll, 100)
    } else {
      doScroll()
    }
  }

  return (
    <footer
      ref={barRef}
      className="relative bg-black border-t-0 py-8 sm:py-12 overflow-hidden"
    >
      {/* Top gradient border for flair */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-amber-500 opacity-60" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-1">
            <Link
              to="/"
              onClick={(e) => {
                e.preventDefault()
                if (location.pathname === '/') {
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                } else {
                  navigate('/')
                  setTimeout(
                    () =>
                      window.scrollTo({
                        top: 0,
                        behavior: 'auto',
                      }),
                    0,
                  )
                }
              }}
              className="group inline-block mb-3 transition-transform hover:scale-105"
            >
              <span className="text-2xl font-black tracking-tight bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                FEELFLICK
              </span>
            </Link>
            {/* Accent bar */}
            <div className="w-16 h-1 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 mb-4" />

            <p className="text-sm text-white/60 leading-relaxed mb-4">
              Find movies that match your mood in under a minute. AI-powered discovery that feels human.
            </p>
            <div className="flex items-center gap-3">
              <SocialLink
                href="https://twitter.com"
                icon={<Twitter className="w-4 h-4" />}
                label="Twitter"
              />
              <SocialLink
                href="https://instagram.com"
                icon={<Instagram className="w-4 h-4" />}
                label="Instagram"
              />
              <SocialLink
                href="https://youtube.com"
                icon={<Youtube className="w-4 h-4" />}
                label="YouTube"
              />
            </div>
          </div>

          <FooterSection
            title="Product"
            links={[
              { text: 'How It Works', action: () => scrollToSection('how-it-works') },
              { text: 'Features', action: () => scrollToSection('features') },
              { text: 'Reviews', action: () => scrollToSection('testimonials') },
              { text: 'Pricing', to: '/pricing' },
            ]}
          />
          <FooterSection
            title="Company"
            links={[
              { text: 'About Us', to: '/about' },
              { text: 'Blog', to: '/blog' },
              { text: 'Careers', to: '/careers' },
              { text: 'Contact', to: '/contact' },
            ]}
          />
          <FooterSection
            title="Legal"
            links={[
              { text: 'Privacy Policy', to: '/privacy' },
              { text: 'Terms of Service', to: '/terms' },
              { text: 'Cookie Policy', to: '/cookies' },
              { text: 'DMCA', to: '/dmca' },
            ]}
          />
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-white/50">
            © {year} FeelFlick. All rights reserved.
          </p>
          <p className="text-xs text-white/40">
            Made with 💜 for movie lovers everywhere.
          </p>
        </div>
      </div>
    </footer>
  )
}

function FooterSection({ title, links }) {
  return (
    <div>
      <h3 className="text-sm font-bold text-white mb-4">{title}</h3>
      <ul className="space-y-2">
        {links.map((link, idx) =>
          link.action ? (
            <li key={idx}>
              <button
                onClick={link.action}
                className="text-sm text-white/60 hover:text-white transition-colors inline-block border-b-2 border-transparent hover:border-pink-400 pb-0.5"
              >
                {link.text}
              </button>
            </li>
          ) : (
            <li key={idx}>
              <Link
                to={link.to}
                className="text-sm text-white/60 hover:text-white transition-colors inline-block border-b-2 border-transparent hover:border-pink-400 pb-0.5"
              >
                {link.text}
              </Link>
            </li>
          )
        )}
      </ul>
    </div>
  )
}

function SocialLink({ href, icon, label }) {
  return (
    <a
      href={href}
      aria-label={label}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/5 text-white/60 hover:bg-gradient-to-br hover:from-purple-500 hover:to-pink-500 hover:text-white transition-all duration-300 hover:scale-110"
    >
      {icon}
    </a>
  )
}
