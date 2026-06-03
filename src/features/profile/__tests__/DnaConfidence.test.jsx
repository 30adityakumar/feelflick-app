import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import DnaConfidence from '../DnaConfidence'

const renderAt = (props) => render(<MemoryRouter><DnaConfidence {...props} /></MemoryRouter>)

// F7 trust contract: DNA confidence is framed as taste *evidence*, never as
// accuracy / a guarantee / a grade on the user, and it connects to Tonight.
describe('DnaConfidence — honest framing (F7)', () => {
  it('frames the number as taste evidence, not accuracy or certainty', () => {
    renderAt({ confidence: 64, filmsLogged: 30, filmsRated: 12, moodSignals: 6 })
    expect(screen.getByText('64%')).toBeInTheDocument()
    expect(screen.getByText(/taste evidence/i)).toBeInTheDocument()
    expect(screen.getByText(/not a measure of accuracy/i)).toBeInTheDocument()
    expect(screen.queryByText(/guarantee/i)).not.toBeInTheDocument()
    // Connects the profile to the nightly ritual.
    expect(screen.getByText(/one film each night/i)).toBeInTheDocument()
  })

  it('cold-start: "still learning" guidance + a Tonight CTA', () => {
    renderAt({ confidence: 12, filmsLogged: 2, filmsRated: 0, moodSignals: 1 })
    expect(screen.getByText('Still learning')).toBeInTheDocument() // tier label
    expect(screen.getByText(/completely normal when you/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /see tonight.s pick/i })).toBeInTheDocument()
  })

  it('warm: "reading you well" and no cold-start CTA', () => {
    renderAt({ confidence: 88, filmsLogged: 120, filmsRated: 40, moodSignals: 10 })
    expect(screen.getByText('Reading you well')).toBeInTheDocument() // exact tier label
    expect(screen.queryByRole('link', { name: /see tonight.s pick/i })).not.toBeInTheDocument()
  })

  it('shows the evidence it is built from', () => {
    renderAt({ confidence: 50, filmsLogged: 30, filmsRated: 12, moodSignals: 6 })
    expect(screen.getByText('30')).toBeInTheDocument()
    expect(screen.getByText('12')).toBeInTheDocument()
  })

  it('self-hides when there is no confidence value', () => {
    const { container } = render(<MemoryRouter><DnaConfidence confidence={null} /></MemoryRouter>)
    expect(container.querySelector('section')).toBeNull()
  })
})
