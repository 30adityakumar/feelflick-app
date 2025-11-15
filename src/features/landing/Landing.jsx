// src/features/landing/Landing.jsx
import { useEffect } from 'react'
import TopNav from './components/TopNav'
import LandingHero from './components/LandingHero'
import Footer from './components/Footer'

export default function Landing() {
  useEffect(() => {
    document.title = 'FeelFlick - Movies That Match Your Mood'
    
    // Set meta description
    const metaDescription = document.querySelector('meta[name="description"]')
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Discover movies based on your mood. Build watchlists, track your history, and find the perfect film for how you feel.')
    }
  }, [])

  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden">
      {/* Enhanced Background with FeelFlick Theme */}
      <div aria-hidden className="fixed inset-0 z-0">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-[linear-gradient(120deg,#0a121a_0%,#0d1722_50%,#0c1017_100%)]" />
        
        {/* Orange glow - top left (warmth) */}
        <div className="pointer-events-none absolute -top-40 -left-40 h-[65vmin] w-[65vmin] rounded-full blur-3xl opacity-60 bg-[radial-gradient(closest-side,rgba(254,146,69,0.45),rgba(254,146,69,0)_70%)]" />
        
        {/* Red glow - bottom right (passion) */}
        <div className="pointer-events-none absolute -bottom-44 -right-44 h-[70vmin] w-[70vmin] rounded-full blur-3xl opacity-55 bg-[radial-gradient(closest-side,rgba(235,66,59,0.38),rgba(235,66,59,0)_70%)]" />
        
        {/* Blue glow - center (depth) */}
        <div className="pointer-events-none absolute top-1/2 left-1/2 h-[80vmin] w-[80vmin] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl opacity-45 bg-[radial-gradient(closest-side,rgba(45,119,255,0.35),rgba(45,119,255,0)_70%)]" />
        
        {/* Pink glow - top right (emotion) */}
        <div className="pointer-events-none absolute -top-24 right-[15%] h-[45vmin] w-[45vmin] rounded-full blur-3xl opacity-45 bg-[radial-gradient(closest-side,rgba(255,99,196,0.35),rgba(255,99,196,0)_70%)]" />
        
        {/* Rotating gradient overlay */}
        <div className="pointer-events-none absolute inset-0 opacity-35 mix-blend-screen">
          <div className="absolute left-1/2 top-1/2 h-[140vmin] w-[140vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[conic-gradient(from_220deg_at_50%_50%,rgba(255,255,255,0.08),rgba(255,255,255,0)_65%)] motion-safe:md:animate-[spin_48s_linear_infinite]" />
        </div>
        
        {/* Top vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(100%_80%_at_50%_0%,rgba(255,255,255,0.06),rgba(255,255,255,0)_60%)]" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        <TopNav />
        <main id="main" className="min-h-[calc(100vh-var(--topnav-h,72px)-var(--footer-h,80px))]">
          <LandingHero />
        </main>
        <Footer />
      </div>
    </div>
  )
}
