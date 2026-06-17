import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import ThoughtfulRoot from '../ThoughtfulRoot'
import PageDepth from '../PageDepth'
import Surface from '../Surface'
import Text from '../Text'
import PrimaryAction from '../PrimaryAction'
import DecisionMarker from '../DecisionMarker'
import { BrandMark, BrandLink, BrandSignature } from '../BrandAccent'

describe('ThoughtfulRoot', () => {
  it('applies the .ts-root activation scope and is polymorphic', () => {
    const { container } = render(<ThoughtfulRoot as="section" className="x">hi</ThoughtfulRoot>)
    const el = container.firstChild
    expect(el.tagName).toBe('SECTION')
    expect(el.className).toContain('ts-root')
    expect(el.className).toContain('x')
  })
})

describe('PageDepth', () => {
  it('defaults to radial and maps depth → class', () => {
    const { container, rerender } = render(<PageDepth />)
    expect(container.firstChild.className).toContain('ts-page-depth--radial')
    rerender(<PageDepth depth="linear" />)
    expect(container.firstChild.className).toContain('ts-page-depth--linear')
    rerender(<PageDepth depth="none" />)
    expect(container.firstChild.className).toContain('ts-page-depth--none')
  })
  it('falls back to radial for an unknown depth (no arbitrary value)', () => {
    const { container } = render(<PageDepth depth="rainbow" />)
    expect(container.firstChild.className).toContain('ts-page-depth--radial')
  })
})

describe('Surface', () => {
  it('renders solid graphite fill + border + radius from the scoped tokens', () => {
    const { container } = render(<Surface level={2} border="strong" radius="md" shadow />)
    const style = container.firstChild.getAttribute('style')
    expect(style).toContain('--ts-surface-2')
    expect(style).toContain('--ts-border-strong')
    expect(style).toContain('border-radius: 8px') // RADIUS.md
    expect(style).toContain('box-shadow') // opt-in neutral shadow
  })
  it('has no shadow and a subtle border by default', () => {
    const { container } = render(<Surface />)
    const style = container.firstChild.getAttribute('style')
    expect(style).toContain('--ts-surface-1')
    expect(style).toContain('--ts-border-subtle')
    expect(style || '').not.toContain('box-shadow')
  })
})

describe('Text', () => {
  it('maps variant → class and chooses the semantic element via `as`', () => {
    render(<Text variant="display" as="h1">Title</Text>)
    const h1 = screen.getByText('Title')
    expect(h1.tagName).toBe('H1')
    expect(h1.className).toContain('ts-text--display')
  })
  it('falls back to body for an unknown variant', () => {
    const { container } = render(<Text variant="nope">x</Text>)
    expect(container.firstChild.className).toContain('ts-text--body')
  })
})

describe('PrimaryAction', () => {
  it('renders a button with the size class', () => {
    render(<PrimaryAction size="lg">Go</PrimaryAction>)
    const btn = screen.getByRole('button', { name: 'Go' })
    expect(btn.className).toContain('ts-action-primary--lg')
  })
  it('loading sets aria-busy + data-loading and keeps a width-reserving label', () => {
    const { container } = render(<PrimaryAction loading>Save</PrimaryAction>)
    const btn = screen.getByRole('button')
    expect(btn).toBeDisabled()
    expect(btn.getAttribute('aria-busy')).toBe('true')
    expect(btn.getAttribute('data-loading')).toBe('true')
    expect(container.querySelector('.ts-action-primary__spinner')).toBeTruthy()
    expect(container.querySelector('.ts-action-primary__label').textContent).toBe('Save')
  })
  it('disabled blocks interaction', () => {
    render(<PrimaryAction disabled>X</PrimaryAction>)
    expect(screen.getByRole('button')).toBeDisabled()
  })
})

describe('DecisionMarker', () => {
  it('reserves the slot when inactive and lights the dot when active (zero shift)', () => {
    const { container, rerender } = render(<DecisionMarker />)
    const marker = container.querySelector('.ts-decision-marker')
    expect(marker).toBeTruthy()
    expect(marker.getAttribute('aria-hidden')).toBe('true')
    expect(marker.getAttribute('data-active')).toBeNull()
    rerender(<DecisionMarker active />)
    expect(container.querySelector('.ts-decision-marker').getAttribute('data-active')).toBe('true')
  })
  it('emits screen-reader state text (a non-color cue) only when active', () => {
    const { container, rerender } = render(<DecisionMarker srLabel="Chosen" />)
    expect(container.querySelector('.ts-sr-only')).toBeNull()
    rerender(<DecisionMarker active srLabel="Chosen" />)
    expect(container.querySelector('.ts-sr-only').textContent).toBe('Chosen')
  })
})

describe('Bounded rose accents', () => {
  it('BrandMark is decorative, BrandLink is an anchor, BrandSignature solid uses the contrast pill', () => {
    const { container: m } = render(<BrandMark />)
    expect(m.firstChild.className).toContain('ts-brand-mark')
    expect(m.firstChild.getAttribute('aria-hidden')).toBe('true')

    render(<BrandLink href="#x">rose link</BrandLink>)
    const link = screen.getByText('rose link')
    expect(link.tagName).toBe('A')
    expect(link.className).toContain('ts-brand-link')

    const { container: s } = render(<BrandSignature solid>New</BrandSignature>)
    expect(s.firstChild.className).toContain('ts-brand-signature--solid')
  })
})
