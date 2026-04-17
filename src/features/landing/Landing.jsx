// src/features/landing/Landing.jsx
import TopNav from '@/features/landing/components/TopNav'
import Footer from '@/features/landing/components/Footer'
import HeroSection from '@/features/landing/sections/HeroSection'
import MoodShowcaseSection from '@/features/landing/sections/MoodShowcaseSection'
import CinematicDNASection from '@/features/landing/sections/CinematicDNASection'
import ItLearnsYouSection from '@/features/landing/sections/ItLearnsYouSection'
import FindYourPeopleSection from '@/features/landing/sections/FindYourPeopleSection'
import FAQSection from '@/features/landing/sections/FAQSection'
import FinalCTASection from '@/features/landing/sections/FinalCTASection'

export default function Landing() {
  return (
    <div className="relative bg-black text-white min-h-screen overflow-x-hidden">
      <TopNav />
      <main>
        <HeroSection />
        <MoodShowcaseSection />
        <CinematicDNASection />
        <ItLearnsYouSection />
        <FindYourPeopleSection />
        <FAQSection />
        <FinalCTASection />
      </main>
      <Footer />
    </div>
  )
}
