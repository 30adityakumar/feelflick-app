import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

import NarratedLoader from '../NarratedLoader'

const defaults = { resultsReady: false, errorReady: false, exhausted: false }

describe('NarratedLoader', () => {
  it('shows the first narration line on mount', () => {
    render(
      <NarratedLoader
        {...defaults}
        onComplete={vi.fn()}
      />,
    )

    expect(screen.getByText(/Matching your taste/)).toBeTruthy()
  })

  it('renders progress bar', () => {
    const { container } = render(
      <NarratedLoader
        {...defaults}
        onComplete={vi.fn()}
      />,
    )

    // Progress bar should be present (gradient bar inside overflow container)
    const progressBar = container.querySelector('.bg-gradient-to-r')
    expect(progressBar).toBeTruthy()
  })

  it('calls onComplete after resultsReady AND lines complete', async () => {
    const onComplete = vi.fn()

    const { rerender } = render(
      <NarratedLoader
        {...defaults}
        onComplete={onComplete}
      />,
    )

    rerender(
      <NarratedLoader
        {...defaults}
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

  it('calls onComplete when exhausted (zero-result pool)', async () => {
    const onComplete = vi.fn()

    const { rerender } = render(
      <NarratedLoader
        {...defaults}
        onComplete={onComplete}
      />,
    )

    rerender(
      <NarratedLoader
        {...defaults}
        exhausted={true}
        onComplete={onComplete}
      />,
    )

    await waitFor(
      () => expect(onComplete).toHaveBeenCalledTimes(1),
      { timeout: 6000 },
    )
  })

  it('calls onComplete when errorReady', async () => {
    const onComplete = vi.fn()

    const { rerender } = render(
      <NarratedLoader
        {...defaults}
        onComplete={onComplete}
      />,
    )

    rerender(
      <NarratedLoader
        {...defaults}
        errorReady={true}
        onComplete={onComplete}
      />,
    )

    await waitFor(
      () => expect(onComplete).toHaveBeenCalledTimes(1),
      { timeout: 6000 },
    )
  })
})
