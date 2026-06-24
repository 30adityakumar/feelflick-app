// src/features/landing/components/LandingHero.jsx
import { useLandingAuth } from '../LandingAuth'
import CinemaRibbon from './CinemaRibbon'

export default function LandingHero() {
  const { startGoogleAuth, isAuthenticating } = useLandingAuth()
  return (
    <section className="ff-l-hero" id="top">
      <div className="ff-l-shell ff-l-hero-copy">
        <p className="ff-l-eyebrow ff-l-hero-eyebrow">Personal movie discovery</p>
        <h1 className="ff-l-hero-h1">Movies, <em>made personal.</em></h1>
        <p className="ff-l-hero-deck">
          FeelFlick learns your taste, helps shape tonight around the moment, and shows
          its reasoning—then remembers how the film landed.
        </p>
        <div className="ff-l-hero-actions">
          <button type="button" className="ff-l-btn ff-l-btn--primary ff-l-btn--lg" onClick={startGoogleAuth} disabled={isAuthenticating}>
            {isAuthenticating ? 'Opening Google…' : 'Start with Google'}
          </button>
          <a className="ff-l-btn ff-l-btn--ghost ff-l-btn--lg" href="#how-it-works">See how it works</a>
        </div>
        <ul className="ff-l-hero-proof">
          <li><i aria-hidden="true" />Free to start</li>
          <li><i aria-hidden="true" />No ads</li>
          <li><i aria-hidden="true" />Private, with direct controls</li>
        </ul>
      </div>
      <CinemaRibbon />
    </section>
  )
}
