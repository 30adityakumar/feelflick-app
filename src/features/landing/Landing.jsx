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
        Layout improvements:
        - Starts right after TopNav but with a little extra top spacing for balance
        - Keeps footer spacing and full-height centering intact
      */}
      <main
        id="landing"
        className="relative mx-auto w-full overflow-hidden flex flex-col"
        style={{
          // 👇 slightly increase top spacing (adds ~4vh visual balance)
          paddingTop: 'calc(var(--topnav-h, 72px) + 4vh)',
          paddingBottom: 'var(--footer-h, 0px)',
          minHeight: 'calc(100svh - var(--topnav-h, 72px))'
        }}
      >
        {/* Center the hero in the available area below TopNav */}
        <div className="flex-1 grid place-items-center">
          <LandingHero
            embedded
            showInlineAuth={showInlineAuth}
            onAuthOpen={openInlineAuth}
            onAuthClose={closeInlineAuth}
          />
        </div>

        {/* Fixed footer still computes --footer-h for correct bottom padding */}
        <Footer />
      </main>
    </>
  )
}