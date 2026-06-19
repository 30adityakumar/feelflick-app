import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Button from '../Button'

describe('Button', () => {
  it('renders the editorial button shape', () => {
    render(<Button variant="primary">Primary</Button>)
    expect(screen.getByRole('button').className).toContain('rounded-xl')
  })

  it('keeps icon controls circular', () => {
    render(<Button variant="icon">Icon</Button>)
    expect(screen.getByRole('button').className).toContain('rounded-full')
  })
})
