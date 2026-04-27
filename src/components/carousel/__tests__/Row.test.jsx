import { vi, describe, it, expect, afterEach, beforeEach } from 'vitest'

import { act, useRef } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'

import CarouselRow from '../Row'

function TestCardComponent({ item, isExpanded, hoverPhase, expandAlign, siblingOffset, onCardEnter, onCardLeave, onCardFocus, onCardBlur }) {
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
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
  })

  it('expands and closes as pointer enters and leaves', () => {
    render(<CarouselRow title="Featured" items={items} CardComponent={TestCardComponent} />)

    const alpha = screen.getByRole('button', { name: 'Alpha' })
    // mouseEnter immediately sets intentId → peek phase
    act(() => fireEvent.mouseEnter(alpha))
    expect(alpha).toHaveAttribute('data-phase', 'peek')

    // After CARD_EXPAND_DELAY_MS (180ms), openId is set → expanded
    act(() => vi.advanceTimersByTime(200))
    expect(alpha).toHaveAttribute('data-phase', 'expanded')

    act(() => {
      fireEvent.mouseLeave(alpha)
      vi.runAllTimers()
    })
    expect(alpha).toHaveAttribute('data-phase', 'rest')
    expect(alpha).toHaveAttribute('data-expanded', 'false')
  })

  it('keeps edge alignments and sibling offsets stable', () => {
    render(<CarouselRow title="Featured" items={items} CardComponent={TestCardComponent} />)

    const alpha = screen.getByRole('button', { name: 'Alpha' })
    const beta = screen.getByRole('button', { name: 'Beta' })
    const gamma = screen.getByRole('button', { name: 'Gamma' })

    expect(alpha).toHaveAttribute('data-align', 'left')
    expect(gamma).toHaveAttribute('data-align', 'right')

    // mouseEnter starts the 180ms intent timer; advance past it to get openId set
    act(() => fireEvent.mouseEnter(beta))
    act(() => vi.advanceTimersByTime(200))
    expect(alpha).toHaveAttribute('data-offset', '-18')
    expect(gamma).toHaveAttribute('data-offset', '18')
  })
})
