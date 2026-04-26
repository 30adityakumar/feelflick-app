// src/shared/ui/__tests__/BrandSplash.test.jsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import BrandSplash from '../BrandSplash'

describe('BrandSplash', () => {
  // Loading-state tests must advance past the 200ms visibility delay.
  describe('loading state (after 200ms)', () => {
    beforeEach(() => { vi.useFakeTimers() })
    afterEach(() => { vi.useRealTimers() })

    it('renders the FEELFLICK wordmark', async () => {
      await act(async () => { render(<BrandSplash />) })
      await act(async () => { await vi.runAllTimersAsync() })
      expect(screen.getByText('FEELFLICK')).toBeInTheDocument()
    })

    it('renders an optional label below the shimmer', async () => {
      await act(async () => { render(<BrandSplash label="Signing you in…" />) })
      await act(async () => { await vi.runAllTimersAsync() })
      expect(screen.getByText('Signing you in…')).toBeInTheDocument()
    })
  })

  // Before 200ms the component returns null — nothing should be visible.
  describe('loading state (before 200ms)', () => {
    beforeEach(() => { vi.useFakeTimers() })
    afterEach(() => { vi.useRealTimers() })

    it('renders nothing before the delay fires', async () => {
      await act(async () => { render(<BrandSplash />) })
      expect(screen.queryByText('FEELFLICK')).not.toBeInTheDocument()
    })

    it('does not render error UI in loading state', async () => {
      await act(async () => { render(<BrandSplash />) })
      expect(screen.queryByRole('button')).not.toBeInTheDocument()
    })

    it('does not render Return home button in loading state', async () => {
      await act(async () => { render(<BrandSplash />) })
      expect(screen.queryByRole('button', { name: /return home/i })).not.toBeInTheDocument()
    })

    it('does not render label when not provided', async () => {
      await act(async () => { render(<BrandSplash />) })
      expect(screen.queryByText(/signing/i)).not.toBeInTheDocument()
    })
  })

  // Error state is always immediate — no delay.
  describe('error state (immediate)', () => {
    it('renders the error message when error prop is provided', () => {
      render(<BrandSplash error="Network error" />)
      expect(screen.getByText('Network error')).toBeInTheDocument()
    })

    it('renders a Return home button in error state', () => {
      render(<BrandSplash error="Something failed" />)
      expect(screen.getByRole('button', { name: /return home/i })).toBeInTheDocument()
    })

    it('renders the FEELFLICK wordmark in error state', () => {
      render(<BrandSplash error="Something failed" />)
      expect(screen.getByText('FEELFLICK')).toBeInTheDocument()
    })
  })
})
