import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'

import DiscoverEmptyState from '../DiscoverEmptyState'

describe('DiscoverEmptyState', () => {
  it('renders without throwing', () => {
    render(<DiscoverEmptyState onTryAnotherMood={vi.fn()} onBrowseAll={vi.fn()} />)
    expect(screen.getByText(/We didn't find anything that fits/)).toBeTruthy()
  })

  it('calls onTryAnotherMood when primary button clicked', () => {
    const onTryAnotherMood = vi.fn()
    render(<DiscoverEmptyState onTryAnotherMood={onTryAnotherMood} onBrowseAll={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /try another mood/i }))
    expect(onTryAnotherMood).toHaveBeenCalledTimes(1)
  })

  it('calls onBrowseAll when secondary button clicked', () => {
    const onBrowseAll = vi.fn()
    render(<DiscoverEmptyState onTryAnotherMood={vi.fn()} onBrowseAll={onBrowseAll} />)
    fireEvent.click(screen.getByRole('button', { name: /browse all films/i }))
    expect(onBrowseAll).toHaveBeenCalledTimes(1)
  })

  it('feedback link points to the correct mailto', () => {
    render(<DiscoverEmptyState onTryAnotherMood={vi.fn()} onBrowseAll={vi.fn()} />)
    const link = screen.getByRole('link', { name: /tell us what's missing/i })
    expect(link.href).toContain('mailto:hello@feelflick.com')
    expect(link.getAttribute('target')).toBe('_blank')
  })
})
