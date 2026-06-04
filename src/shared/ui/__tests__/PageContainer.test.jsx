import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'

import PageContainer from '../PageContainer'
import { LAYOUT } from '@/shared/lib/tokens'

const styleOf = (el) => el.getAttribute('style').replace(/\s+/g, '')

describe('PageContainer', () => {
  it('renders children', () => {
    const { getByText } = render(<PageContainer>Inside</PageContainer>)
    expect(getByText('Inside')).toBeInTheDocument()
  })

  it('defaults to size="app" (LAYOUT.pageMax) centered, padding=default', () => {
    const { container } = render(<PageContainer>x</PageContainer>)
    const el = container.firstChild
    const s = styleOf(el)
    expect(s).toContain(`max-width:${LAYOUT.pageMax}px`)
    expect(s).toContain('margin-left:auto')
    expect(s).toContain('margin-right:auto')
    expect(el.className).toContain('ff-page')
    expect(el.className).toContain('ff-page--pad-default')
  })

  it('maps size → LAYOUT max-width', () => {
    for (const [size, px] of [
      ['app', LAYOUT.pageMax],
      ['wide', LAYOUT.pageWide],
      ['narrow', LAYOUT.pageNarrow],
    ]) {
      const { container, unmount } = render(<PageContainer size={size}>x</PageContainer>)
      expect(styleOf(container.firstChild)).toContain(`max-width:${px}px`)
      unmount()
    }
  })

  it('an unknown size falls back to app', () => {
    const { container } = render(<PageContainer size="nope">x</PageContainer>)
    expect(styleOf(container.firstChild)).toContain(`max-width:${LAYOUT.pageMax}px`)
  })

  it('padding variant becomes a class (gutters live in CSS)', () => {
    const { container, rerender } = render(<PageContainer padding="none">x</PageContainer>)
    expect(container.firstChild.className).toContain('ff-page--pad-none')
    rerender(<PageContainer padding="lg">x</PageContainer>)
    expect(container.firstChild.className).toContain('ff-page--pad-lg')
  })

  it('renders a custom element via `as` and merges className', () => {
    const { container } = render(
      <PageContainer as="section" className="mine">x</PageContainer>,
    )
    const el = container.firstChild
    expect(el.tagName).toBe('SECTION')
    expect(el.className).toContain('mine')
    expect(el.className).toContain('ff-page')
  })

  it('byte-identical proof: size="app" padding="none" == legacy maxWidth:1280 centered', () => {
    // What Account migrates from → to. PageContainer must reproduce the surface.
    const { container: a } = render(
      <div style={{ maxWidth: 1280, marginLeft: 'auto', marginRight: 'auto', width: '100%' }} />,
    )
    const { container: b } = render(<PageContainer size="app" padding="none">x</PageContainer>)
    expect(styleOf(b.firstChild)).toBe(styleOf(a.firstChild))
  })
})
