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
