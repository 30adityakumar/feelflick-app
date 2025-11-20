// src/features/landing/components/Footer.jsx
import { useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Twitter, Instagram, Youtube } from 'lucide-react'

/**
 * 🎬 FOOTER
 * 
 * Premium footer with gradient branding
 */
export default function Footer() {
  const location = useLocation()
  const navigate = useNavigate()
  const barRef = useRef(null)

  // Hide on onboarding
  if (location.pathname.startsWith('/onboarding')) {
    return null
  }

  // Set CSS variable for footer height
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

  // Smooth scroll to section
  const scrollToSection = (sectionId) => {
    if (location.pathname !== '/') {
      navigate('/')
      setTimeout(() => {
        const element = document.getElementById(sectionId)
        if (element) {
          const offset = 80
          const elementPosition = element.getBoundingClientRect().top + window.scrollY
          window.scrollTo({ top: elementPosition - offset, behavior: 'smooth' })
        }
      }, 100)
    } else {
      const element = document.getElementById(sectionId)
      if (element) {
        const offset = 80
        const elementPosition = element.getBoundingClientRect().top + window.scrollY
        window.scrollTo({ top: elementPosition - offset, behavior: 'smooth' })
      }
    }
  }

  return (
    <footer
      ref={barRef}
      className="relative bg-black border-t border-white/10 py-12 sm:py-16"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          {/* Brand Column */}
          <div className="md:col-span-1">
            <Link
              to="/"
              onClick={(e) => {
                e.preventDefault()
                if (location.pathname === '/') {
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                } else {
                  navigate('/')
                  setTimeout(() => window.scrollTo({ top: 0, behavior: 'auto' }), 0)
                }
              }}
              className="group inline-block mb-4 transition-transform hover:scale-105"
            >
              <span className="text-2xl font-black tracking-tight bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                FEELFLICK
              </span>
            </Link>
            
            <p className="text-sm text-white/60 leading-relaxed mb-4">
              Find movies you'll love in 60 seconds. AI-powered recommendations for your unique taste.
            </p>

            {/* Social Links */}
            <div className="flex items-center gap-3">
              <SocialLink href="https://twitter.com/feelflick" icon={<Twitter className="w-4 h-4" />} />
              <SocialLink href="https://instagram.com/feelflick" icon={<Instagram className="w-4 h-4" />} />
              <SocialLink href="https://youtube.com/@feelflick" icon={<Youtube className="w-4 h-4" />} />
            </div>
          </div>

          {/* Product Column */}
          <div>
            <h3 className="text-sm font-bold text-white mb-4">Product</h3>
            <ul className="space-y-2">
              <FooterLink onClick={() => scrollToSection('how-it-works')}>
                How It Works
              </FooterLink>
              <FooterLink onClick={() => scrollToSection('features')}>
                Features
              </FooterLink>
              <FooterLink onClick={() => scrollToSection('testimonials')}>
                Reviews
              </FooterLink>
              <FooterLink to="/pricing">Pricing</FooterLink>
            </ul>
          </div>

          {/* Company Column */}
          <div>
            <h3 className="text-sm font-bold text-white mb-4">Company</h3>
            <ul className="space-y-2">
              <FooterLink to="/about">About Us</FooterLink>
              <FooterLink to="/blog">Blog</FooterLink>
              <FooterLink to="/careers">Careers</FooterLink>
              <FooterLink to="/contact">Contact</FooterLink>
            </ul>
          </div>

          {/* Legal Column */}
          <div>
            <h3 className="text-sm font-bold text-white mb-4">Legal</h3>
            <ul className="space-y-2">
              <FooterLink to="/privacy">Privacy Policy</FooterLink>
              <FooterLink to="/terms">Terms of Service</FooterLink>
              <FooterLink to="/cookies">Cookie Policy</FooterLink>
              <FooterLink to="/dmca">DMCA</FooterLink>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-white/50">
            © {year} FeelFlick. All rights reserved.
          </p>
          
          <p className="text-xs text-white/40">
            Made with 💜 for movie lovers
          </p>
        </div>
      </div>
    </footer>
  )
}

/**
 * Footer Link Component
 */
function FooterLink({ to, onClick, children }) {
  if (onClick) {
    return (
      <li>
        <button
          onClick={onClick}
          className="text-sm text-white/60 hover:text-white transition-colors inline-block text-left"
        >
          {children}
        </button>
      </li>
    )
  }
  
  return (
    <li>
      <Link
        to={to}
        className="text-sm text-white/60 hover:text-white transition-colors inline-block"
      >
        {children}
      </Link>
    </li>
  )
}

/**
 * Social Link Component
 */
function SocialLink({ href, icon }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/5 text-white/60 hover:bg-gradient-to-br hover:from-purple-500 hover:to-pink-500 hover:text-white transition-all duration-300 hover:scale-110"
    >
      {icon}
    </a>
  )
}
