// src/features/landing/components/LandingFinalCTA.jsx
import { useLandingAuth } from '../LandingAuth'

export default function LandingFinalCTA() {
  const { startGoogleAuth, isAuthenticating } = useLandingAuth()
  return (
    <section className="ff-l-final" aria-labelledby="ff-l-final-h">
      <div className="ff-l-shell">
        <p className="ff-l-eyebrow ff-l-final-eyebrow">Start with a short taste conversation</p>
        <h2 id="ff-l-final-h" className="ff-l-final-h">Build a cinema that <em>learns with you.</em></h2>
        <p className="ff-l-final-deck">
          Begin with five films, then let your watches, ratings, saves, skips and
          reactions sharpen the picture.
        </p>
        <div className="ff-l-final-actions">
          <button type="button" className="ff-l-btn ff-l-btn--primary ff-l-btn--lg" onClick={startGoogleAuth} disabled={isAuthenticating}>
            {isAuthenticating ? 'Opening Google…' : 'Continue with Google'}
          </button>
        </div>
      </div>
    </section>
  )
}
