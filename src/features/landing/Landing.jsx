// src/features/landing/Landing.jsx
import { useState, useCallback } from 'react'
import TopNav from '@/features/landing/components/TopNav'
import Footer from '@/features/landing/components/Footer'

// 🎬 NEW SECTIONS (we'll build these next)
import HeroSection from '@/features/landing/sections/HeroSection'
import ProblemSection from '@/features/landing/sections/ProblemSection'
import HowItWorksSection from '@/features/landing/sections/HowItWorksSection'
import FeaturesGrid from '@/features/landing/sections/FeaturesGrid'
import TestimonialsSection from '@/features/landing/sections/TestimonialsSection'
import FinalCTASection from '@/features/landing/sections/FinalCTASection'

export default function Landing() {
  const [showInlineAuth, setShowInlineAuth] = useState(false)

  const openInlineAuth = useCallback(() => setShowInlineAuth(true), [])
  const closeInlineAuth = useCallback(() => setShowInlineAuth(false), [])

  return (
    <div className="relative bg-black text-white min-h-screen">
      {/* 
        🎯 Navigation Bar
        - Sticky on scroll
        - Transparent → Solid transition
        - Auth CTA in top right
      */}
      <TopNav onAuthOpen={openInlineAuth} />

      {/* 
        🎬 HOMEPAGE SECTIONS
        Each section is self-contained, responsive, and accessible
        Scroll-triggered animations handled within each component
      */}
      
      {/* 1️⃣ HERO - Cinematic first impression */}
      <HeroSection 
        showInlineAuth={showInlineAuth}
        onAuthOpen={openInlineAuth}
        onAuthClose={closeInlineAuth}
      />

      {/* 2️⃣ PROBLEM - Agitate the pain point */}
      <ProblemSection />

      {/* 3️⃣ HOW IT WORKS - 3-step process */}
      <HowItWorksSection />

      {/* 4️⃣ FEATURES - Key capabilities with metrics */}
      <FeaturesGrid />

      {/* 5️⃣ TESTIMONIALS - Social proof */}
      <TestimonialsSection />

      {/* 6️⃣ FINAL CTA - Conversion closer */}
      <FinalCTASection onAuthOpen={openInlineAuth} />

      {/* 
        🦶 Footer
        - Minimal design
        - Legal links
        - Social media
      */}
      <Footer />
    </div>
  )
}
