import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

import PrimaryCaseCard from '../PrimaryCaseCard'

const HEADER = {
  eyebrow: 'Why this fits you',
  headline: 'Signals from your library.',
  rationale: 'Mood overlap and runtime patterns, pulled from what you have actually watched.',
}

describe('PrimaryCaseCard — tier-aware lead case (F6B)', () => {
  it('Tier 1: leads with the ff_take editorial hook + match gloss', () => {
    render(
      <PrimaryCaseCard
        ffTake={{ body: 'A class war told as a home invasion.', byline: 'FeelFlick take' }}
        whyHeader={HEADER}
        matchPct={94}
        signedIn
      />,
    )
    expect(screen.getByText('A class war told as a home invasion.')).toBeInTheDocument()
    expect(screen.getByText(/feelflick take/i)).toBeInTheDocument()
    expect(screen.getByText('94%')).toBeInTheDocument()
    expect(screen.getByText(/how it fits your taste so far/i)).toBeInTheDocument()
  })

  it('Tier 2/3: falls back to the adaptive whyHeader rationale — never fabricates', () => {
    render(<PrimaryCaseCard ffTake={null} whyHeader={HEADER} matchPct={null} signedIn />)
    expect(screen.getByText(HEADER.rationale)).toBeInTheDocument()
    expect(screen.getByText(/why this fits you/i)).toBeInTheDocument()
    // No match number when the engine produced none.
    expect(screen.queryByText(/how it fits your taste so far/i)).not.toBeInTheDocument()
  })

  it('renders descriptive mood/fit chips from existing data', () => {
    render(
      <PrimaryCaseCard ffTake={null} whyHeader={HEADER} matchPct={null} moodTags={['tense']} fitProfile="prestige_drama" signedIn />,
    )
    expect(screen.getByText('Tense')).toBeInTheDocument()
    expect(screen.getByText('Prestige drama')).toBeInTheDocument()
  })

  it('nudges anonymous users toward the personal fit', () => {
    render(<PrimaryCaseCard ffTake={{ body: 'A tense ride.' }} whyHeader={HEADER} matchPct={null} signedIn={false} />)
    expect(screen.getByText(/sign in and rate/i)).toBeInTheDocument()
  })

  it('self-hides only when there is genuinely no case', () => {
    const { container } = render(<PrimaryCaseCard ffTake={null} whyHeader={{ rationale: '' }} matchPct={null} />)
    expect(container).toBeEmptyDOMElement()
  })
})

// F5.2 render-contract pins (current behavior — F5.4 will change match presentation).
describe('PrimaryCaseCard — current render contract (pre-F5.4)', () => {
  it('uses the default byline when ff_take has none', () => {
    render(<PrimaryCaseCard ffTake={{ body: 'A quiet stunner.' }} whyHeader={HEADER} signedIn />)
    expect(screen.getByText('FeelFlick’s read')).toBeInTheDocument()
  })

  it('generated ff_take wins over the adaptive rationale (rationale not shown)', () => {
    render(<PrimaryCaseCard ffTake={{ body: 'A class war.' }} whyHeader={HEADER} matchPct={90} signedIn />)
    expect(screen.getByText('A class war.')).toBeInTheDocument()
    expect(screen.queryByText(HEADER.rationale)).not.toBeInTheDocument()
  })

  it('renders the exact integer match string — no band/label transformation yet', () => {
    render(<PrimaryCaseCard ffTake={{ body: 'x' }} whyHeader={HEADER} matchPct={84} signedIn />)
    expect(screen.getByText('84%')).toBeInTheDocument()
    // F5.4 will convert this to a band; today it must stay a raw integer %.
    expect(screen.queryByText(/strong match|good match/i)).not.toBeInTheDocument()
  })

  it('does not render the match gloss for zero / null / non-finite percentages', () => {
    for (const matchPct of [0, null, undefined, NaN]) {
      const { container } = render(
        <PrimaryCaseCard ffTake={{ body: 'x' }} whyHeader={HEADER} matchPct={matchPct} signedIn />,
      )
      expect(container.textContent).not.toMatch(/how it fits your taste so far/i)
    }
  })

  it('renders a match-only state (no lead text)', () => {
    render(<PrimaryCaseCard ffTake={null} whyHeader={{ rationale: '' }} matchPct={77} signedIn />)
    expect(screen.getByText('77%')).toBeInTheDocument()
  })

  it('renders a chips-only state (no lead, no match)', () => {
    render(<PrimaryCaseCard ffTake={null} whyHeader={{ rationale: '' }} matchPct={null} moodTags={['tense']} signedIn />)
    expect(screen.getByText('Tense')).toBeInTheDocument()
  })

  it('does not add the sign-in nudge when the signed-out rationale already invites sign-in', () => {
    render(
      <PrimaryCaseCard
        ffTake={null}
        whyHeader={{ eyebrow: 'Editorial fingerprint', rationale: 'Sign in to see how it lines up with your library.' }}
        matchPct={null}
        signedIn={false}
      />,
    )
    expect(screen.queryByText(/sign in and rate a few films/i)).not.toBeInTheDocument()
  })
})
