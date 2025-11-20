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
    <div className="relative bg-black text-white min-h-screen">
      {/* Navigation */}
      <TopNav />

      {/* All Homepage Sections */}
      <HeroSection />
      
      <HowItWorksSection />
      
      <FeaturesGrid />
      
      <TestimonialsSection />
      
      <FinalCTASection />

      {/* Footer */}
      <Footer />
    </div>
  )
}
