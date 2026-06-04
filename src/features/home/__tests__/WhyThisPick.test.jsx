import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

import WhyThisPick from '../WhyThisPick'

// F5 contract: the Briefing "makes its case" only when there IS a case.
// When the engine provides a reason, show it (labeled); on cold-start (no
// reason) render nothing — never fabricate a "why".
describe('WhyThisPick — Briefing case-making (F5)', () => {
  it('renders the engine reason under a "Why this pick" label', () => {
    render(<WhyThisPick reason="Because you loved Parasite" />)
    expect(screen.getByText('Because you loved Parasite')).toBeInTheDocument()
    expect(screen.getByText(/why this pick/i)).toBeInTheDocument()
  })

  it('renders nothing when there is no reason (cold-start — no fabrication)', () => {
    const { container } = render(<WhyThisPick reason={null} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing for an empty / whitespace-only reason', () => {
    const { container } = render(<WhyThisPick reason="   " />)
    expect(container).toBeEmptyDOMElement()
  })
})
