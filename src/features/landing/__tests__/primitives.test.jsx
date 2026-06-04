import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

import { AuthCTA, Wordmark, Eyebrow } from '../primitives'

// F4 landing-primitive adoption contract. AuthCTA / Wordmark / Eyebrow are the
// shared landing primitives the sections now reuse (extracted from the parked
// stash). `Reveal` is intentionally not rendered here — it drives an
// IntersectionObserver, which jsdom doesn't implement; it's covered by the
// landing visual baseline instead.
describe('landing primitives (F4 adoption)', () => {
  it('AuthCTA renders a button and fires onClick', () => {
    const onClick = vi.fn()
    render(<AuthCTA onClick={onClick} ariaLabel="Start free">Start free →</AuthCTA>)
    fireEvent.click(screen.getByRole('button', { name: /start free/i }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('AuthCTA disables and swaps to its loading label when loading', () => {
    render(
      <AuthCTA onClick={vi.fn()} loading ariaLabel="Start free">
        {l => (l ? 'Opening Google…' : 'Start free →')}
      </AuthCTA>,
    )
    expect(screen.getByRole('button', { name: /start free/i })).toBeDisabled()
    expect(screen.getByText(/opening google…/i)).toBeInTheDocument()
  })

  it('Wordmark renders the FEELFLICK lockup', () => {
    render(<Wordmark />)
    expect(screen.getByText('FEELFLICK')).toBeInTheDocument()
  })

  it('Eyebrow renders its label', () => {
    render(<Eyebrow>Tonight’s selection</Eyebrow>)
    expect(screen.getByText(/tonight’s selection/i)).toBeInTheDocument()
  })
})
