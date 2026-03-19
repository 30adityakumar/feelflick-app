// Component tests for SectionErrorBoundary.
// Verifies that a broken child shows an inline error card (not a page crash),
// the label appears, and the Retry button resets the boundary.

import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SectionErrorBoundary } from '../ErrorBoundary'

// Silence expected console.error output from deliberate throws
let consoleError
beforeAll(() => {
  consoleError = console.error
  console.error = vi.fn()
})
afterAll(() => {
  console.error = consoleError
})

// A component that throws on first render, then renders fine after retry
let shouldThrow = true
function BrokenChild() {
  if (shouldThrow) throw new Error('deliberate test error')
  return <div>all good</div>
}

// A component that always throws
function AlwaysBroken() {
  throw new Error('always broken')
}

describe('SectionErrorBoundary', () => {
  it('renders children when no error is thrown', () => {
    render(
      <SectionErrorBoundary label="My Section">
        <div>happy content</div>
      </SectionErrorBoundary>
    )
    expect(screen.getByText('happy content')).toBeInTheDocument()
  })

  it('shows inline error when a child throws', () => {
    render(
      <SectionErrorBoundary label="Quick Picks">
        <AlwaysBroken />
      </SectionErrorBoundary>
    )
    expect(screen.getByText(/Quick Picks couldn't load/)).toBeInTheDocument()
  })

  it('shows a Retry button in the error state', () => {
    render(
      <SectionErrorBoundary label="Hidden Gems">
        <AlwaysBroken />
      </SectionErrorBoundary>
    )
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
  })

  it('does NOT render a full-page takeover (no FeelFlick heading)', () => {
    render(
      <SectionErrorBoundary label="Trending For You">
        <AlwaysBroken />
      </SectionErrorBoundary>
    )
    // The full-screen ErrorBoundary renders "FEELFLICK" as a large heading
    expect(screen.queryByText('FEELFLICK')).not.toBeInTheDocument()
  })

  it('resets and renders children again after clicking Retry', () => {
    shouldThrow = true
    render(
      <SectionErrorBoundary label="Because You Watched">
        <BrokenChild />
      </SectionErrorBoundary>
    )

    // Error state is visible
    expect(screen.getByText(/Because You Watched couldn't load/)).toBeInTheDocument()

    // Simulate the fix — next render should succeed
    shouldThrow = false
    fireEvent.click(screen.getByRole('button', { name: /retry/i }))

    expect(screen.getByText('all good')).toBeInTheDocument()
  })
})
