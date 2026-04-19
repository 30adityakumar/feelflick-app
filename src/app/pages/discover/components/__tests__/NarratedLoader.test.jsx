import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

import NarratedLoader from '../NarratedLoader'

describe('NarratedLoader', () => {
  it('shows the first narration line on mount', () => {
    render(
      <NarratedLoader
        totalCount={4200}
        tagDim={45}
        hasTasteProfile={false}
        resultsReady={false}
        onComplete={vi.fn()}
      />,
    )

    expect(screen.getByText(/Opening the vault of 4,200 films/)).toBeTruthy()
  })

  it('renders progress bar', () => {
    const { container } = render(
      <NarratedLoader
        totalCount={4200}
        tagDim={45}
        hasTasteProfile={false}
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
        totalCount={4200}
        tagDim={45}
        hasTasteProfile={false}
        resultsReady={false}
        onComplete={onComplete}
      />,
    )

    // Results ready from the start
    rerender(
      <NarratedLoader
        totalCount={4200}
        tagDim={45}
        hasTasteProfile={false}
        resultsReady={true}
        onComplete={onComplete}
      />,
    )

    // Wait for all lines to cycle + final delay
    // 4 lines (no taste profile) × 400ms + 400ms final = ~2000ms
    await waitFor(
      () => expect(onComplete).toHaveBeenCalledTimes(1),
      { timeout: 4000 },
    )
  })

  it('renders first line differently based on totalCount', () => {
    render(
      <NarratedLoader
        totalCount={9999}
        tagDim={45}
        hasTasteProfile={true}
        resultsReady={false}
        onComplete={vi.fn()}
      />,
    )

    // First line should include the formatted totalCount
    expect(screen.getByText(/Opening the vault of 9,999 films/)).toBeTruthy()
  })
})
