import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

import NarratedLoader from '../NarratedLoader'

describe('NarratedLoader', () => {
  it('shows the first narration line on mount', () => {
    render(
      <NarratedLoader
        resultsReady={false}
        onComplete={vi.fn()}
      />,
    )

    expect(screen.getByText(/Matching your taste/)).toBeTruthy()
  })

  it('renders progress bar', () => {
    const { container } = render(
      <NarratedLoader
        resultsReady={false}
        onComplete={vi.fn()}
      />,
    )

    // Progress bar should be present (gradient bar inside overflow container)
    const progressBar = container.querySelector('.bg-gradient-to-r')
    expect(progressBar).toBeTruthy()
  })

  it('calls onComplete after results ready AND lines complete', async () => {
    const onComplete = vi.fn()

    const { rerender } = render(
      <NarratedLoader
        resultsReady={false}
        onComplete={onComplete}
      />,
    )

    // Results ready from the start
    rerender(
      <NarratedLoader
        resultsReady={true}
        onComplete={onComplete}
      />,
    )

    // Wait for all 3 lines to cycle (1200ms each) + final delay
    await waitFor(
      () => expect(onComplete).toHaveBeenCalledTimes(1),
      { timeout: 6000 },
    )
  })
})
