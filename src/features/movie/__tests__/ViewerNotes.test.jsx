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
})
