// src/features/landing/Landing.jsx
import TopNav from '@/components/layout/TopNav'
import Footer from '@/components/layout/Footer'
import HeroSection from '@/legacy/landing/sections/HeroSection'
import HowItWorksSection from '@/legacy/landing/sections/HowItWorksSection'
import CinematicDNASection from '@/legacy/landing/sections/CinematicDNASection'
import ItLearnsYouSection from '@/legacy/landing/sections/ItLearnsYouSection'
import FindYourPeopleSection from '@/legacy/landing/sections/FindYourPeopleSection'
import MoatProofSection from '@/legacy/landing/sections/MoatProofSection'
import FAQSection from '@/legacy/landing/sections/FAQSection'
import FinalCTASection from '@/legacy/landing/sections/FinalCTASection'

export default function Landing() {
  return (
    <div className="relative bg-black text-white min-h-screen overflow-x-hidden">
      <TopNav />
      <main>
        <HeroSection />
        <HowItWorksSection />
        <CinematicDNASection />
        <ItLearnsYouSection />
        <FindYourPeopleSection />
        <MoatProofSection />
        <FAQSection />
        <FinalCTASection />
      </main>
      <Footer />
    </div>
  )
}
