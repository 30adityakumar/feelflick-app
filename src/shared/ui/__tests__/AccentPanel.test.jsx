import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'

import AccentPanel from '../AccentPanel'
import { HP, RADIUS } from '@/shared/lib/tokens'

const styleOf = (el) => el.getAttribute('style')

// Render a reference element with the legacy inline surface so the comparison is
// robust to jsdom's color normalization (it serializes 8-digit hex → rgba).
function legacySurfaceStyle(hex, radiusPx) {
  const { container } = render(
    <div style={{ background: `${hex}0d`, border: `1px solid ${hex}26`, borderRadius: radiusPx }} />,
  )
  return styleOf(container.firstChild)
}

// The legacy PrimaryCaseCard inner surface (directional brand glow) — for the
// F11B.5 gradient-variant parity guard.
function legacyGradientStyle(hex, radiusPx) {
  const { container } = render(
    <div
      style={{
        background: `linear-gradient(160deg, ${hex}0f, transparent 72%)`,
        border: `1px solid ${hex}33`,
        borderRadius: radiusPx,
      }}
    />,
  )
  return styleOf(container.firstChild)
}

describe('AccentPanel', () => {
  it('renders children', () => {
    const { getByText } = render(<AccentPanel>Inside</AccentPanel>)
    expect(getByText('Inside')).toBeInTheDocument()
  })

  it('defaults to the purple tone surface + md radius (parity with the legacy inline style)', () => {
    const { container } = render(<AccentPanel>x</AccentPanel>)
    const el = container.firstChild
    expect(styleOf(el)).toBe(legacySurfaceStyle(HP.purple, RADIUS.md))
    expect(el.className).toContain('ff-accent-panel')
    expect(el.className).not.toContain('ff-accent-panel--interactive')
  })

  it('maps each approved tone to its HP color (no arbitrary hex)', () => {
    for (const [tone, hex] of [
      ['pink', HP.pink],
      ['amber', HP.amber],
      ['green', HP.green],
      ['red', HP.red],
    ]) {
      const { container, unmount } = render(<AccentPanel tone={tone}>x</AccentPanel>)
      expect(styleOf(container.firstChild)).toBe(legacySurfaceStyle(hex, RADIUS.md))
      unmount()
    }
  })

  it('is non-interactive by default; interactive adds the gated hover class', () => {
    const { container, rerender } = render(<AccentPanel>x</AccentPanel>)
    expect(container.firstChild.className).not.toContain('ff-accent-panel--interactive')
    rerender(<AccentPanel interactive>x</AccentPanel>)
    expect(container.firstChild.className).toContain('ff-accent-panel--interactive')
  })

  it('respects the radius token', () => {
    const { container } = render(<AccentPanel radius="lg">x</AccentPanel>)
    expect(styleOf(container.firstChild)).toBe(legacySurfaceStyle(HP.purple, RADIUS.lg))
  })

  it('renders a custom element via `as` and merges className', () => {
    const { container } = render(<AccentPanel as="section" className="mine">x</AccentPanel>)
    const el = container.firstChild
    expect(el.tagName).toBe('SECTION')
    expect(el.className).toContain('mine')
    expect(el.className).toContain('ff-accent-panel')
  })

  it('reproduces the WhyThisPick surface exactly (tone=purple, radius=md)', () => {
    // Parity guard: AccentPanel tone=purple must equal the legacy WhyThisPick surface.
    const { container } = render(<AccentPanel tone="purple" radius="md">x</AccentPanel>)
    expect(styleOf(container.firstChild)).toBe(legacySurfaceStyle(HP.purple, RADIUS.md))
  })

  // --- F11B.5: gradient variant ---

  it('default variant is tint (class + surface) — WhyThisPick stays byte-identical', () => {
    const { container } = render(<AccentPanel>x</AccentPanel>)
    const el = container.firstChild
    expect(el.className).toContain('ff-accent-panel--tint')
    expect(el.className).not.toContain('ff-accent-panel--gradient')
    expect(styleOf(el)).toBe(legacySurfaceStyle(HP.purple, RADIUS.md))
  })

  it('variant="gradient" renders the directional brand glow (parity with legacy PrimaryCaseCard)', () => {
    const { container } = render(
      <AccentPanel variant="gradient" tone="purple" radius="lg">x</AccentPanel>,
    )
    const el = container.firstChild
    expect(el.className).toContain('ff-accent-panel--gradient')
    expect(styleOf(el)).toBe(legacyGradientStyle(HP.purple, RADIUS.lg))
  })

  it('an unknown variant falls back to the tint surface (constrained, safe)', () => {
    const { container } = render(<AccentPanel variant="nope">x</AccentPanel>)
    const el = container.firstChild
    expect(el.className).toContain('ff-accent-panel--tint')
    expect(styleOf(el)).toBe(legacySurfaceStyle(HP.purple, RADIUS.md))
  })
})
