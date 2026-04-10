import { act, useRef } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'

vi.hoisted(() => {
  vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co')
  vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key')
  vi.stubEnv('VITE_TMDB_API_KEY', 'test-tmdb-key')
})

import CarouselRow from '../Row'

function TestCardComponent({
  item,
  isExpanded,
  hoverPhase,
  expandAlign,
  siblingOffset,
  onCardEnter,
  onCardLeave,
  onCardFocus,
  onCardBlur,
}) {
  const ref = useRef(null)

  return (
    <button
      ref={ref}
      type="button"
      aria-label={item.title}
      data-expanded={isExpanded ? 'true' : 'false'}
      data-phase={hoverPhase}
      data-align={expandAlign}
      data-offset={String(siblingOffset ?? 0)}
      onMouseEnter={() => onCardEnter?.(item, ref.current)}
      onMouseLeave={(event) => onCardLeave?.(event.relatedTarget)}
      onFocus={() => onCardFocus?.(item, ref.current)}
      onBlur={(event) => onCardBlur?.(event.relatedTarget)}
    >
      {item.title}
    </button>
  )
}

const items = [
  { id: 'a', title: 'Alpha', poster_path: '/alpha.jpg' },
  { id: 'b', title: 'Beta', poster_path: '/beta.jpg' },
  { id: 'c', title: 'Gamma', poster_path: '/gamma.jpg' },
]

describe('CarouselRow hover choreography', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    Object.defineProperty(window, 'innerWidth', {
      value: 1280,
      writable: true,
      configurable: true,
    })
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
  })

  it('expands immediately on hover', () => {
    render(<CarouselRow title="Featured" items={items} CardComponent={TestCardComponent} />)

    const alpha = screen.getByRole('button', { name: 'Alpha' })

    act(() => {
      fireEvent.mouseEnter(alpha)
    })

    expect(alpha).toHaveAttribute('data-phase', 'expanded')
    expect(alpha).toHaveAttribute('data-expanded', 'true')
  })

  it('closes after the pointer leaves', () => {
    render(<CarouselRow title="Featured" items={items} CardComponent={TestCardComponent} />)

    const alpha = screen.getByRole('button', { name: 'Alpha' })

    act(() => {
      fireEvent.mouseEnter(alpha)
      fireEvent.mouseLeave(alpha)
      vi.runAllTimers()
    })

    expect(alpha).toHaveAttribute('data-phase', 'rest')
    expect(alpha).toHaveAttribute('data-expanded', 'false')
  })

  it('uses the same immediate expansion flow for keyboard focus', () => {
    render(<CarouselRow title="Featured" items={items} CardComponent={TestCardComponent} />)

    const alpha = screen.getByRole('button', { name: 'Alpha' })

    act(() => {
      fireEvent.focus(alpha)
    })

    expect(alpha).toHaveAttribute('data-phase', 'expanded')
    expect(alpha).toHaveAttribute('data-expanded', 'true')
  })

  it('clears pending and active hover states when the row scrolls', () => {
    render(<CarouselRow title="Featured" items={items} CardComponent={TestCardComponent} />)

    const alpha = screen.getByRole('button', { name: 'Alpha' })
    const scrollArea = screen.getByTestId('carousel-scroll-region')

    act(() => {
      fireEvent.mouseEnter(alpha)
      fireEvent.scroll(scrollArea, { target: { scrollLeft: 120 } })
    })

    expect(alpha).toHaveAttribute('data-phase', 'rest')

    act(() => {
      fireEvent.mouseEnter(alpha)
      fireEvent.scroll(scrollArea, { target: { scrollLeft: 240 } })
    })

    expect(alpha).toHaveAttribute('data-phase', 'rest')
    expect(alpha).toHaveAttribute('data-expanded', 'false')
  })

  it('biases the first and last cards inward to avoid edge clipping', () => {
    render(<CarouselRow title="Featured" items={items} CardComponent={TestCardComponent} />)

    expect(screen.getByRole('button', { name: 'Alpha' })).toHaveAttribute('data-align', 'left')
    expect(screen.getByRole('button', { name: 'Gamma' })).toHaveAttribute('data-align', 'right')
  })

  it('nudges immediate neighbors away from an expanded card to reduce awkward overlap', () => {
    render(<CarouselRow title="Featured" items={items} CardComponent={TestCardComponent} />)

    const alpha = screen.getByRole('button', { name: 'Alpha' })
    const beta = screen.getByRole('button', { name: 'Beta' })
    const gamma = screen.getByRole('button', { name: 'Gamma' })

    act(() => {
      fireEvent.mouseEnter(beta)
    })

    expect(beta).toHaveAttribute('data-phase', 'expanded')
    expect(alpha).toHaveAttribute('data-offset', '-18')
    expect(gamma).toHaveAttribute('data-offset', '18')
  })
})
