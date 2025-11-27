// src/features/landing/components/Footer.jsx
import { useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Instagram, Heart } from 'lucide-react'

/**
 * Custom TikTok Icon (lucide-react doesn't have it yet)
 */
const TikTokIcon = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
  </svg>
)

/**
 * Premium Footer Component
 * 
 * Features:
 * - Responsive grid layout
 * - Smooth scroll to sections
 * - Social media links with hover effects
 * - Auto-updating copyright year
 * - Accessible link navigation
 * - CSS variable for height
 */
export default function Footer() {
  const location = useLocation()
  const navigate = useNavigate()
  const barRef = useRef(null)

  // Don't show footer on onboarding pages
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

  const scrollToSection = (sectionId) => {
    const doScroll = () => {
      const element = document.getElementById(sectionId)
      if (element) {
        const offset = 80
        const elementPosition = element.getBoundingClientRect().top + window.scrollY
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
      className="relative bg-black pt-20 pb-10 overflow-hidden border-t border-white/10"
      role="contentinfo"
    >
      {/* Glow effect at top */}
      <div 
        className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent blur-sm"
        aria-hidden="true"
      />

      <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-16 mb-16">
          
          {/* Brand Column */}
          <div className="md:col-span-5 space-y-6">
            <Link 
              to="/" 
              className="inline-block group" 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              aria-label="FeelFlick home"
            >
              <span className="font-black text-2xl tracking-tighter bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 bg-clip-text text-transparent bg-[length:200%_auto] group-hover:animate-gradient">
                FEELFLICK
              </span>
            </Link>
            <p className="text-white/60 text-sm leading-relaxed max-w-sm">
              Your mood, your movie. Discover the perfect film for every moment with our emotion-based recommendation engine.
            </p>
            <div className="flex gap-4" role="list" aria-label="Social media links">
              <SocialLink 
                href="https://instagram.com/feelflick" 
                icon={Instagram} 
                label="Instagram"
              />
              <SocialLink 
                href="https://tiktok.com/@feelflick" 
                icon={TikTokIcon} 
                label="TikTok"
              />
            </div>
          </div>

          {/* Links Grid */}
          <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8">
            
            {/* Product */}
            <div>
              <h3 className="text-white font-bold text-sm tracking-wide mb-4">
                Product
              </h3>
              <ul className="space-y-3" role="list">
                <li>
                  <FooterLink onClick={() => scrollToSection('features')}>
                    Features
                  </FooterLink>
                </li>
                <li>
                  <FooterLink onClick={() => scrollToSection('how-it-works')}>
                    How it Works
                  </FooterLink>
                </li>
                <li>
                  <FooterLink onClick={() => scrollToSection('testimonials')}>
                    Stories
                  </FooterLink>
                </li>
                <li>
                  <FooterLink to="/browse">
                    Browse Movies
                  </FooterLink>
                </li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="text-white font-bold text-sm tracking-wide mb-4">
                Company
              </h3>
              <ul className="space-y-3" role="list">
                <li>
                  <FooterLink to="/about">
                    About Us
                  </FooterLink>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="text-white font-bold text-sm tracking-wide mb-4">
                Legal
              </h3>
              <ul className="space-y-3" role="list">
                <li>
                  <FooterLink to="/privacy">
                    Privacy Policy
                  </FooterLink>
                </li>
                <li>
                  <FooterLink to="/terms">
                    Terms of Service
                  </FooterLink>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-white/40 text-xs">
            &copy; {year} FeelFlick. All rights reserved.
          </p>
          <p className="text-white/30 text-[10px] flex items-center gap-1">
            <span>Made with</span>
            <Heart className="w-3 h-3 text-pink-500 fill-pink-500" aria-label="love" />
            <span>for movie lovers</span>
          </p>
        </div>
      </div>
    </footer>
  )
}

/**
 * Footer link component with hover animation
 */
function FooterLink({ to, onClick, children }) {
  if (onClick) {
    return (
      <button 
        onClick={onClick}
        className="group relative text-white/60 hover:text-white text-sm transition-colors duration-200 text-left inline-block"
      >
        {children}
        <span 
          className="absolute bottom-0 left-0 w-0 h-px bg-gradient-to-r from-purple-500 to-pink-500 group-hover:w-full transition-all duration-300"
          aria-hidden="true"
        />
      </button>
    )
  }
  
  return (
    <Link 
      to={to} 
      className="group relative text-white/60 hover:text-white text-sm transition-colors duration-200 inline-block"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
    >
      {children}
      <span 
        className="absolute bottom-0 left-0 w-0 h-px bg-gradient-to-r from-purple-500 to-pink-500 group-hover:w-full transition-all duration-300"
        aria-hidden="true"
      />
    </Link>
  )
}

/**
 * Social media link with icon
 */
function SocialLink({ href, icon: Icon, label }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Follow FeelFlick on ${label}`}
      className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all hover:scale-110 group touch-target"
      role="listitem"
    >
      <Icon 
        className="h-5 w-5 transition-transform group-hover:-rotate-12" 
        aria-hidden="true"
      />
    </a>
  )
}