import { afterEach, describe, expect, it } from 'vitest'
import { render, screen, within, cleanup } from '@testing-library/react'
import PrinciplesStrip from '../components/PrinciplesStrip'
import { PRINCIPLES } from '../data'

afterEach(() => cleanup())

const EXPECTED = [
  ['Fewer directions, chosen well.', /narrows the field instead of giving you another endless shelf/i],
  ['Reasons you can understand.', /signals behind it.*not a mysterious match score/i],
  ['Taste that keeps evolving.', /watches, ratings, saves, skips and reactions/i],
]

describe('PRINCIPLES data', () => {
  it('is exactly three principles in the refined order', () => {
    expect(PRINCIPLES).toHaveLength(3)
    expect(PRINCIPLES.map((p) => p.title)).toEqual(EXPECTED.map((e) => e[0]))
  })
})

describe('PrinciplesStrip', () => {
  it('renders an ordered list of exactly three principles with numbers, headings, and copy in order', () => {
    const { container } = render(<PrinciplesStrip />)
    const list = container.querySelector('ol')
    expect(list).not.toBeNull()
    const items = within(list).getAllByRole('listitem')
    expect(items).toHaveLength(3)
    EXPECTED.forEach(([title, body], i) => {
      const li = items[i]
      expect(within(li).getByRole('heading').textContent).toBe(title)
      expect(within(li).getByText(body)).toBeInTheDocument()
      expect(within(li).getByText(`0${i + 1}`)).toBeInTheDocument()
    })
  })

  it('has a quiet section heading and logical order (section h2 + three item h3)', () => {
    render(<PrinciplesStrip />)
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(/what makes feelflick different/i)
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(3)
  })

  it('is a quiet manifesto: no links/buttons/interactive controls; no % match score; no Hero copy', () => {
    const { container } = render(<PrinciplesStrip />)
    expect(container.querySelectorAll('a, button, [role="button"], [role="tab"], [role="switch"]')).toHaveLength(0)
    expect(container.textContent).not.toMatch(/\d+\s*%/)
    expect(container.textContent).not.toMatch(/movies, made personal/i)
  })

  it('decorative numbers are aria-hidden (the ordered list carries position semantics)', () => {
    const { container } = render(<PrinciplesStrip />)
    const nums = container.querySelectorAll('.ff-l-principle__n')
    expect(nums).toHaveLength(3)
    nums.forEach((n) => expect(n).toHaveAttribute('aria-hidden', 'true'))
  })
})
