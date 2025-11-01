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
      <main
        id="landing"
        className="relative mx-auto w-full overflow-hidden"
        style={{ height: 'calc(100svh - var(--topnav-h, 72px))' }}
      >
        <div className="grid h-full min-h-0 grid-rows-[1fr_auto]">
          <LandingHero
            embedded
            showInlineAuth={showInlineAuth}
            onAuthOpen={openInlineAuth}
            onAuthClose={closeInlineAuth}
          />
          <Footer />
        </div>
      </main>
    </>
  )
}