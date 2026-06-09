import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

import SocialContext from '../SocialContext'

// F5.6 — the Taste Twin is anonymised on the Film File: rating / review text /
// watched date / exact overall-similarity are REAL and kept; identity is hidden.
const TWIN = { id: 'uuid-123', name: 'Jordan Lee', avatarBg: '#1a2b3c', avatarUrl: 'http://cdn/jordan.jpg', matchPct: 84, rating: 9, note: 'It lingers long after.', watchedDate: 'Mar 2024' }

describe('Taste Twin privacy (F5.6)', () => {
  it('13/14/15/16. hides the real name, avatar URL, identity initials, and any name in the a11y tree', () => {
    const { container } = render(<SocialContext friends={[]} twin={TWIN} />)
    expect(screen.queryByText('Jordan Lee')).not.toBeInTheDocument()
    expect(screen.queryByText('Jordan')).not.toBeInTheDocument()
    expect(container.querySelector('img[src*="jordan.jpg"]')).toBeNull()
    expect(container.querySelector('img')).toBeNull()                 // no avatar image at all
    expect(container.textContent).not.toMatch(/Jordan|\bJL\b/)
    // no aria-label/alt leaks the name
    expect(container.querySelector('[aria-label*="Jordan"]')).toBeNull()
    expect(container.innerHTML).not.toContain('jordan.jpg')
  })

  it('17. uses the neutral "A taste twin" label', () => {
    render(<SocialContext friends={[]} twin={TWIN} />)
    expect(screen.getByText(/A taste twin rated this film/i)).toBeInTheDocument()
  })

  it('18/19/20/21. keeps the real review verbatim, the rating, the exact similarity, and the overall-similarity wording', () => {
    const { container } = render(<SocialContext friends={[]} twin={TWIN} />)
    expect(container.textContent).toContain('It lingers long after.')          // verbatim review
    expect(screen.getByLabelText('4.5 out of 5 stars')).toBeInTheDocument()     // rating 9 → 4.5★
    expect(container.textContent).toMatch(/84% overall taste similarity/)       // exact value + wording
  })

  it('22. never implies film-specific agreement', () => {
    const { container } = render(<SocialContext friends={[]} twin={TWIN} />)
    expect(container.textContent).not.toMatch(/film match|agreement on this film|84%\s*match\b/i)
  })

  it('23. rating-only fallback stays honest when there is no note', () => {
    render(<SocialContext friends={[]} twin={{ ...TWIN, note: null }} />)
    expect(screen.getByText(/No note yet — just the rating\./i)).toBeInTheDocument()
  })

  it('does not label the real review as generated', () => {
    const { container } = render(<SocialContext friends={[]} twin={TWIN} />)
    expect(container.textContent).not.toMatch(/generated|FeelFlick impression/i)
  })
})
