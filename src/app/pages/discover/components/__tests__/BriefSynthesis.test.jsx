import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import BriefSynthesis, { buildSynthesis } from '../BriefSynthesis'

describe('buildSynthesis', () => {
  it('includes energy, tone, time, company, and era', () => {
    const result = buildSynthesis({
      energy: 5,
      tone: 'sharp',
      time: 'short',
      company: 'friends',
      era: 'classic',
    })

    expect(result).toContain('high-energy')
    expect(result).toContain('sharp')
    expect(result).toContain('under 90 minutes')
    expect(result).toContain('friends')
    expect(result).toContain('pre-2000 cinema')
  })

  it('defaults to medium-energy and solo viewing when missing', () => {
    const result = buildSynthesis({})

    expect(result).toContain('medium-energy')
    expect(result).toContain('solo viewing')
  })

  it('omits tone and time when not set', () => {
    const result = buildSynthesis({ energy: 1, company: 'alone' })

    expect(result).toContain('low-energy')
    expect(result).not.toContain('sharp')
    expect(result).not.toContain('under 90 minutes')
  })

  it('appends first note in quotes', () => {
    const result = buildSynthesis(
      { energy: 3, company: 'partner' },
      ['something light'],
    )

    expect(result).toContain('\u201Csomething light\u201D')
  })

  it('handles era "any" by including no era preference', () => {
    const result = buildSynthesis({ energy: 3, company: 'alone', era: 'any' })

    expect(result).toContain('no era preference')
  })
})

describe('BriefSynthesis component', () => {
  it('renders the synthesis sentence', () => {
    render(
      <BriefSynthesis
        answers={{ energy: 5, tone: 'warm', company: 'family', era: 'modern' }}
      />,
    )

    expect(screen.getByText(/high-energy/)).toBeTruthy()
    expect(screen.getByText(/Your brief/i)).toBeTruthy()
  })
})
