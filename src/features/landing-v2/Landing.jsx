// src/features/landing/Landing.jsx
import TopNav from '@/features/landing-v2/components/TopNav'
import Footer from '@/features/landing-v2/components/Footer'
import HeroSection from '@/features/landing-v2/sections/HeroSection'
import HowItWorksSection from '@/features/landing-v2/sections/HowItWorksSection'
import CinematicDNASection from '@/features/landing-v2/sections/CinematicDNASection'
import ItLearnsYouSection from '@/features/landing-v2/sections/ItLearnsYouSection'
import FindYourPeopleSection from '@/features/landing-v2/sections/FindYourPeopleSection'
import MoatProofSection from '@/features/landing-v2/sections/MoatProofSection'
import FAQSection from '@/features/landing-v2/sections/FAQSection'
import FinalCTASection from '@/features/landing-v2/sections/FinalCTASection'

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
