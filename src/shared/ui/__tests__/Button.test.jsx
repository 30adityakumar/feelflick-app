import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createRef } from 'react'

import Button from '../Button'

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
  })

  it('applies variant class', () => {
    render(<Button variant="primary">Primary</Button>)
    const btn = screen.getByRole('button')
    // Canonical primary = the one neutral ivory action pill (no purple/pink gradient).
    expect(btn.className).toContain('bg-[var(--color-action-primary-fill')
    expect(btn.className).not.toContain('from-purple-600')
  })

  // ── Native button type (Slice A) ─────────────────────────────────────────
  it('defaults to type="button" (no accidental form submit)', () => {
    render(<Button>x</Button>)
    expect(screen.getByRole('button').getAttribute('type')).toBe('button')
  })

  it('preserves an explicit type="submit"', () => {
    render(<Button type="submit">Save</Button>)
    expect(screen.getByRole('button').getAttribute('type')).toBe('submit')
  })

  // ── Loading semantics (Slice A) ──────────────────────────────────────────
  it('loading disables the button', () => {
    render(<Button loading>Save</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('loading sets aria-busy="true"', () => {
    render(<Button loading>Save</Button>)
    expect(screen.getByRole('button').getAttribute('aria-busy')).toBe('true')
  })

  it('loading sets data-loading="true"', () => {
    render(<Button loading>Save</Button>)
    expect(screen.getByRole('button').getAttribute('data-loading')).toBe('true')
  })

  it('loading preserves the accessible name (label is not removed)', () => {
    render(<Button loading>Save</Button>)
    // The accessible name must still resolve to the label, not be lost to the spinner.
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument()
  })

  it('loading keeps the label node in the DOM (width-reserving, not removed/hidden)', () => {
    render(<Button loading>Save</Button>)
    const btn = screen.getByRole('button')
    const label = btn.querySelector('.ff-btn__label')
    expect(label).toBeTruthy()
    expect(label.textContent).toBe('Save')
    // Not hidden from assistive tech / not display:none / not visibility:hidden inline.
    expect(label.getAttribute('aria-hidden')).toBeNull()
    expect(label.getAttribute('data-loading-label')).toBe('true')
  })

  it('loading spinner is decorative (aria-hidden) and is the canonical spinner node', () => {
    render(<Button loading>Save</Button>)
    const btn = screen.getByRole('button')
    const spinner = btn.querySelector('.ff-btn__spinner')
    expect(spinner).toBeTruthy()
    expect(spinner.getAttribute('aria-hidden')).toBe('true')
  })

  it('preserves icon+text children inside the loading label (not flattened to a string)', () => {
    render(
      <Button loading>
        <svg data-testid="ic" aria-hidden="true" />
        <span>Save</span>
      </Button>,
    )
    const label = screen.getByRole('button').querySelector('.ff-btn__label')
    expect(label.querySelector('[data-testid="ic"]')).toBeTruthy()
    expect(label.textContent).toContain('Save')
  })

  it('non-loading children render directly (no label wrapper, current DOM preserved)', () => {
    render(<Button>Plain</Button>)
    expect(screen.getByRole('button').querySelector('.ff-btn__label')).toBeNull()
    expect(screen.getByRole('button').querySelector('.ff-btn__spinner')).toBeNull()
  })

  // ── Controlled-state precedence (Slice A) ────────────────────────────────
  it('caller cannot re-enable a loading button (disabled state is owned)', () => {
    render(<Button loading disabled={false}>Save</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('loading takes precedence over a conflicting caller aria-busy', () => {
    render(<Button loading aria-busy={false}>Save</Button>)
    expect(screen.getByRole('button').getAttribute('aria-busy')).toBe('true')
  })

  it('loading takes precedence over a conflicting caller data-loading', () => {
    render(<Button loading data-loading="false">Save</Button>)
    expect(screen.getByRole('button').getAttribute('data-loading')).toBe('true')
  })

  it('preserves a caller aria-busy when not loading', () => {
    render(<Button aria-busy>Idle</Button>)
    expect(screen.getByRole('button').getAttribute('aria-busy')).toBe('true')
  })

  it('omits aria-busy / data-loading when neither loading nor caller-set', () => {
    render(<Button>Idle</Button>)
    const btn = screen.getByRole('button')
    expect(btn.getAttribute('aria-busy')).toBeNull()
    expect(btn.getAttribute('data-loading')).toBeNull()
  })

  // ── Focus contract (Slice A) ─────────────────────────────────────────────
  it('uses the canonical focus hook class (offset outline owned by Button.css), not the old ring', () => {
    render(<Button variant="primary">f</Button>)
    const c = screen.getByRole('button').className
    expect(c).toContain('ff-btn') // .ff-btn:focus-visible draws the 2px --color-focus offset outline
    // Old tight box-shadow ring contract is gone:
    expect(c).not.toContain('focus-visible:ring')
    expect(c).not.toContain('outline-none')
  })

  it('the focus hook class is shared by every variant', () => {
    for (const variant of ['primary', 'secondary', 'ghost', 'icon', 'destructive']) {
      const { unmount } = render(<Button variant={variant}>v</Button>)
      expect(screen.getByRole('button').className).toContain('ff-btn')
      unmount()
    }
  })

  // ── Invalid size fallback (Slice A) ──────────────────────────────────────
  it('falls back to the md contract for an invalid ordinary size (never throws)', () => {
    expect(() => render(<Button size="enormous">x</Button>)).not.toThrow()
    const c = screen.getByRole('button').className
    expect(c).toContain('min-h-11')
    expect(c).toContain('text-sm')
  })

  it('falls back to the md contract for an invalid icon size (never throws)', () => {
    expect(() => render(<Button variant="icon" size="enormous">i</Button>)).not.toThrow()
    const c = screen.getByRole('button').className
    expect(c).toMatch(/\bh-11\b/)
    expect(c).toMatch(/\bw-11\b/)
  })

  // ── Preserved contract (unchanged resting visuals) ───────────────────────
  it('disabled prop works', () => {
    const onClick = vi.fn()
    render(<Button disabled onClick={onClick}>Disabled</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('forwards ref', () => {
    const ref = createRef()
    render(<Button ref={ref}>Ref</Button>)
    expect(ref.current).toBeInstanceOf(HTMLButtonElement)
  })

  it('fullWidth adds w-full', () => {
    render(<Button fullWidth>Wide</Button>)
    expect(screen.getByRole('button').className).toContain('w-full')
  })

  it.each(['primary', 'secondary', 'ghost', 'icon', 'destructive'])(
    'renders the %s variant as a rounded-full pill (variant set unchanged)',
    (variant) => {
      const { unmount } = render(<Button variant={variant}>v</Button>)
      expect(screen.getByRole('button').className).toContain('rounded-full')
      unmount()
    },
  )

  it('supports the sm/md/lg size ramp', () => {
    const { rerender } = render(<Button size="sm">s</Button>)
    expect(screen.getByRole('button').className).toContain('text-xs')
    rerender(<Button size="md">m</Button>)
    expect(screen.getByRole('button').className).toContain('text-sm')
    rerender(<Button size="lg">l</Button>)
    expect(screen.getByRole('button').className).toContain('text-base')
  })

  // Resting height floors unchanged this slice: sm 40 / md 44 / lg 48.
  it('keeps the min-height touch floor per size (sm→min-h-10, md→min-h-11, lg→min-h-12)', () => {
    const { rerender } = render(<Button size="sm">s</Button>)
    expect(screen.getByRole('button').className).toContain('min-h-10')
    rerender(<Button size="md">m</Button>)
    expect(screen.getByRole('button').className).toContain('min-h-11')
    rerender(<Button size="lg">l</Button>)
    expect(screen.getByRole('button').className).toContain('min-h-12')
  })

  it('icon variant is square at the same 40/44/48 floor', () => {
    const { rerender } = render(<Button variant="icon" size="sm">i</Button>)
    expect(screen.getByRole('button').className).toMatch(/\bh-10\b/)
    expect(screen.getByRole('button').className).toMatch(/\bw-10\b/)
    rerender(<Button variant="icon" size="md">i</Button>)
    expect(screen.getByRole('button').className).toMatch(/\bh-11\b/)
    rerender(<Button variant="icon" size="lg">i</Button>)
    expect(screen.getByRole('button').className).toMatch(/\bh-12\b/)
  })

  it('disabled is visibly disabled (opacity + not-allowed cursor)', () => {
    render(<Button disabled>x</Button>)
    const c = screen.getByRole('button').className
    expect(c).toContain('disabled:opacity-50')
    expect(c).toContain('disabled:cursor-not-allowed')
  })

  // Resting primary shadow + hover/press direction unchanged this slice.
  it('keeps the primary shadow and hover/press visual contract', () => {
    render(<Button variant="primary">p</Button>)
    const c = screen.getByRole('button').className
    expect(c).toContain('shadow-lg')
    expect(c).toContain('hover:brightness-110')
    expect(c).toContain('motion-safe:hover:scale-[1.02]')
    expect(c).toContain('motion-safe:active:scale-[0.97]')
  })

  it('gates the icon hover/active scale behind motion-safe', () => {
    render(<Button variant="icon">i</Button>)
    const c = screen.getByRole('button').className
    expect(c).toContain('motion-safe:hover:scale-105')
    expect(c).toContain('motion-safe:active:scale-95')
  })
})
