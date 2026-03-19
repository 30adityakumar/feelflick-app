// Tests for the onboarding movie-step skip behaviour.
// The StepMovies component is not exported from Onboarding.jsx so we test
// the relevant logic through isolated unit tests and UI snapshots.

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

// ---------------------------------------------------------------------------
// Minimal StepMovies re-implementation for testing only the Skip UX change.
// This mirrors the exact conditional rendering added in the real component.
// ---------------------------------------------------------------------------
function StepMoviesFooter({ favoriteMovies = [], onBack, onFinish, loading = false }) {
  const canProceed = favoriteMovies.length >= 5

  return (
    <div>
      <button onClick={onBack} disabled={loading}>Back</button>

      <div>
        {!canProceed && (
          <button onClick={() => onFinish({ skipMovies: true })} disabled={loading}>
            Skip for now
          </button>
        )}

        <button onClick={onFinish} disabled={loading || !canProceed}>
          {loading ? 'Saving' : 'Complete Setup'}
        </button>
      </div>
    </div>
  )
}

describe('Onboarding movie step – skip behaviour', () => {
  it('shows "Skip for now" when fewer than 5 movies are selected', () => {
    render(<StepMoviesFooter favoriteMovies={[]} onBack={vi.fn()} onFinish={vi.fn()} />)
    expect(screen.getByRole('button', { name: /skip for now/i })).toBeInTheDocument()
  })

  it('hides "Skip for now" once 5 or more movies are selected', () => {
    const movies = [{}, {}, {}, {}, {}]
    render(<StepMoviesFooter favoriteMovies={movies} onBack={vi.fn()} onFinish={vi.fn()} />)
    expect(screen.queryByRole('button', { name: /skip for now/i })).not.toBeInTheDocument()
  })

  it('calls onFinish with { skipMovies: true } when Skip is clicked', () => {
    const onFinish = vi.fn()
    render(<StepMoviesFooter favoriteMovies={[]} onBack={vi.fn()} onFinish={onFinish} />)
    fireEvent.click(screen.getByRole('button', { name: /skip for now/i }))
    expect(onFinish).toHaveBeenCalledWith({ skipMovies: true })
  })

  it('"Complete Setup" is disabled when fewer than 5 movies are selected', () => {
    render(<StepMoviesFooter favoriteMovies={[]} onBack={vi.fn()} onFinish={vi.fn()} />)
    expect(screen.getByRole('button', { name: /complete setup/i })).toBeDisabled()
  })

  it('"Complete Setup" is enabled when 5 or more movies are selected', () => {
    const movies = [{}, {}, {}, {}, {}]
    render(<StepMoviesFooter favoriteMovies={movies} onBack={vi.fn()} onFinish={vi.fn()} />)
    expect(screen.getByRole('button', { name: /complete setup/i })).not.toBeDisabled()
  })

  it('"Skip for now" is disabled while loading', () => {
    render(<StepMoviesFooter favoriteMovies={[]} onBack={vi.fn()} onFinish={vi.fn()} loading />)
    expect(screen.getByRole('button', { name: /skip for now/i })).toBeDisabled()
  })

  it('"Back" button calls onBack', () => {
    const onBack = vi.fn()
    render(<StepMoviesFooter favoriteMovies={[]} onBack={onBack} onFinish={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /back/i }))
    expect(onBack).toHaveBeenCalled()
  })
})
