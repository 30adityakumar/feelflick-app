import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import BriefSynthesis, { buildSynthesis } from '../BriefSynthesis'

describe('buildSynthesis', () => {
  it('includes vibe, attention, time, and company', () => {
    const result = buildSynthesis({
      vibe: 'dark_sharp',
      attention: 'lean_in',
      time: 'short',
      company: 'friends',
    })

    expect(result).toContain('dark & sharp')
    expect(result).toContain('lean-in')
    expect(result).toContain('under 90 minutes')
    expect(result).toContain('friends')
  })

  it('defaults to open-minded and solo viewing when no answers', () => {
    const result = buildSynthesis({})

    expect(result).toContain('open-minded')
    expect(result).toContain('solo viewing')
  })

  it('omits attention and time when not set', () => {
    const result = buildSynthesis({ vibe: 'cozy_warm', company: 'alone' })

    expect(result).toContain('cozy')
    expect(result).not.toContain('lean-in')
    expect(result).not.toContain('under 90 minutes')
  })

  it('appends first note in quotes', () => {
    const result = buildSynthesis(
      { vibe: 'curious_warm', company: 'partner' },
      ['something light'],
    )

    expect(result).toContain('\u201Csomething light\u201D')
  })

  it('handles all vibe options', () => {
    const result = buildSynthesis({ vibe: 'silly_warm' })
    expect(result).toContain('silly & fun')
  })

  it('maps time=medium correctly', () => {
    const result = buildSynthesis({ time: 'medium' })
    expect(result).toContain('150 minute')
  })
})

describe('BriefSynthesis component', () => {
  it('renders the synthesis sentence', () => {
    render(
      <BriefSynthesis
        answers={{ vibe: 'cozy_warm', company: 'family' }}
      />,
    )

    expect(screen.getByText(/cozy/)).toBeTruthy()
    expect(screen.getByText(/Your brief/i)).toBeTruthy()
  })
})
