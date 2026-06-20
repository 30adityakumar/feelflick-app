import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'

import Eyebrow from '../Eyebrow'

const styleOf = (el) => el.getAttribute('style').replace(/\s+/g, '')

describe('Eyebrow', () => {
  it('renders the label', () => {
    const { getByText } = render(<Eyebrow>Mood weights</Eyebrow>)
    expect(getByText('Mood weights')).toBeInTheDocument()
  })

  it('section tone (default) is Inter 700, uppercase, neutral ivory accent (NOT purple/pink) (§16)', () => {
    const { container } = render(<Eyebrow>Section</Eyebrow>)
    const el = container.firstChild
    const s = styleOf(el).toLowerCase()
    expect(s).toContain('font-weight:700')
    expect(s).toContain('inter')
    expect(s).toContain('text-transform:uppercase')
    // Canonical neutral default — the ivory-secondary token, and provably NOT a
    // purple/pink hue (the shared default can never regress to purple/pink).
    expect(s).toContain('color:var(--color-text-secondary')
    expect(s).not.toMatch(/a78bfa|rgb\(167,139,250\)|ec4899|rgb\(236,72,153\)/)
  })

  it('rule prop renders the 22px accent rule', () => {
    const { container } = render(<Eyebrow rule>Section</Eyebrow>)
    expect(container.querySelector('span[aria-hidden]')).toBeTruthy()
  })

  it('reconciles the landing "quiet" eyebrow via weight/color overrides (one contract)', () => {
    // The landing's .ff-eyebrow look (Inter 600 / white-.42) is representable on
    // the shared primitive through props — no separate primitive needed.
    const { container } = render(
      <Eyebrow weight={600} color="rgba(250,250,250,0.42)">Quiet</Eyebrow>,
    )
    const s = styleOf(container.firstChild)
    expect(s).toContain('font-weight:600')
    expect(s).toContain('rgba(250,250,250,0.42)')
  })
})
