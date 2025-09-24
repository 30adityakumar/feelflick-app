// src/features/landing/Landing.jsx
import { useEffect } from 'react'
import TopNav from '@/features/landing/components/TopNav'
import LandingHero from '@/features/landing/components/LandingHero'
import Footer from '@/features/landing/components/Footer'

export default function Landing() {
  // Lock scroll only on landing
  useEffect(() => {
    const html = document.documentElement.style
    const body = document.body.style
    const prevHtml = html.overflow
    const prevBody = body.overflow
    html.overflow = 'hidden'
    body.overflow = 'hidden'
    return () => {
      html.overflow = prevHtml || ''
      body.overflow = prevBody || ''
    }
  }, [])

  return (
    <>
      <TopNav />

      {/* Viewport minus fixed header; footer lives inside this grid */}
      <main
        id="landing"
        className="grid grid-rows-[1fr_auto] overflow-hidden"
        style={{ height: 'calc(100svh - var(--topnav-h, 72px))' }}
      >
        {/* Hero already subtracts header/footer internally; works fine here */}
        <LandingHero fitToFooter />

        {/* Subtle micro-footer; also sets --footer-h for the hero calc */}
        <Footer variant="micro" subtle />
      </main>
    </>
  )
}