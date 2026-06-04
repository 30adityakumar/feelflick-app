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
})
