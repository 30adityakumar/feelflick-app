import { afterEach, describe, expect, it } from 'vitest'
import { render, screen, within, cleanup } from '@testing-library/react'
import ProductEntrances from '../components/ProductEntrances'
import { ENTRANCES } from '../data'

afterEach(() => cleanup())

const EXPECTED = [
  { n: '01', destination: 'Discover', title: 'For tonight.', example: /quiet · two people · under two hours/i, copy: /shape one focused screening/i },
  { n: '02', destination: 'Home', title: 'From your taste.', example: /because you return to precise/i, copy: /explore recommendations, recurring themes/i },
  { n: '03', destination: 'Browse', title: 'Follow a curiosity.', example: /korean thrillers · 2000s · slow-burn/i, copy: /browse deliberately by genre/i },
]

describe('ENTRANCES data', () => {
  it('is exactly three entrances in order with the right destinations and no obsolete keys', () => {
    expect(ENTRANCES).toHaveLength(3)
    expect(ENTRANCES.map((e) => e.destination)).toEqual(['Discover', 'Home', 'Browse'])
    expect(ENTRANCES.map((e) => e.title)).toEqual(['For tonight.', 'From your taste.', 'Follow a curiosity.'])
    expect(ENTRANCES.every((e) => e.n && e.example && e.copy)).toBe(true)
    expect(ENTRANCES.every((e) => !('maps' in e))).toBe(true)
  })
})

describe('ProductEntrances', () => {
  it('keeps the #how-it-works section id and shows the visible heading + supporting copy', () => {
    const { container } = render(<ProductEntrances />)
    expect(container.querySelector('section#how-it-works')).not.toBeNull()
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Start with the question you actually have.')
    expect(screen.getByText(/keeps each path distinct instead of forcing every movie question into one feed/i)).toBeInTheDocument()
  })

  it('renders an ordered list of three entrances: destination, h3 title, example, description in order', () => {
    const { container } = render(<ProductEntrances />)
    const list = container.querySelector('ol')
    expect(list).not.toBeNull()
    const items = within(list).getAllByRole('listitem')
    expect(items).toHaveLength(3)
    EXPECTED.forEach((e, i) => {
      const li = items[i]
      expect(within(li).getByRole('heading', { level: 3 })).toHaveTextContent(e.title)
      expect(within(li).getByText(e.destination)).toBeInTheDocument()
      expect(within(li).getByText(e.example)).toBeInTheDocument()
      expect(within(li).getByText(e.copy)).toBeInTheDocument()
      expect(within(li).getByText(e.n)).toBeInTheDocument()
    })
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(3)
  })

  it('is explanatory only: no links/buttons/auth CTA/fake controls; no repeated principles copy', () => {
    const { container } = render(<ProductEntrances />)
    expect(container.querySelectorAll('a, button, [role="button"], [role="link"], input, select')).toHaveLength(0)
    expect(screen.queryByText(/continue with google/i)).toBeNull()
    expect(screen.queryByText(/opening google/i)).toBeNull()
    expect(container.textContent).not.toMatch(/fewer directions, chosen well/i)
  })

  it('decorative numbers are aria-hidden; destinations stay available to assistive tech', () => {
    const { container } = render(<ProductEntrances />)
    const nums = container.querySelectorAll('.ff-l-entrance__n')
    expect(nums).toHaveLength(3)
    nums.forEach((n) => expect(n).toHaveAttribute('aria-hidden', 'true'))
    container.querySelectorAll('.ff-l-entrance__dest').forEach((d) => expect(d).not.toHaveAttribute('aria-hidden'))
  })
})
