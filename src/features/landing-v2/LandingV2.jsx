// src/features/landing-v2/LandingV2.jsx
// "Conversational" landing — full-fidelity port of the prototype.
// Mounted at /v2 alongside the existing /landing for side-by-side comparison.
import '@/features/landing-v2/landing-v2.css'

import Footer from '@/features/landing/components/Footer'

import HeroV2          from '@/features/landing-v2/sections/HeroV2'
import HowItWorksV2    from '@/features/landing-v2/sections/HowItWorksV2'
import CinematicDNAV2  from '@/features/landing-v2/sections/CinematicDNAV2'
import DayInLifeV2     from '@/features/landing-v2/sections/DayInLifeV2'
import VsScrollingV2   from '@/features/landing-v2/sections/VsScrollingV2'
import LearnsCardV2    from '@/features/landing-v2/sections/LearnsCardV2'
import SampleGalleryV2 from '@/features/landing-v2/sections/SampleGalleryV2'
import TasteMatchV2    from '@/features/landing-v2/sections/TasteMatchV2'
import PrivacyV2       from '@/features/landing-v2/sections/PrivacyV2'
import FAQV2           from '@/features/landing-v2/sections/FAQV2'
import FinalCTAV2      from '@/features/landing-v2/sections/FinalCTAV2'

export default function LandingV2() {
  // HeroV2 has its own integrated nav (mood-reactive, gradient-on-glass).
  // We intentionally don't render the global <TopNav /> here — it would
  // double-stack and clash with the hero's blur. Footer is kept.
  return (
    <div className="landing-v2 relative bg-black text-white min-h-screen overflow-x-hidden">
      <main>
        <HeroV2 />
        <HowItWorksV2 />
        <CinematicDNAV2 />
        <DayInLifeV2 />
        <VsScrollingV2 />
        <LearnsCardV2 />
        <SampleGalleryV2 />
        <TasteMatchV2 />
        <PrivacyV2 />
        <FAQV2 />
        <FinalCTAV2 />
      </main>
      <Footer />
    </div>
  )
}
