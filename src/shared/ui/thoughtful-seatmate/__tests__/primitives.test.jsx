import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { createRef } from 'react'
import { readFileSync } from 'node:fs'
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

// PrimaryAction is now a COMPATIBILITY WRAPPER over <Button variant="primary"> (Slice B).
// These assert public compatibility + delegation, not the old internal markup.
describe('PrimaryAction (compatibility wrapper over Button)', () => {
  it('renders exactly one native button (no nested buttons)', () => {
    const { container } = render(<PrimaryAction>Go</PrimaryAction>)
    expect(container.querySelectorAll('button')).toHaveLength(1)
  })

  it('renders the canonical Button (ff-btn) class', () => {
    render(<PrimaryAction>Go</PrimaryAction>)
    expect(screen.getByRole('button').className).toContain('ff-btn')
  })

  it('retains the ts-action-primary compatibility class', () => {
    render(<PrimaryAction>Go</PrimaryAction>)
    expect(screen.getByRole('button').className).toContain('ts-action-primary')
  })

  it('retains the correct size compatibility class', () => {
    const { rerender } = render(<PrimaryAction size="sm">s</PrimaryAction>)
    expect(screen.getByRole('button').className).toContain('ts-action-primary--sm')
    rerender(<PrimaryAction size="lg">l</PrimaryAction>)
    expect(screen.getByRole('button').className).toContain('ts-action-primary--lg')
  })

  it('fullWidth keeps the compat class and the canonical w-full', () => {
    render(<PrimaryAction fullWidth>Wide</PrimaryAction>)
    const c = screen.getByRole('button').className
    expect(c).toContain('ts-action-primary--full')
    expect(c).toContain('w-full')
  })

  it('defaults to type="button"', () => {
    render(<PrimaryAction>Go</PrimaryAction>)
    expect(screen.getByRole('button').getAttribute('type')).toBe('button')
  })

  it('preserves an explicit type="submit"', () => {
    render(<PrimaryAction type="submit">Go</PrimaryAction>)
    expect(screen.getByRole('button').getAttribute('type')).toBe('submit')
  })

  it('forwards the ref to the native button', () => {
    const ref = createRef()
    render(<PrimaryAction ref={ref}>Go</PrimaryAction>)
    expect(ref.current).toBeInstanceOf(HTMLButtonElement)
  })

  it('forwards native props and event handlers', () => {
    const onClick = vi.fn()
    render(<PrimaryAction onClick={onClick} title="hint" data-x="1">Go</PrimaryAction>)
    const btn = screen.getByRole('button')
    expect(btn.getAttribute('title')).toBe('hint')
    expect(btn.getAttribute('data-x')).toBe('1')
    fireEvent.click(btn)
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('disabled works', () => {
    render(<PrimaryAction disabled>X</PrimaryAction>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('loading disables the button', () => {
    render(<PrimaryAction loading>Save</PrimaryAction>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('loading sets aria-busy="true" (delegated to Button)', () => {
    render(<PrimaryAction loading>Save</PrimaryAction>)
    expect(screen.getByRole('button').getAttribute('aria-busy')).toBe('true')
  })

  it('loading sets data-loading="true" (delegated to Button)', () => {
    render(<PrimaryAction loading>Save</PrimaryAction>)
    expect(screen.getByRole('button').getAttribute('data-loading')).toBe('true')
  })

  it('loading preserves the accessible name', () => {
    render(<PrimaryAction loading>Save</PrimaryAction>)
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument()
  })

  it('loading uses Button’s canonical loading structure (ff-btn label + decorative spinner)', () => {
    const { container } = render(<PrimaryAction loading>Save</PrimaryAction>)
    const spinner = container.querySelector('.ff-btn__spinner')
    const label = container.querySelector('.ff-btn__label')
    expect(spinner).toBeTruthy()
    expect(spinner.getAttribute('aria-hidden')).toBe('true')
    expect(label).toBeTruthy()
    expect(label.textContent).toBe('Save')
  })

  it('no longer renders the former private PrimaryAction loading markup', () => {
    const { container } = render(<PrimaryAction loading>Save</PrimaryAction>)
    expect(container.querySelector('.ts-action-primary__spinner')).toBeNull()
    expect(container.querySelector('.ts-action-primary__label')).toBeNull()
  })

  it('preserves a caller className', () => {
    render(<PrimaryAction className="custom-x">Go</PrimaryAction>)
    expect(screen.getByRole('button').className).toContain('custom-x')
  })

  it('preserves a caller inline style', () => {
    render(<PrimaryAction style={{ padding: '8px 14px' }}>Go</PrimaryAction>)
    expect(screen.getByRole('button').style.padding).toBe('8px 14px')
  })

  it('falls back through Button for an invalid size without throwing', () => {
    expect(() => render(<PrimaryAction size="enormous">Go</PrimaryAction>)).not.toThrow()
    const c = screen.getByRole('button').className
    // md compat class + Button's md size utility (min-h-11) — no throw, no broken size.
    expect(c).toContain('ts-action-primary--md')
    expect(c).toContain('min-h-11')
  })
})

// Source-level CSS-contract checks for the temporary compatibility stylesheet. Narrow
// and behaviour-oriented; avoids brittle full-file snapshots.
describe('PrimaryAction.css compatibility contract', () => {
  // Repo-root-relative (vitest runs from the project root); avoids import.meta.url,
  // which is an http: URL under the jsdom test transform. Strip comments so the
  // "does not contain" checks assert the actual RULES, not explanatory prose.
  const css = readFileSync('src/shared/ui/thoughtful-seatmate/PrimaryAction.css', 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')

  it('removes the primary shadow (flat surface)', () => {
    expect(css).toMatch(/\.ts-action-primary\s*\{[^}]*box-shadow:\s*none/)
  })
  it('restores the legacy inherited line-height (not Button’s size-utility line-height)', () => {
    expect(css).toMatch(/\.ts-action-primary\s*\{[^}]*line-height:\s*inherit/)
  })
  it('preserves darken-on-hover', () => {
    expect(css).toMatch(/\.ts-action-primary:hover:not\(:disabled\)\s*\{[^}]*filter:\s*brightness\(0\.95\)/)
  })
  it('neutralizes Button hover scaling (transform:none on hover)', () => {
    expect(css).toMatch(/\.ts-action-primary:hover:not\(:disabled\)\s*\{[^}]*transform:\s*none/)
  })
  it('neutralizes Button active scaling and preserves the 1px press translate', () => {
    expect(css).toMatch(/\.ts-action-primary:active:not\(:disabled\)\s*\{[^}]*transform:\s*translateY\(1px\)/)
  })
  it('preserves legacy size metrics', () => {
    expect(css).toMatch(/\.ts-action-primary--sm\s*\{[^}]*min-height:\s*44px/)
    expect(css).toMatch(/\.ts-action-primary--md\s*\{[^}]*padding:\s*10px 22px/)
    expect(css).toMatch(/\.ts-action-primary--lg\s*\{[^}]*min-height:\s*48px/)
  })
  it('does not redefine the canonical focus (Button owns --color-focus)', () => {
    expect(css).not.toContain(':focus-visible')
    expect(css).not.toContain('--color-focus')
  })
  it('does not redefine the loading spinner implementation (Button owns it)', () => {
    expect(css).not.toContain('__spinner')
    expect(css).not.toContain('__label')
    expect(css).not.toContain('@keyframes')
  })
  it('does not redefine the forced-colours ACTIVE treatment (Button owns it)', () => {
    expect(css).not.toContain('forced-colors: active')
  })
  it('contains no global selectors (every rule is scoped to .ts-action-primary)', () => {
    // strip comments + at-rule headers, then every selector block must reference the hook.
    const noComments = css.replace(/\/\*[\s\S]*?\*\//g, '')
    const selectors = noComments.match(/(^|\})\s*([^{}@]+)\{/g) || []
    for (const s of selectors) {
      const sel = s.replace(/^[\s}]+/, '').replace(/\{$/, '').trim()
      if (!sel) continue
      expect(sel).toContain('.ts-action-primary')
    }
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
