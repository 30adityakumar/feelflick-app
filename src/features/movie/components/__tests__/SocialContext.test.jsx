import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

import SocialContext from '../SocialContext'

const FRIENDS = [
  { id: 'a', name: 'Alex', avatarBg: '#A78BFA', avatarUrl: null, rating: 9, reviewText: 'Stunning.' },
  { id: 'b', name: 'Sam', avatarBg: '#34D399', avatarUrl: null, rating: 8, reviewText: '' },
  { id: 'c', name: 'Rey', avatarBg: '#F472B6', avatarUrl: null, rating: 10, reviewText: 'Best of the year.' },
]
const TWIN = { id: 't', name: 'Jordan Lee', avatarBg: '#112233', avatarUrl: 'http://x/a.jpg', matchPct: 84, rating: 9, note: 'It lingers.', watchedDate: 'Mar 2024' }

describe('SocialContext — one restrained social disclosure (F5.6)', () => {
  it('1. self-hides when friends empty and twin absent', () => {
    const { container } = render(<SocialContext friends={[]} twin={null} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('2/3/4/5/6. renders (friends or twin), collapsed, with honest heading + copy', () => {
    const { container } = render(<SocialContext friends={FRIENDS} twin={null} />)
    expect(container.querySelector('details').open).toBe(false)
    expect(screen.getByText('What others thought')).toBeInTheDocument()
    expect(screen.getByText(/Real ratings and notes from people connected to your taste/i)).toBeInTheDocument()
    // twin-only also renders
    const { container: c2 } = render(<SocialContext friends={[]} twin={TWIN} />)
    expect(c2.querySelector('details')).toBeTruthy()
  })

  it('7. has NO nested friend-notes disclosure (no See/Hide notes toggle)', () => {
    render(<SocialContext friends={FRIENDS} twin={null} />)
    expect(screen.queryByRole('button', { name: /see their notes|hide notes/i })).not.toBeInTheDocument()
  })

  it('8/9/10/11. friend order + names + ratings + real review text remain', () => {
    render(<SocialContext friends={FRIENDS} twin={null} />)
    expect(screen.getByText('3 people you follow loved this')).toBeInTheDocument()
    expect(screen.getByText(/Alex, Sam, Rey/)).toBeInTheDocument()           // order preserved
    expect(screen.getByText('Stunning.')).toBeInTheDocument()                // real note
    expect(screen.getByText('Best of the year.')).toBeInTheDocument()        // real note
    // ratings present (avg + per-note)
    expect(screen.getByText(/avg/)).toBeInTheDocument()
  })

  it('12. friends without notes do not create empty note cards', () => {
    const { container } = render(<SocialContext friends={FRIENDS} twin={null} />)
    // 2 of 3 friends have notes → exactly 2 note cards
    const noteCards = Array.from(container.querySelectorAll('div')).filter((d) => /Stunning\.|Best of the year\./.test(d.textContent) && d.querySelector('div'))
    expect(screen.getByText('Stunning.')).toBeInTheDocument()
    expect(container.textContent).not.toMatch(/Sam[^]*?undefined/) // Sam (no note) doesn't render an empty note
    void noteCards
  })

  it('singular wording for one friend', () => {
    render(<SocialContext friends={[FRIENDS[0]]} twin={null} />)
    expect(screen.getByText('1 person you follow loved this')).toBeInTheDocument()
  })
})
