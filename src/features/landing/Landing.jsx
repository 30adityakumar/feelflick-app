// src/features/landing/Landing.jsx
import TopNav from '@/features/landing/components/TopNav'
import LandingHero from '@/features/landing/components/LandingHero'
import Footer from '@/features/landing/components/Footer'

export default function Landing() {
  return (
    <>
      <TopNav />
      {/* Fill the viewport below the fixed TopNav */}
      <main
        id="landing"
        className="relative mx-auto w-full overflow-hidden"
        style={{ height: 'calc(100svh - var(--topnav-h, 72px))' }}
      >
        {/* 1 row for hero, 1 row for footer = no extra space, no scroll */}
        <div className="grid h-full grid-rows-[1fr_auto]">
          <LandingHero embedded />
          <Footer />
        </div>
      </main>
    </>
  )
}