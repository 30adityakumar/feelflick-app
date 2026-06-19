import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createRef } from 'react'

import Button from '../Button'

// Adaptive Editorial Cinema (ADR 021) button contract:
//   • text buttons are restrained rounded RECTANGLES (rounded-xl), not pills;
//   • only icon-only controls are circles (rounded-full);
//   • the primary action is the one neutral inverse (paper-white) fill — never the
//     coral accent and never a purple/pink gradient;
//   • hover clarifies (brightness), press is a subtle 1px translate (no dramatic scale/glow);
//   • 44px touch floor (sm/md = min-h-11, lg = min-h-12);
//   • loading/disabled/focus/native-type/accessible-name behaviour is preserved.
describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
  })

  // ── Variant identity ─────────────────────────────────────────────────────
  it('primary is the neutral inverse action (paper-white fill, ink text) — never brand/purple', () => {
    render(<Button variant="primary">Primary</Button>)
    const c = screen.getByRole('button').className
    expect(c).toContain('bg-[var(--color-action-primary-fill')
    expect(c).toContain('text-[var(--color-action-primary-text')
    expect(c).not.toContain('from-purple-600')
    expect(c).not.toMatch(/brand-accent|brand-rose/)
  })

  it('text variants use restrained rounded rectangles (rounded-xl), not pills', () => {
    for (const variant of ['primary', 'secondary', 'ghost', 'destructive']) {
      const { unmount } = render(<Button variant={variant}>v</Button>)
      const c = screen.getByRole('button').className
      expect(c, `${variant} should be rounded-xl`).toContain('rounded-xl')
      expect(c, `${variant} should not be a pill`).not.toContain('rounded-full')
      unmount()
    }
  })

  it('icon-only controls are circles (rounded-full)', () => {
    render(<Button variant="icon">Icon</Button>)
    const c = screen.getByRole('button').className
    expect(c).toContain('rounded-full')
    expect(c).not.toContain('rounded-xl')
  })

  it('secondary / ghost use semantic surface + border tokens (no raw white-opacity drift)', () => {
    const { rerender } = render(<Button variant="secondary">s</Button>)
    let c = screen.getByRole('button').className
    expect(c).toContain('border-[var(--color-border-subtle')
    expect(c).toContain('text-[var(--color-text-secondary')
    expect(c).not.toContain('text-white/')
    expect(c).not.toContain('bg-white/')
    rerender(<Button variant="ghost">g</Button>)
    c = screen.getByRole('button').className
    expect(c).toContain('text-[var(--color-text-secondary')
    expect(c).not.toContain('bg-white/')
  })

  it('destructive uses the semantic red family (load-bearing, not brand)', () => {
    render(<Button variant="destructive">Delete</Button>)
    expect(screen.getByRole('button').className).toMatch(/red-\d/)
  })

  // ── Native button type ───────────────────────────────────────────────────
  it('defaults to type="button" (no accidental form submit)', () => {
    render(<Button>x</Button>)
    expect(screen.getByRole('button').getAttribute('type')).toBe('button')
  })

  it('preserves an explicit type="submit"', () => {
    render(<Button type="submit">Save</Button>)
    expect(screen.getByRole('button').getAttribute('type')).toBe('submit')
  })

  // ── Loading semantics ────────────────────────────────────────────────────
  it('loading disables the button', () => {
    render(<Button loading>Save</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('loading sets aria-busy="true" and data-loading="true"', () => {
    render(<Button loading>Save</Button>)
    const btn = screen.getByRole('button')
    expect(btn.getAttribute('aria-busy')).toBe('true')
    expect(btn.getAttribute('data-loading')).toBe('true')
  })

  it('loading preserves the accessible name (label not removed)', () => {
    render(<Button loading>Save</Button>)
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument()
  })

  it('loading keeps a width-reserving label node in the DOM (not hidden from AT)', () => {
    render(<Button loading>Save</Button>)
    const label = screen.getByRole('button').querySelector('.ff-btn__label')
    expect(label).toBeTruthy()
    expect(label.textContent).toBe('Save')
    expect(label.getAttribute('aria-hidden')).toBeNull()
    expect(label.getAttribute('data-loading-label')).toBe('true')
  })

  it('loading spinner is decorative (aria-hidden) and is the canonical spinner node', () => {
    render(<Button loading>Save</Button>)
    const spinner = screen.getByRole('button').querySelector('.ff-btn__spinner')
    expect(spinner).toBeTruthy()
    expect(spinner.getAttribute('aria-hidden')).toBe('true')
  })

  it('preserves icon+text children inside the loading label (not flattened)', () => {
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

  it('non-loading children render directly (no label/spinner wrapper)', () => {
    render(<Button>Plain</Button>)
    const btn = screen.getByRole('button')
    expect(btn.querySelector('.ff-btn__label')).toBeNull()
    expect(btn.querySelector('.ff-btn__spinner')).toBeNull()
  })

  // ── Controlled-state precedence (caller cannot defeat loading state) ──────
  it('caller cannot re-enable a loading button (disabled is owned)', () => {
    render(<Button loading disabled={false}>Save</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('loading takes precedence over a conflicting caller aria-busy / data-loading', () => {
    const { rerender } = render(<Button loading aria-busy={false}>Save</Button>)
    expect(screen.getByRole('button').getAttribute('aria-busy')).toBe('true')
    rerender(<Button loading data-loading="false">Save</Button>)
    expect(screen.getByRole('button').getAttribute('data-loading')).toBe('true')
  })

  it('preserves a caller aria-busy when not loading; omits both when neither set', () => {
    const { rerender } = render(<Button aria-busy>Idle</Button>)
    expect(screen.getByRole('button').getAttribute('aria-busy')).toBe('true')
    rerender(<Button>Idle</Button>)
    const btn = screen.getByRole('button')
    expect(btn.getAttribute('aria-busy')).toBeNull()
    expect(btn.getAttribute('data-loading')).toBeNull()
  })

  // ── Focus contract (offset paper-white outline owned by Button.css) ──────
  it('uses the canonical focus hook class (ff-btn) shared by every variant; no old ring', () => {
    for (const variant of ['primary', 'secondary', 'ghost', 'icon', 'destructive']) {
      const { unmount } = render(<Button variant={variant}>v</Button>)
      const c = screen.getByRole('button').className
      expect(c, `${variant} keeps ff-btn`).toContain('ff-btn')
      expect(c).not.toContain('focus-visible:ring')
      expect(c).not.toContain('outline-none')
      unmount()
    }
  })

  // ── Hover/press visual contract (clarify, not glow/scale) ────────────────
  it('primary hover clarifies via brightness and presses via a 1px translate (no scale/glow)', () => {
    render(<Button variant="primary">p</Button>)
    const c = screen.getByRole('button').className
    expect(c).toContain('shadow-sm')
    expect(c).toContain('hover:brightness-95')
    expect(c).toContain('motion-safe:active:translate-y-px')
    expect(c).not.toMatch(/scale-\[/)
    expect(c).not.toMatch(/shadow-glow|drop-shadow/)
  })

  it('icon press is a motion-safe 1px translate (no scale)', () => {
    render(<Button variant="icon">i</Button>)
    const c = screen.getByRole('button').className
    expect(c).toContain('motion-safe:active:translate-y-px')
    expect(c).not.toMatch(/scale-/)
  })

  // ── Size ramp + 44px touch floor ─────────────────────────────────────────
  it('supports the sm/md/lg text ramp', () => {
    const { rerender } = render(<Button size="sm">s</Button>)
    expect(screen.getByRole('button').className).toContain('text-xs')
    rerender(<Button size="md">m</Button>)
    expect(screen.getByRole('button').className).toContain('text-sm')
    rerender(<Button size="lg">l</Button>)
    expect(screen.getByRole('button').className).toContain('text-base')
  })

  it('keeps a 44px touch floor per size (sm/md → min-h-11, lg → min-h-12)', () => {
    const { rerender } = render(<Button size="sm">s</Button>)
    expect(screen.getByRole('button').className).toContain('min-h-11')
    rerender(<Button size="md">m</Button>)
    expect(screen.getByRole('button').className).toContain('min-h-11')
    rerender(<Button size="lg">l</Button>)
    expect(screen.getByRole('button').className).toContain('min-h-12')
  })

  it('icon variant is square at the 44/44/48 floor', () => {
    const { rerender } = render(<Button variant="icon" size="sm">i</Button>)
    expect(screen.getByRole('button').className).toMatch(/\bh-11\b/)
    expect(screen.getByRole('button').className).toMatch(/\bw-11\b/)
    rerender(<Button variant="icon" size="lg">i</Button>)
    expect(screen.getByRole('button').className).toMatch(/\bh-12\b/)
  })

  // ── Invalid size fallback (never throws) ─────────────────────────────────
  it('falls back to the md contract for an invalid ordinary size', () => {
    expect(() => render(<Button size="enormous">x</Button>)).not.toThrow()
    const c = screen.getByRole('button').className
    expect(c).toContain('min-h-11')
    expect(c).toContain('text-sm')
  })

  it('falls back to the md contract for an invalid icon size', () => {
    expect(() => render(<Button variant="icon" size="enormous">i</Button>)).not.toThrow()
    const c = screen.getByRole('button').className
    expect(c).toMatch(/\bh-11\b/)
    expect(c).toMatch(/\bw-11\b/)
  })

  // ── Preserved contract ───────────────────────────────────────────────────
  it('disabled is visibly disabled (opacity + not-allowed) and not clickable', () => {
    const onClick = vi.fn()
    render(<Button disabled onClick={onClick}>Disabled</Button>)
    const btn = screen.getByRole('button')
    expect(btn).toBeDisabled()
    expect(btn.className).toContain('disabled:opacity-50')
    expect(btn.className).toContain('disabled:cursor-not-allowed')
  })

  it('forwards ref to the native button', () => {
    const ref = createRef()
    render(<Button ref={ref}>Ref</Button>)
    expect(ref.current).toBeInstanceOf(HTMLButtonElement)
  })

  it('fullWidth adds w-full', () => {
    render(<Button fullWidth>Wide</Button>)
    expect(screen.getByRole('button').className).toContain('w-full')
  })

  it('merges a custom className', () => {
    render(<Button className="mine">x</Button>)
    expect(screen.getByRole('button').className).toContain('mine')
  })
})
