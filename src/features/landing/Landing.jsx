// src/features/landing/Landing.jsx
import TopNav from '@/features/landing/components/TopNav'
import Footer from '@/features/landing/components/Footer'
import HeroSection from '@/features/landing/sections/HeroSection'
import HowItWorksSection from '@/features/landing/sections/HowItWorksSection'
import FinalCTASection from '@/features/landing/sections/FinalCTASection'

export default function Landing() {
  return (
    <div className="relative bg-black text-white min-h-screen overflow-x-hidden">
      <TopNav />
      <HeroSection />
      <main className="relative bg-black">
        <HowItWorksSection />
        <FinalCTASection />
      </main>
      <Footer />
    </div>
  )
}