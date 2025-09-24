// src/features/landing/Landing.jsx
import TopNav from '@/features/landing/components/TopNav'
import LandingHero from '@/features/landing/components/LandingHero'
import Footer from '@/features/landing/components/Footer'

export default function Landing() {
  return (
    <>
      <TopNav />

      {/* Viewport area below fixed TopNav */}
      <main
        id="landing"
        className="relative grid w-full overflow-hidden grid-rows-[1fr_auto] min-h-0"
        style={{ height: 'calc(100svh - var(--topnav-h, 72px))' }}
      >
        {/* Row 1: hero must be allowed to shrink/grow -> min-h-0 wrapper */}
        <div className="min-h-0">
          <LandingHero embedded />
        </div>

        {/* Row 2: footer pinned to bottom, no extra space */}
        <Footer />
      </main>
    </>
  )
}