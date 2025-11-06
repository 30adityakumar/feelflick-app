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
        - Starts right after TopNav
        - Centers hero content
        - Slightly shifted downward for better visual balance
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
        {/* Hero Centered & Shifted Down */}
        <div
          className="flex-1 grid place-items-center"
          style={{
            transform: 'translateY(5vh)', // 👈 adjust vertical offset (3vh–8vh works best)
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