// src/features/landing/Landing.jsx
import TopNav from '@/features/landing/components/TopNav'
import Footer from '@/features/landing/components/Footer'

// NEW SECTIONS
import HeroSection from '@/features/landing/sections/HeroSection'
// import ProblemSection from '@/features/landing/sections/ProblemSection'
import HowItWorksSection from '@/features/landing/sections/HowItWorksSection'
import FeaturesGrid from '@/features/landing/sections/FeaturesGrid'
import TestimonialsSection from '@/features/landing/sections/TestimonialsSection'
import FinalCTASection from '@/features/landing/sections/FinalCTASection'

export default function Landing() {
  return (
    // Ensure the main container is relative
    <div className="relative bg-black text-white min-h-screen overflow-x-hidden">
      {/* Navigation - Fixed z-50 */}
      <TopNav />

      {/* Hero - z-0 */}
      
      <main className="relative bg-black">
        <HeroSection />
        <HowItWorksSection />
        <FeaturesGrid />
        <TestimonialsSection />
        <FinalCTASection />
      </main>

      {/* Footer - z-10 */}
      <Footer />
    </div>
  )
}