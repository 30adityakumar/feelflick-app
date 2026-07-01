import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import DnaCover from '../DnaCover'

const film = (id, over = {}) => ({ id, title: `Film ${id}`, posterPath: over.poster ?? null, backdropPath: over.backdrop ?? null })

describe('DnaCover image selection', () => {
  it('uses a real landscape backdrop when a cover film has backdrop_path', () => {
    const { container } = render(<DnaCover films={[film(1, { backdrop: '/bd1.jpg', poster: '/p1.jpg' })]} />)
    const img = container.querySelector('.dna-cover__backdrop img')
    expect(img).toBeTruthy()
    expect(img.getAttribute('src')).toContain('/bd1.jpg')
    expect(container.querySelector('.dna-cover__frames')).toBeNull()
  })

  it('falls back to a later cover film that has a backdrop (My Four backdrop fallback)', () => {
    const { container } = render(<DnaCover films={[film(1, { poster: '/p1.jpg' }), film(2, { backdrop: '/bd2.jpg' })]} />)
    const img = container.querySelector('.dna-cover__backdrop img')
    expect(img.getAttribute('src')).toContain('/bd2.jpg')
  })

  it('falls back to a poster composition (never a stretched backdrop) when no backdrop exists', () => {
    const { container } = render(<DnaCover films={[film(1, { poster: '/p1.jpg' }), film(2, { poster: '/p2.jpg' })]} />)
    expect(container.querySelector('.dna-cover__backdrop')).toBeNull()
    const frameImgs = container.querySelectorAll('.dna-cover__frame img')
    expect(frameImgs.length).toBe(2)
    expect(frameImgs[0].getAttribute('src')).toContain('/p1.jpg')
  })

  it('shows a neutral, non-fictional fallback when there is no imagery', () => {
    const { container } = render(<DnaCover films={[]} />)
    expect(container.querySelector('.dna-cover__backdrop')).toBeNull()
    expect(container.querySelector('img')).toBeNull()
    expect(container.textContent).toMatch(/cinematic cover appears once films are logged/i)
  })
})
