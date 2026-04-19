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
    expect(btn.className).toContain('from-purple-500')
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
})
