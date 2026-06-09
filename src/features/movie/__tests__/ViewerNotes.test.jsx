import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

import ViewerNotes from '../ViewerNotes'

// F6B honesty contract: the generated `critic_quotes` are invented friend-voice
// personas — this section must keep the honest "Viewer notes" framing + the
// "not real reviews" disclaimer so it can never read as real critic reviews.
describe('ViewerNotes — honest framing (F6B)', () => {
  const notes = [{ quote: 'Tense from frame one.', author: 'A weekend viewer', outlet: 'After one watch' }]

  it('shows the note under a "Viewer notes" label with a "not real reviews" disclaimer', () => {
    render(<ViewerNotes notes={notes} />)
    expect(screen.getByText(/tense from frame one/i)).toBeInTheDocument()
    expect(screen.getByText('Viewer notes')).toBeInTheDocument()
    expect(screen.getByText(/not real reviews/i)).toBeInTheDocument()
  })

  it('renders nothing when there are no notes', () => {
    const { container } = render(<ViewerNotes notes={null} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing for an empty notes array', () => {
    const { container } = render(<ViewerNotes notes={[]} />)
    expect(container).toBeEmptyDOMElement()
  })
})

// F5.2 — pins TODAY'S pre-F5.4 trust framing EXPLICITLY so the F5.4 change is a
// visible, reviewable diff. The generated critic_quotes are invented personas, yet
// the section currently renders them with the *grammar of a real review*: a
// <blockquote>, quotation marks, an author byline, and an outlet. F5.1 flagged this
// as the strongest false-authority risk. F5.2 does NOT change it — these assertions
// document the current reality (and the disclaimer that mitigates it).
describe('ViewerNotes — current pre-F5.4 trust framing (documented, not endorsed)', () => {
  const notes = [
    { quote: 'Tense from frame one.', author: 'A weekend viewer', outlet: 'After one watch' },
    { quote: 'It lingers.', outlet: 'A second look' }, // no author → fallback
  ]

  it('keeps the generated-content disclaimer stating these are not real reviews', () => {
    render(<ViewerNotes notes={notes} />)
    const disclaimer = screen.getByText(/illustrative impressions feelflick generated/i)
    expect(disclaimer).toBeInTheDocument()
    expect(disclaimer.textContent).toMatch(/not real reviews or quotes from real critics/i)
  })

  it('currently renders each note inside a <blockquote> with quotation marks', () => {
    const { container } = render(<ViewerNotes notes={notes} />)
    const blockquotes = container.querySelectorAll('blockquote')
    expect(blockquotes.length).toBe(2)
    // The visible text is wrapped in typographic quote marks today.
    expect(container.textContent).toContain('“Tense from frame one.”')
  })

  it('currently renders the invented author + outlet byline', () => {
    render(<ViewerNotes notes={notes} />)
    expect(screen.getByText('A weekend viewer')).toBeInTheDocument()
    expect(screen.getByText(/After one watch/)).toBeInTheDocument()
  })

  it('falls back to "A viewer" when a note has an outlet but no author', () => {
    render(<ViewerNotes notes={notes} />)
    expect(screen.getByText('A viewer')).toBeInTheDocument()
    expect(screen.getByText(/A second look/)).toBeInTheDocument()
  })

  it('renders multiple notes', () => {
    render(<ViewerNotes notes={notes} />)
    expect(screen.getByText(/tense from frame one/i)).toBeInTheDocument()
    expect(screen.getByText(/it lingers/i)).toBeInTheDocument()
  })
})
