import { useEffect } from 'react'
import TopNav from '@/features/landing/components/TopNav'
import LandingHero from '@/features/landing/components/LandingHero'
import Footer from '@/features/landing/components/Footer'

export default function Landing() {
  // Lock scroll only on landing
  useEffect(() => {
    const { style: html } = document.documentElement
    const { style: body } = document.body
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
      {/* Fixed header (already measures --topnav-h) */}
      <TopNav />

      {/* Main section occupies the **visible** viewport, no scroll */}
      <main id="landing" className="h-[100svh]">
        {/* Hero height is computed as 100svh - header - footer */}
        <LandingHero fitToFooter />
      </main>

      {/* Subtle micro footer; measures --footer-h automatically */}
      <Footer variant="micro" subtle />
    </>
  )
}