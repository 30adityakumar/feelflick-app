// src/features/discover/__tests__/DiscoverResolve.test.jsx
// F3.7 — StageResolve: the single short resolve transition that replaced the ~6.2s
// Breath → constellation-collapse → title-card ceremony. One 900ms mood-coloured
// beat (0ms under reduced motion), one role=status, no film title, no progress.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StrictMode } from 'react'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const h = vi.hoisted(() => ({ reduced: false }))
vi.mock('framer-motion', () => ({ useReducedMotion: () => h.reduced }))

import StageResolve, { RESOLVE_DURATION_MS } from '../sections/StageResolve'

const SRC = readFileSync(resolve(import.meta.dirname, '../sections/StageResolve.jsx'), 'utf8')
const CSS = readFileSync(resolve(import.meta.dirname, '../discover.css'), 'utf8')

beforeEach(() => { h.reduced = false })

// ── timing ────────────────────────────────────────────────────────────────────
describe('StageResolve — timing', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('exports RESOLVE_DURATION_MS = 900', () => {
    expect(RESOLVE_DURATION_MS).toBe(900)
  })
  it('normal motion: calls onDone exactly once at 900ms, not before', () => {
    const onDone = vi.fn()
    render(<StageResolve blendHex="#A78BFA" onDone={onDone} />)
    vi.advanceTimersByTime(899)
    expect(onDone).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(onDone).toHaveBeenCalledTimes(1)
  })
  it('clears its timer on unmount', () => {
    const onDone = vi.fn()
    const { unmount } = render(<StageResolve blendHex="#A78BFA" onDone={onDone} />)
    unmount()
    vi.advanceTimersByTime(5000)
    expect(onDone).not.toHaveBeenCalled()
  })
  it('reduced motion: zero-duration timer — not called during render, once after timers advance', () => {
    h.reduced = true
    const onDone = vi.fn()
    render(<StageResolve blendHex="#A78BFA" onDone={onDone} />)
    expect(onDone).not.toHaveBeenCalled() // not synchronous during render
    vi.advanceTimersByTime(0)
    expect(onDone).toHaveBeenCalledTimes(1)
  })
  it('a rerender does not create a duplicate completion', () => {
    const onDone = vi.fn()
    const { rerender } = render(<StageResolve blendHex="#A78BFA" onDone={onDone} />)
    rerender(<StageResolve blendHex="#A78BFA" onDone={onDone} />)
    vi.advanceTimersByTime(900)
    expect(onDone).toHaveBeenCalledTimes(1)
  })
  it('StrictMode does not cause a double transition', () => {
    const onDone = vi.fn()
    render(<StrictMode><StageResolve blendHex="#A78BFA" onDone={onDone} /></StrictMode>)
    vi.advanceTimersByTime(900)
    expect(onDone).toHaveBeenCalledTimes(1)
  })
})

// ── semantics ─────────────────────────────────────────────────────────────────
describe('StageResolve — semantics', () => {
  it('exposes exactly one role=status with aria-live=polite + aria-atomic=true', () => {
    render(<StageResolve blendHex="#A78BFA" onDone={() => {}} />)
    const statuses = screen.getAllByRole('status')
    expect(statuses).toHaveLength(1)
    expect(statuses[0]).toHaveAttribute('aria-live', 'polite')
    expect(statuses[0]).toHaveAttribute('aria-atomic', 'true')
  })
  it('renders the eyebrow + message', () => {
    render(<StageResolve blendHex="#A78BFA" onDone={() => {}} />)
    expect(screen.getByText('One film for tonight')).toBeInTheDocument()
    expect(screen.getByText('Bringing tonight into focus.')).toBeInTheDocument()
  })
  it('renders no h1 and no interactive controls', () => {
    render(<StageResolve blendHex="#A78BFA" onDone={() => {}} />)
    expect(screen.queryByRole('heading')).not.toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })
  it('marks the decorative halo/mark aria-hidden', () => {
    const { container } = render(<StageResolve blendHex="#A78BFA" onDone={() => {}} />)
    expect(container.querySelector('.ff-resolve__mark')).toHaveAttribute('aria-hidden', 'true')
  })
  it('does not move focus', () => {
    render(<StageResolve blendHex="#A78BFA" onDone={() => {}} />)
    expect(document.activeElement).toBe(document.body)
  })
  it('accepts only { blendHex, onDone } — no film-title or result data', () => {
    expect(SRC).toMatch(/function StageResolve\(\{ blendHex, onDone \}\)/) // exact prop contract — no title
    expect(SRC).not.toMatch(/results|allResults|useDiscoverData|supabase/)
  })
})

// ── motion contract ───────────────────────────────────────────────────────────
describe('StageResolve — motion contract', () => {
  it('uses no infinite loop', () => {
    expect(SRC).not.toMatch(/repeat:\s*Infinity|infinite/i)
    expect(CSS).not.toMatch(/ff-resolve[^{]*\{[^}]*infinite/)
  })
  it('ships a reduced-motion rule that drops the resolve animation', () => {
    expect(CSS).toMatch(/prefers-reduced-motion:\s*reduce/)
    expect(CSS).toMatch(/\.ff-resolve__halo[\s\S]{0,120}animation:\s*none/)
  })
  it('renders no particle nodes and no progress/percentage', () => {
    const { container } = render(<StageResolve blendHex="#A78BFA" onDone={() => {}} />)
    expect(container.querySelectorAll('span')).toHaveLength(0) // no particle bursts
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    expect(screen.queryByText(/%/)).not.toBeInTheDocument()
  })
})
