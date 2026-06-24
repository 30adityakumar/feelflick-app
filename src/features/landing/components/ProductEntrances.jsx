// src/features/landing/components/ProductEntrances.jsx
// Three product entrances — non-interactive explanatory cards (not route buttons:
// Home is not anonymously reachable, so no broken nav). A single Start CTA follows.
import { ENTRANCES } from '../data'
import { useLandingAuth } from '../LandingAuth'

export default function ProductEntrances() {
  const { startGoogleAuth, isAuthenticating } = useLandingAuth()
  return (
    <section className="ff-l-section ff-l-entrances" id="how-it-works" aria-labelledby="ff-l-entrances-h">
      <div className="ff-l-shell">
        <header className="ff-l-section-head">
          <div>
            <p className="ff-l-eyebrow">Three ways in</p>
            <h2 id="ff-l-entrances-h" className="ff-l-section-h2">A different path for <em>every kind of choice.</em></h2>
          </div>
          <p>FeelFlick does not force every movie question into one feed. Discover, Home and Browse each preserve a different kind of intent.</p>
        </header>
        <ul className="ff-l-entrance-list">
          {ENTRANCES.map((e) => (
            <li key={e.n} className="ff-l-entrance">
              <span className="ff-l-entrance__n" aria-hidden="true">{e.n}</span>
              <div className="ff-l-entrance__body">
                <h3 className="ff-l-entrance__title">{e.title}</h3>
                <p className="ff-l-entrance__example">{e.example}</p>
                <p className="ff-l-entrance__copy">{e.copy} <span className="ff-l-entrance__maps">In {e.maps}.</span></p>
              </div>
            </li>
          ))}
        </ul>
        <div className="ff-l-entrances-cta">
          <button type="button" className="ff-l-btn ff-l-btn--primary" onClick={startGoogleAuth} disabled={isAuthenticating}>
            {isAuthenticating ? 'Opening Google…' : 'Start with Google'}
          </button>
        </div>
      </div>
    </section>
  )
}
