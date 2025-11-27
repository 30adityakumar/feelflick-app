// src/features/landing/Landing.jsx
import TopNav from '@/features/landing/components/TopNav'
import Footer from '@/features/landing/components/Footer'

// Sections
import HeroSection from '@/features/landing/sections/HeroSection'
import HowItWorksSection from '@/features/landing/sections/HowItWorksSection'
import FeaturesGrid from '@/features/landing/sections/FeaturesGrid'
import TestimonialsSection from '@/features/landing/sections/TestimonialsSection'
import FinalCTASection from '@/features/landing/sections/FinalCTASection'

/**
 * Landing Page - Main entry point for visitors
 * 
 * Structure:
 * - TopNav (fixed, glassmorphism on scroll)
 * - HeroSection (full-screen, animated posters, CTAs)
 * - HowItWorksSection (3 steps, animated)
 * - FeaturesGrid (3 feature cards with floating elements)
 * - TestimonialsSection (3 testimonials, staggered)
 * - FinalCTASection (conversion-optimized CTA)
 * - Footer (links, social, legal)
 * 
 * Performance:
 * - Lazy loading images
 * - IntersectionObserver animations
 * - Optimized scroll handling
 * - GPU-accelerated transforms
 */
export default function Landing() {
  return (
    <div className="relative bg-black text-white min-h-screen overflow-x-hidden">
      {/* Navigation - Fixed at top, z-50 */}
      <TopNav />

      {/* Hero Section - Full viewport height, z-20 */}
      <HeroSection />

      {/* Main Content Sections */}
      <main className="relative bg-black">
        <HowItWorksSection />
        <FeaturesGrid />
        <TestimonialsSection />
        <FinalCTASection />
      </main>

      {/* Footer - Bottom of page, z-10 */}
      <Footer />
    </div>
  )
}