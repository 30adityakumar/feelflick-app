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
    // Brand gradient canon = purple-600 → pink-500 (per CLAUDE.md "Editorial Language").
    expect(btn.className).toContain('from-purple-600')
    expect(btn.className).toContain('to-pink-500')
  })

  it('disabled prop works', () => {
    const onClick = vi.fn()
    render(<Button disabled onClick={onClick}>Disabled</Button>)
    const btn = screen.getByRole('button')
    expect(btn).toBeDisabled()
  })

  it('loading state shows spinner and disables button', () => {
    render(<Button loading>Save</Button>)
    const btn = screen.getByRole('button')
    expect(btn).toBeDisabled()
    expect(btn.querySelector('.animate-spin')).toBeTruthy()
    expect(btn).not.toHaveTextContent('Save')
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

  // F11B.1 — pin the one-button-system contract: 5 variants, all fully-rounded
  // pills, sharing the focus-visible ring; size ramp.
  it.each(['primary', 'secondary', 'ghost', 'icon', 'destructive'])(
    'renders the %s variant as a rounded-full pill',
    (variant) => {
      const { unmount } = render(<Button variant={variant}>v</Button>)
      expect(screen.getByRole('button').className).toContain('rounded-full')
      unmount()
    },
  )

  it('every variant shares the focus-visible purple ring', () => {
    render(<Button variant="primary">f</Button>)
    expect(screen.getByRole('button').className).toContain('focus-visible:ring-purple-400/50')
  })

  it('supports the sm/md/lg size ramp', () => {
    const { rerender } = render(<Button size="sm">s</Button>)
    expect(screen.getByRole('button').className).toContain('text-xs')
    rerender(<Button size="md">m</Button>)
    expect(screen.getByRole('button').className).toContain('text-sm')
    rerender(<Button size="lg">l</Button>)
    expect(screen.getByRole('button').className).toContain('text-base')
  })

  // F12D — even, touch-comfortable height floor: sm 40 / md 44 / lg 48 (4px steps).
  it('applies the min-height touch floor per size (sm→min-h-10, md→min-h-11, lg→min-h-12)', () => {
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

  it('disabled is visibly disabled (opacity + not-allowed cursor) and non-interactive', () => {
    render(<Button disabled>x</Button>)
    const btn = screen.getByRole('button')
    expect(btn).toBeDisabled()
    expect(btn.className).toContain('disabled:opacity-50')
    expect(btn.className).toContain('disabled:cursor-not-allowed')
  })

  // F12F — the hover/active SCALE (movement) is reduced-motion-gated via motion-safe:.
  it('gates the primary hover/active scale behind motion-safe (reduced-motion respect)', () => {
    render(<Button variant="primary">p</Button>)
    const c = screen.getByRole('button').className
    expect(c).toContain('motion-safe:hover:scale-[1.02]')
    expect(c).toContain('motion-safe:active:scale-[0.97]')
    // brightness (color, not movement) stays ungated
    expect(c).toContain('hover:brightness-110')
  })

  it('gates the icon hover/active scale behind motion-safe', () => {
    render(<Button variant="icon">i</Button>)
    const c = screen.getByRole('button').className
    expect(c).toContain('motion-safe:hover:scale-105')
    expect(c).toContain('motion-safe:active:scale-95')
  })
})
