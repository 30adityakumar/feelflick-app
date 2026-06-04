import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'

import Card from '../Card'
import { RADIUS, SURFACE } from '@/shared/lib/tokens'

// Strip whitespace so jsdom's style-attribute normalization doesn't make these brittle.
const styleOf = (el) => el.getAttribute('style').replace(/\s+/g, '')

describe('Card', () => {
  it('renders children', () => {
    const { getByText } = render(<Card>Inside</Card>)
    expect(getByText('Inside')).toBeInTheDocument()
  })

  it('defaults to card tint + lg radius + a hairline border', () => {
    const { container } = render(<Card>x</Card>)
    const el = container.firstChild
    const s = styleOf(el)
    expect(s).toContain(`border-radius:${RADIUS.lg}px`)
    expect(s).toContain(SURFACE.card.replace(/\s+/g, ''))
    expect(s).toContain('1pxsolidrgba(255,255,255,0.08)') // HP.border
    expect(el.className).toContain('ff-card')
    expect(el.className).not.toContain('ff-card--hover')
  })

  it('hover prop adds the reduced-motion-gated hover class', () => {
    const { container } = render(<Card hover>x</Card>)
    expect(container.firstChild.className).toContain('ff-card--hover')
  })

  it('respects the radius + tint tokens', () => {
    const { container } = render(<Card radius="pill" tint="elevated">x</Card>)
    const s = styleOf(container.firstChild)
    expect(s).toContain(`border-radius:${RADIUS.pill}px`)
    // SURFACE.elevated is the #0d0b14 hex; jsdom serializes it to rgb(13,11,20).
    expect(s).toContain('rgb(13,11,20)')
  })

  it('border={false} drops the hairline border', () => {
    const { container } = render(<Card border={false}>x</Card>)
    // jsdom rewrites `border: none` → `border: medium`, so assert the hairline is absent.
    expect(styleOf(container.firstChild)).not.toContain('1pxsolidrgba(255,255,255,0.08)')
  })

  it('renders as a custom element via `as`', () => {
    const { container } = render(<Card as="section">x</Card>)
    expect(container.firstChild.tagName).toBe('SECTION')
  })

  it('merges custom className + style', () => {
    const { container } = render(<Card className="mine" style={{ padding: 12 }}>x</Card>)
    const el = container.firstChild
    expect(el.className).toContain('mine')
    expect(styleOf(el)).toContain('padding:12px')
  })
})
