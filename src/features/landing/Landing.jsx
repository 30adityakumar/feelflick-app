import TopNav from '@/features/landing/components/TopNav'
import LandingHero from '@/features/landing/components/LandingHero'
import Footer from '@/features/landing/components/Footer'

export default function Landing() {
  return (
    <>
      <TopNav />

      {/* Viewport below fixed TopNav; no scroll */}
      <main
        id="landing"
        className="relative mx-auto w-full overflow-hidden"
        style={{ height: 'calc(100svh - var(--topnav-h, 72px))' }}
      >
        {/* 1: hero (fills)  2: footer (auto) */}
        <div className="grid h-full grid-rows-[1fr_auto]">
          {/* Center hero perfectly */}
          <div className="flex items-center justify-center">
            <LandingHero embedded centered />
          </div>

          {/* Transparent micro footer sits flush at the bottom */}
          <Footer variant="micro" />
        </div>
      </main>
    </>
  )
}