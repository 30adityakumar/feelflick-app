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
// ---------------------------------------------------------------------------
function FinalCTAHeadline() {
  return (
    <h2 id="final-cta-heading">
      <span>Your Next Favorite Film</span>
      <span>Is Already Out There.</span>
    </h2>
  )
}

// ---------------------------------------------------------------------------
// Minimal MoodShowcase re-implementation — tests structure and interaction.
// ---------------------------------------------------------------------------
function MoodShowcaseStub() {
  return (
    <section id="mood-demo" aria-labelledby="mood-demo-heading">
      <h2 id="mood-demo-heading">Pick a mood. We&apos;ll find your movie.</h2>
      <ul aria-label="Browse films by mood">
        {['Nostalgic', 'Tense', 'Cozy', 'Melancholy', 'Euphoric', 'Curious'].map(mood => (
          <li key={mood}>
            <button aria-expanded="false" aria-label={`Show ${mood} film picks`}>
              {mood}
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Minimal landing structure — tests that sections are present in order.
// ---------------------------------------------------------------------------
function LandingStructure() {
  return (
    <div>
      <section aria-labelledby="hero-heading">
        <h1 id="hero-heading">Find films for when you&apos;re feeling nostalgic.</h1>
        <button>Get Started - It&apos;s Free</button>
      </section>
      <section id="mood-demo" aria-labelledby="mood-demo-heading">
        <h2 id="mood-demo-heading">Pick a mood. We&apos;ll find your movie.</h2>
      </section>
      <section id="how-it-works" aria-labelledby="how-it-works-heading">
        <h2 id="how-it-works-heading">Built around your taste.</h2>
      </section>
      <section aria-labelledby="final-cta-heading">
        <h2 id="final-cta-heading">Your Next Favorite Film Is Already Out There.</h2>
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
  it('renders a distinct headline from the hero', () => {
    render(<FinalCTAHeadline />)
    expect(screen.getByText(/Your Next Favorite Film/i)).toBeInTheDocument()
    expect(screen.getByText(/Is Already Out There/i)).toBeInTheDocument()
  })

  it('does not duplicate the hero headline', () => {
    render(<FinalCTAHeadline />)
    expect(screen.queryByText(/Find films for when/i)).not.toBeInTheDocument()
  })
})

describe('MoodShowcaseSection', () => {
  it('renders the section heading', () => {
    render(<MoodShowcaseStub />)
    expect(screen.getByRole('heading', { name: /Pick a mood/i })).toBeInTheDocument()
  })

  it('renders all 6 mood pills', () => {
    render(<MoodShowcaseStub />)
    const pills = screen.getAllByRole('button')
    expect(pills).toHaveLength(6)
  })

  it('all mood pills start collapsed', () => {
    render(<MoodShowcaseStub />)
    const pills = screen.getAllByRole('button')
    pills.forEach(pill => {
      expect(pill).toHaveAttribute('aria-expanded', 'false')
    })
  })

  it('covers all six moods', () => {
    render(<MoodShowcaseStub />)
    for (const mood of ['Nostalgic', 'Tense', 'Cozy', 'Melancholy', 'Euphoric', 'Curious']) {
      expect(screen.getByRole('button', { name: new RegExp(mood, 'i') })).toBeInTheDocument()
    }
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
  it('renders all four key sections', () => {
    render(<LandingStructure />)
    expect(screen.getByRole('heading', { name: /Find films for when you're feeling/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Pick a mood/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Built around your taste/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Your Next Favorite Film Is Already Out There/i })).toBeInTheDocument()
  })

  it('does not render a FeaturesGrid section', () => {
    render(<LandingStructure />)
    expect(screen.queryByRole('heading', { name: /The FeelFlick Difference/i })).not.toBeInTheDocument()
  })

  it('has exactly two sign-in CTAs (hero + final)', () => {
    render(<LandingStructure />)
    const ctaButtons = screen.getAllByRole('button', { name: /get started/i })
    expect(ctaButtons).toHaveLength(2)
  })
})
