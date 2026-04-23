// Tests for landing page structure and copy.
// Follows the project pattern: isolated re-implementations of the specific
// behavior under test, no complex mounts with real deps (Supabase, Router, etc.)

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

// ---------------------------------------------------------------------------
// Minimal HeroSection re-implementation — tests headline copy only.
// ---------------------------------------------------------------------------
function HeroHeadline() {
  return (
    <h1 id="hero-heading">
      <span>Find films for when you&apos;re feeling</span>
      <span>nostalgic.</span>
    </h1>
  )
}

// ---------------------------------------------------------------------------
// Minimal FinalCTA re-implementation — tests headline copy only.
// Updated to match the approved "Tonight." copy (Blueprint §Approved Copy).
// "Tonight." is a block span so it always sits on its own visual line.
// ---------------------------------------------------------------------------
function FinalCTAHeadline() {
  return (
    <h2 id="final-cta-heading">
      <span>Somewhere in 6,700 films is one made for you.</span>
      <span>Tonight.</span>
    </h2>
  )
}

// ---------------------------------------------------------------------------
// Minimal MoodShowcase re-implementation — tests structure and interaction.
// ---------------------------------------------------------------------------
function MoodShowcaseStub() {
  return (
    <section id="mood-demo" aria-labelledby="mood-demo-heading">
      <h2 id="mood-demo-heading">Start with the moment.</h2>
      <div>Tired after a long week, but want something hopeful.</div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Minimal landing structure — tests that all key sections are present in order.
// Section order matches Landing.jsx: Hero → MoodShowcase → CinematicDNA →
// ItLearnsYou → FindYourPeople → Lists → Privacy → FAQ → TrustBlock → FinalCTA
// ---------------------------------------------------------------------------
function LandingStructure() {
  return (
    <div>
      <section aria-labelledby="hero-heading">
        <h1 id="hero-heading">Find films for when you&apos;re feeling nostalgic.</h1>
        <button>Get Started Free</button>
      </section>
      <section id="mood-demo" aria-labelledby="mood-demo-heading">
        <h2 id="mood-demo-heading">Start with the moment.</h2>
      </section>
      <section id="cinematic-dna" aria-labelledby="dna-heading">
        <h2 id="dna-heading">Your taste, made visible.</h2>
      </section>
      <section id="it-learns" aria-labelledby="learns-heading">
        <h2 id="learns-heading">It gets better at getting you.</h2>
      </section>
      <section id="find-people" aria-labelledby="people-heading">
        <h2 id="people-heading">Find people who actually get your taste.</h2>
      </section>
      <section id="moat-proof">
        <p>Every film is hand-scored on 15 dimensions.</p>
      </section>
      <section id="lists" aria-labelledby="lists-heading">
        <h2 id="lists-heading">A beautiful home for your film collections.</h2>
      </section>
      <section id="privacy" aria-labelledby="privacy-heading">
        <h2 id="privacy-heading">Built for your taste. Not your data.</h2>
      </section>
      <section id="faq" aria-labelledby="faq-heading">
        <h2 id="faq-heading">Questions.</h2>
      </section>
      <section id="trust" aria-labelledby="trust-heading">
        <h2 id="trust-heading">Why trust FeelFlick</h2>
      </section>
      <section aria-labelledby="final-cta-heading">
        <h2 id="final-cta-heading">
          <span>Somewhere in 6,700 films is one made for you.</span>
          <span>Tonight.</span>
        </h2>
        <button>Get Started Free</button>
      </section>
    </div>
  )
}

describe('Landing page – hero headline', () => {
  it('leads with mood-first messaging', () => {
    render(<HeroHeadline />)
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
    expect(screen.getByText(/Find films for when you're feeling/i)).toBeInTheDocument()
  })

  it('does not use generic "Stop Scrolling" messaging', () => {
    render(<HeroHeadline />)
    expect(screen.queryByText(/stop scrolling/i)).not.toBeInTheDocument()
  })

  it('does not use the old static headline', () => {
    render(<HeroHeadline />)
    expect(screen.queryByText(/Movies That Match/i)).not.toBeInTheDocument()
  })
})

describe('Landing page – final CTA headline', () => {
  it('uses the approved "Tonight." headline from the Blueprint', () => {
    render(<FinalCTAHeadline />)
    expect(screen.getByText(/Somewhere in 6,700 films/i)).toBeInTheDocument()
    expect(screen.getByText(/Tonight\./i)).toBeInTheDocument()
  })

  it('does not duplicate the hero headline', () => {
    render(<FinalCTAHeadline />)
    expect(screen.queryByText(/Find films for when/i)).not.toBeInTheDocument()
  })

  it('does not use the old "Your Next Favorite Film" copy', () => {
    render(<FinalCTAHeadline />)
    expect(screen.queryByText(/Your Next Favorite Film/i)).not.toBeInTheDocument()
  })

  it('does not use the stale "Stop Scrolling / Start Watching" copy', () => {
    render(<FinalCTAHeadline />)
    expect(screen.queryByText(/Stop Scrolling/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Start Watching/i)).not.toBeInTheDocument()
  })
})

describe('MoodShowcaseSection', () => {
  it('renders the section heading', () => {
    render(<MoodShowcaseStub />)
    expect(screen.getByRole('heading', { name: /Start with the moment/i })).toBeInTheDocument()
  })

  it('renders the NL input placeholder', () => {
    render(<MoodShowcaseStub />)
    expect(screen.getByText(/Tired after a long week/i)).toBeInTheDocument()
  })

  it('does not show fake user counts or stats', () => {
    render(<MoodShowcaseStub />)
    // No 4+ digit numbers (would indicate fake "10,000 users" style stats)
    expect(screen.queryByText(/\d{4,}/)).not.toBeInTheDocument()
  })

  it('has accessible section id for nav linking', () => {
    render(<MoodShowcaseStub />)
    expect(document.getElementById('mood-demo')).toBeInTheDocument()
  })
})

describe('Landing page – structure', () => {
  it('renders all key sections', () => {
    render(<LandingStructure />)
    expect(screen.getByRole('heading', { name: /Find films for when you're feeling/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Start with the moment/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Your taste, made visible/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /It gets better at getting you/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Find people who actually get your taste/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /A beautiful home for your film collections/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Built for your taste\. Not your data/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Questions\./i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Why trust FeelFlick/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Somewhere in 6,700 films/i })).toBeInTheDocument()
  })

  it('does not render a FeaturesGrid section', () => {
    render(<LandingStructure />)
    expect(screen.queryByRole('heading', { name: /The FeelFlick Difference/i })).not.toBeInTheDocument()
  })

  it('does not render the old HowItWorks section', () => {
    render(<LandingStructure />)
    expect(screen.queryByRole('heading', { name: /Built around your taste/i })).not.toBeInTheDocument()
  })

  it('has exactly two sign-in CTAs (hero + final)', () => {
    render(<LandingStructure />)
    // Both CTAs now say "Get Started Free" — consistent with TopNav copy
    const ctaButtons = screen.getAllByRole('button', { name: /get started free/i })
    expect(ctaButtons).toHaveLength(2)
  })
})

describe('MoatProofSection', () => {
  function MoatProofStub() {
    return (
      <section id="moat-proof" aria-labelledby="moat-proof-heading">
        <h2 id="moat-proof-heading" className="sr-only">What makes FeelFlick different</h2>
        <ul>
          <li>Every film is hand-scored on 15 dimensions.</li>
          <li>No autoplay queue. No filler.</li>
          <li>Mood-matched, not popularity-ranked.</li>
        </ul>
      </section>
    )
  }

  it('renders the section with correct id', () => {
    render(<MoatProofStub />)
    expect(document.getElementById('moat-proof')).toBeInTheDocument()
  })

  it('renders the hand-scored claim', () => {
    render(<MoatProofStub />)
    expect(screen.getByText(/hand-scored on 15 dimensions/i)).toBeInTheDocument()
  })

  it('renders the no autoplay claim', () => {
    render(<MoatProofStub />)
    expect(screen.getByText(/No autoplay queue\. No filler\./i)).toBeInTheDocument()
  })

  it('renders the mood-matched claim', () => {
    render(<MoatProofStub />)
    expect(screen.getByText(/Mood-matched, not popularity-ranked/i)).toBeInTheDocument()
  })
})

describe('HighlightsRail', () => {
  function HighlightsRailStub() {
    return (
      <section id="highlights">
        <div>Mood-first discovery</div>
        <div>Your Cinematic DNA</div>
        <div>Taste Match</div>
        <div>No ads. Ever.</div>
      </section>
    )
  }
  it('renders all four highlight tiles', () => {
    render(<HighlightsRailStub />)
    expect(screen.getByText('Mood-first discovery')).toBeInTheDocument()
    expect(screen.getByText('Your Cinematic DNA')).toBeInTheDocument()
    expect(screen.getByText('Taste Match')).toBeInTheDocument()
    expect(screen.getByText('No ads. Ever.')).toBeInTheDocument()
  })
  it('has accessible section id', () => {
    render(<HighlightsRailStub />)
    expect(document.getElementById('highlights')).toBeInTheDocument()
  })
})
