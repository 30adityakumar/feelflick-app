import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render } from '@testing-library/react'

vi.mock('framer-motion', () => ({ useReducedMotion: vi.fn(() => false) }))
import { useReducedMotion } from 'framer-motion'
import DiscoverResolveStage, { RESOLVE_MIN_MS } from '../sections/DiscoverResolveStage'

beforeEach(() => { vi.useFakeTimers(); useReducedMotion.mockReturnValue(false) })
afterEach(() => { vi.runOnlyPendingTimers(); vi.useRealTimers() })

describe('DiscoverResolveStage timing', () => {
  it('reveals after the short beat when results are ready', () => {
    const onDone = vi.fn()
    render(<DiscoverResolveStage ready error={false} onDone={onDone} blendHex="#fff" />)
    expect(onDone).not.toHaveBeenCalled()
    vi.advanceTimersByTime(RESOLVE_MIN_MS)
    expect(onDone).toHaveBeenCalledTimes(1)
  })

  it('stays (acts as the loading state) while results are still pending', () => {
    const onDone = vi.fn()
    render(<DiscoverResolveStage ready={false} error={false} onDone={onDone} blendHex="#fff" />)
    vi.advanceTimersByTime(RESOLVE_MIN_MS * 3)
    expect(onDone).not.toHaveBeenCalled()
  })

  it('reveals immediately for reduced-motion users', () => {
    useReducedMotion.mockReturnValue(true)
    const onDone = vi.fn()
    render(<DiscoverResolveStage ready error={false} onDone={onDone} blendHex="#fff" />)
    vi.advanceTimersByTime(0)
    expect(onDone).toHaveBeenCalledTimes(1)
  })
})
