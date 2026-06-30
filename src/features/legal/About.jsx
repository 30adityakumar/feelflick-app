// src/features/legal/About.jsx
// The /about marketing page, rebuilt in the Adaptive Editorial Cinema direction to match
// the new website. A TOP-LEVEL route (outside PublicShell) that owns its own
// <header>/<main id="main">/<footer> as siblings, reusing the SAME shared header
// (SiteHeaderHost), CTA (LandingFinalCTA) and footer (LandingFooter) as the landing for
// consistency. Editorial + product-only; grounded in docs/product-doctrine.md. No
// fabricated stats/claims, no retired copy ("Films That Know You"/"Free Forever"), no
// purple/pink gradients — the .ff-landing tokens + .ff-l-* system carry the look.
import { usePageMeta } from '@/shared/hooks/usePageMeta'
import '../landing/landing.css'
import SiteHeaderHost from '@/app/header/SiteHeaderHost'
import { LandingAuthProvider } from '../landing/LandingAuth'
import LandingFinalCTA from '../landing/components/LandingFinalCTA'
import LandingFooter from '../landing/components/LandingFooter'
import LandingAuthStatus from '../landing/components/LandingAuthStatus'
import { ENTRANCES } from '../landing/data'

const BELIEFS = [
  { title: 'Fewer directions, chosen well.', body: 'We narrow the field to a bounded, personal set instead of handing you another endless shelf to scroll.' },
  { title: 'Reasons you can understand.', body: 'Every personal suggestion comes with the real signals behind it—not a mysterious match score.' },
  { title: 'Taste that keeps evolving.', body: 'Watches, ratings, saves, skips and reactions make the picture more accurate over time—and you can correct it.' },
  { title: 'Private where it should be.', body: 'Your Cinematic DNA, library and preferences stay private. No ads, no data selling.' },
]

export default function About() {
  usePageMeta({
    title: 'About FeelFlick — Movies, made personal.',
    description: 'FeelFlick is a personal movie discovery platform—find films through your taste, your mood and your curiosity, with reasons you can trust.',
    url: 'https://app.feelflick.com/about',
  })

  return (
    <LandingAuthProvider>
      <div className="ff-landing">
        <a href="#main" className="ff-l-skip">Skip to content</a>
        <SiteHeaderHost />
        <main id="main">

          {/* Intro */}
          <section className="ff-l-section ff-l-about-intro" aria-labelledby="ff-l-about-h">
            <div className="ff-l-shell">
              <p className="ff-l-eyebrow">About FeelFlick</p>
              <h1 id="ff-l-about-h" className="ff-l-section-h2">Movies, made <em>personal.</em></h1>
              <p className="ff-l-section-lede">
                FeelFlick is a personal movie discovery platform. It helps you find films
                through your taste, your mood and your curiosity—and always shows the
                reasons behind a suggestion.
              </p>
            </div>
          </section>

          {/* The problem */}
          <section className="ff-l-section" aria-labelledby="ff-l-about-problem-h">
            <header className="ff-l-shell ff-l-section-head">
              <div>
                <p className="ff-l-eyebrow">The problem</p>
                <h2 id="ff-l-about-problem-h" className="ff-l-section-h2">Streaming gives you everything <em>except a decision.</em></h2>
              </div>
              <p>
                Finding something to watch was never the hard part. Choosing is—when every
                app is an endless shelf, the suggestions feel generic, and nothing reflects
                who you are.
              </p>
            </header>
          </section>

          {/* Three ways in — taste, mood, curiosity (the same three modes as the product) */}
          <section className="ff-l-section ff-l-entrances" aria-labelledby="ff-l-about-ways-h">
            <div className="ff-l-shell ff-l-entrances-grid">
              <div className="ff-l-entrances-intro">
                <p className="ff-l-eyebrow">How it works</p>
                <h2 id="ff-l-about-ways-h" className="ff-l-entrances-h2">Three ways in, each kept <em>distinct.</em></h2>
                <p className="ff-l-entrances-lead">
                  Tonight, your taste, or a curiosity—FeelFlick keeps each path its own,
                  instead of forcing every movie question into one feed.
                </p>
              </div>
              <ol className="ff-l-entrance-list">
                {ENTRANCES.map((e) => (
                  <li key={e.n} className="ff-l-entrance">
                    <p className="ff-l-entrance__meta">
                      <span className="ff-l-entrance__n" aria-hidden="true">{e.n}</span>
                      <span className="ff-l-entrance__dest">{e.destination}</span>
                    </p>
                    <h3 className="ff-l-entrance__title">{e.title}</h3>
                    <p className="ff-l-entrance__example">{e.example}</p>
                    <p className="ff-l-entrance__copy">{e.copy}</p>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          {/* Cinematic DNA */}
          <section className="ff-l-section" aria-labelledby="ff-l-about-dna-h">
            <header className="ff-l-shell ff-l-section-head">
              <div>
                <p className="ff-l-eyebrow">Cinematic DNA</p>
                <h2 id="ff-l-about-dna-h" className="ff-l-section-h2">A picture of your taste that <em>keeps evolving.</em></h2>
              </div>
              <p>
                Your Cinematic DNA is a living portrait of the stories, moods, filmmakers
                and styles you respond to—built from your watches, ratings, saves, skips and
                reactions. It stays correctable and always developing, never a fixed label
                or a single compatibility score.
              </p>
            </header>
          </section>

          {/* What we believe */}
          <section className="ff-l-section" aria-labelledby="ff-l-about-believe-h">
            <div className="ff-l-shell">
              <p className="ff-l-eyebrow">What we believe</p>
              <h2 id="ff-l-about-believe-h" className="ff-l-section-h2">Built around a few <em>convictions.</em></h2>
              <ul className="ff-l-about-grid">
                {BELIEFS.map((b) => (
                  <li key={b.title} className="ff-l-card ff-l-about-card">
                    <h3>{b.title}</h3>
                    <p>{b.body}</p>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* CTA — the same canonical "Continue with Google" as the landing */}
          <LandingFinalCTA />
        </main>
        <LandingFooter />
        <LandingAuthStatus />
      </div>
    </LandingAuthProvider>
  )
}
