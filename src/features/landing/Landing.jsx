// src/features/landing/Landing.jsx
import { useState, useCallback } from 'react'
import TopNav from '@/features/landing/components/TopNav'
import Footer from '@/features/landing/components/Footer'

// Import all sections
import HeroSection from '@/features/landing/sections/HeroSection'
import ProblemSection from '@/features/landing/sections/ProblemSection'
import HowItWorksSection from '@/features/landing/sections/HowItWorksSection'
import FeaturesGrid from '@/features/landing/sections/FeaturesGrid'
import TestimonialsSection from '@/features/landing/sections/TestimonialsSection'
import FinalCTASection from '@/features/landing/sections/FinalCTASection'

/**
 * 🎬 LANDING PAGE
 * 
 * Complete conversion-optimized flow:
 * Hero → Problem → Solution → Features → Proof → CTA
 */

export default function Landing() {
  const [showInlineAuth, setShowInlineAuth] = useState(false)

  const openInlineAuth = useCallback(() => setShowInlineAuth(true), [])
  const closeInlineAuth = useCallback(() => setShowInlineAuth(false), [])

  return (
    <div className="relative bg-black text-white min-h-screen">
      {/* Navigation */}
      <TopNav onAuthOpen={openInlineAuth} />

      {/* Main Content */}
      <main>
        <HeroSection
          showInlineAuth={showInlineAuth}
          onAuthOpen={openInlineAuth}
          onAuthClose={closeInlineAuth}
        />

        <ProblemSection />

        <HowItWorksSection />

        <FeaturesGrid />

        <TestimonialsSection />

        <FinalCTASection onAuthOpen={openInlineAuth} />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  )
}
