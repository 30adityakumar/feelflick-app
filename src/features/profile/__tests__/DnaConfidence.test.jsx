import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import DnaConfidence from '../DnaConfidence'

const renderAt = (props) => render(<MemoryRouter><DnaConfidence {...props} /></MemoryRouter>)

// F7 trust contract: DNA confidence is framed as taste *evidence*, never accuracy / a guarantee.
// F7.4: it is presented as a qualitative MATURITY BAND — never an exact percentage and never a
// completion meter. The internal numeric value (computeDnaConfidence) is unchanged.
describe('DnaConfidence — evidence-maturity band (F7.4)', () => {
  it('frames it as taste evidence and shows NO percentage anywhere', () => {
    renderAt({ confidence: 64, filmsLogged: 30, filmsRated: 12, moodSignals: 6 })
    expect(screen.getByText('Taking shape')).toBeInTheDocument()        // 40–69 → Taking shape
    expect(screen.queryByText('64%')).not.toBeInTheDocument()
    expect(screen.queryByText(/\d+%/)).not.toBeInTheDocument()          // no exact % rendered
    expect(screen.getByText(/taste evidence/i)).toBeInTheDocument()
    expect(screen.getByText(/not a measure of accuracy/i)).toBeInTheDocument()
    expect(screen.getByText(/one film each night/i)).toBeInTheDocument()
    // no progressbar/meter semantics
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    expect(screen.queryByRole('meter')).not.toBeInTheDocument()
  })

  it('boundary mapping: <40 → Still forming, 40–69 → Taking shape, 70+ → Well established', () => {
    const band = (confidence) => {
      const { unmount } = renderAt({ confidence, filmsLogged: 10, filmsRated: 4, moodSignals: 5 })
      const found = ['Still forming', 'Taking shape', 'Well established'].find(l => screen.queryByText(l))
      unmount()
      return found
    }
    expect(band(0)).toBe('Still forming')
    expect(band(39)).toBe('Still forming')
    expect(band(40)).toBe('Taking shape')
    expect(band(69)).toBe('Taking shape')
    expect(band(70)).toBe('Well established')
    expect(band(100)).toBe('Well established')
  })

  it('low evidence (forming band): cannot show a mature band; gives guidance + a Tonight CTA', () => {
    renderAt({ confidence: 12, filmsLogged: 2, filmsRated: 0, moodSignals: 1 })
    expect(screen.getByText('Still forming')).toBeInTheDocument()
    expect(screen.queryByText('Well established')).not.toBeInTheDocument()
    expect(screen.getByText(/completely normal when you/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /see tonight.s pick/i })).toBeInTheDocument()
  })

  it('high evidence (established band): no cold-start CTA, no percentage', () => {
    renderAt({ confidence: 88, filmsLogged: 120, filmsRated: 40, moodSignals: 10 })
    expect(screen.getByText('Well established')).toBeInTheDocument()
    expect(screen.queryByText(/\d+%/)).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /see tonight.s pick/i })).not.toBeInTheDocument()
  })

  it('still shows the evidence it is built from (counts, not percentages)', () => {
    renderAt({ confidence: 50, filmsLogged: 30, filmsRated: 12, moodSignals: 6 })
    expect(screen.getByText('30')).toBeInTheDocument()
    expect(screen.getByText('12')).toBeInTheDocument()
  })

  it('self-hides when there is no confidence value', () => {
    const { container } = render(<MemoryRouter><DnaConfidence confidence={null} /></MemoryRouter>)
    expect(container.querySelector('section')).toBeNull()
  })
})
