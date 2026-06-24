// src/features/landing/Landing.jsx
// Anonymous public landing (route "/"). Now a TOP-LEVEL route (outside PublicShell),
// so it owns its own <header> / <main id="main"> / <footer> as siblings. Fully
// deterministic (no day/time greeting, no product fetch); one shared OAuth authority.
import { usePageMeta } from '@/shared/hooks/usePageMeta'
import './landing.css'
import { LandingAuthProvider } from './LandingAuth'
import LandingHeader from './components/LandingHeader'
import LandingHero from './components/LandingHero'
import PrinciplesStrip from './components/PrinciplesStrip'
import ProductEntrances from './components/ProductEntrances'
import FilmFilePreview from './components/FilmFilePreview'
import DnaPreview from './components/DnaPreview'
import LibraryPreview from './components/LibraryPreview'
import PeopleControlPreview from './components/PeopleControlPreview'
import TrustStrip from './components/TrustStrip'
import LandingFinalCTA from './components/LandingFinalCTA'
import LandingFooter from './components/LandingFooter'
import LandingAuthStatus from './components/LandingAuthStatus'

export default function Landing() {
  usePageMeta({
    title: 'FeelFlick — Movies, made personal.',
    description: 'Personal movie discovery built around your taste, your moment, and your curiosity.',
    url: 'https://app.feelflick.com/',
  })

  return (
    <LandingAuthProvider>
      <div className="ff-landing">
        <a href="#main" className="ff-l-skip">Skip to content</a>
        <LandingHeader />
        <main id="main">
          <LandingHero />
          <PrinciplesStrip />
          <ProductEntrances />
          <FilmFilePreview />
          <DnaPreview />
          <LibraryPreview />
          <PeopleControlPreview />
          <TrustStrip />
          <LandingFinalCTA />
        </main>
        <LandingFooter />
        <LandingAuthStatus />
      </div>
    </LandingAuthProvider>
  )
}
