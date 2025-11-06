// src/features/landing/Landing.jsx
import { useState, useCallback } from 'react'
import TopNav from '@/features/landing/components/TopNav'
import LandingHero from '@/features/landing/components/LandingHero'
import Footer from '@/features/landing/components/Footer'

export default function Landing() {
  const [showInlineAuth, setShowInlineAuth] = useState(false)

  const openInlineAuth = useCallback(() => setShowInlineAuth(true), [])
  const closeInlineAuth = useCallback(() => setShowInlineAuth(false), [])

  return (
    <>
      <TopNav onAuthOpen={openInlineAuth} />

      {/* 
        Layout:
        - Starts below TopNav (paddingTop)
        - Centers hero vertically in remaining viewport
        - Adds subtle downward shift for better balance
      */}
      <main
        id="landing"
        className="relative mx-auto w-full overflow-hidden flex flex-col"
        style={{
          paddingTop: 'var(--topnav-h, 72px)',
          paddingBottom: 'var(--footer-h, 0px)',
          minHeight: 'calc(100svh - var(--topnav-h, 72px))'
        }}
      >
        {/* Hero section: centered + slightly lower for balance */}
        <div
          className="flex-1 grid place-items-center"
          style={{
            transform: 'translateY(6vh)', // 👈 adjust this for exact visual balance (try 5–8vh)
          }}
        >
          <LandingHero
            embedded
            showInlineAuth={showInlineAuth}
            onAuthOpen={openInlineAuth}
            onAuthClose={closeInlineAuth}
          />
        </div>

        <Footer />
      </main>
    </>
  )
}