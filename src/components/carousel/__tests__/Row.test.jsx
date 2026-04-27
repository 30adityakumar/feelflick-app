import { vi, describe, it, expect, afterEach, beforeEach } from 'vitest'

import { act, useRef } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'

import CarouselRow from '../Row'

function TestCardComponent({ item, hovered, onCardEnter, onCardLeave, onCardFocus, onCardBlur }) {
  const ref = useRef(null)

  return (
    <button
      ref={ref}
      type="button"
      aria-label={item.title}
      data-hovered={hovered ? 'true' : 'false'}
      onMouseEnter={() => onCardEnter?.(item, ref.current)}
      onMouseLeave={() => onCardLeave?.()}
      onFocus={() => onCardFocus?.(item, ref.current)}
      onBlur={() => onCardBlur?.()}
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

  it('hovering a card sets data-hovered and leaving clears it', () => {
    render(<CarouselRow title="Featured" items={items} CardComponent={TestCardComponent} />)

    const alpha = screen.getByRole('button', { name: 'Alpha' })

    act(() => fireEvent.mouseEnter(alpha))
    expect(alpha).toHaveAttribute('data-hovered', 'true')

    act(() => {
      fireEvent.mouseLeave(alpha)
      vi.runAllTimers()
    })
    expect(alpha).toHaveAttribute('data-hovered', 'false')
  })
})
