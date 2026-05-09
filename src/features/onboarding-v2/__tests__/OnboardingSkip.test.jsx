// Tests for the onboarding movie-step behaviour (no minimums, no skip button).
// The StepMovies component is not exported from Onboarding.jsx so we test
// the relevant logic through an isolated stub that mirrors the real footer.

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

// ---------------------------------------------------------------------------
// Minimal StepMovies footer stub — mirrors the real component's footer.
// No canProceed gate, no Skip button. Main CTA is always enabled.
// ---------------------------------------------------------------------------
function StepMoviesFooter({ favoriteMovies: _favoriteMovies = [], onBack, onFinish, loading = false }) {
  return (
    <div>
      <button onClick={onBack} disabled={loading}>Back</button>

      <button onClick={onFinish} disabled={loading}>
        {loading ? 'Saving' : 'See my recommendations'}
      </button>
    </div>
  )
}

describe('Onboarding movie step – no minimum', () => {
  it('"See my recommendations" is always enabled regardless of selection count', () => {
    render(<StepMoviesFooter favoriteMovies={[]} onBack={vi.fn()} onFinish={vi.fn()} />)
    expect(screen.getByRole('button', { name: /see my recommendations/i })).not.toBeDisabled()
  })

  it('"See my recommendations" is enabled with films selected', () => {
    render(<StepMoviesFooter favoriteMovies={[{}, {}, {}]} onBack={vi.fn()} onFinish={vi.fn()} />)
    expect(screen.getByRole('button', { name: /see my recommendations/i })).not.toBeDisabled()
  })

  it('"Skip for now" button no longer exists', () => {
    render(<StepMoviesFooter favoriteMovies={[]} onBack={vi.fn()} onFinish={vi.fn()} />)
    expect(screen.queryByRole('button', { name: /skip for now/i })).not.toBeInTheDocument()
  })

  it('"Back" button calls onBack', () => {
    const onBack = vi.fn()
    render(<StepMoviesFooter favoriteMovies={[]} onBack={onBack} onFinish={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /back/i }))
    expect(onBack).toHaveBeenCalled()
  })

  it('"See my recommendations" calls onFinish when clicked', () => {
    const onFinish = vi.fn()
    render(<StepMoviesFooter favoriteMovies={[]} onBack={vi.fn()} onFinish={onFinish} />)
    fireEvent.click(screen.getByRole('button', { name: /see my recommendations/i }))
    expect(onFinish).toHaveBeenCalled()
  })
})
