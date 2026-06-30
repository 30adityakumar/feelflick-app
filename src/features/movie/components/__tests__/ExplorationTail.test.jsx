import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

import ExplorationTail from '../ExplorationTail'

const SIMILAR = Array.from({ length: 6 }, (_, i) => ({
  key: `s${i}`, tmdbId: 100 + i, title: `Sim ${i}`, year: 2010 + i, poster: `p${i}.jpg`,
  dir: `Dir ${i}`, why: `Shares mood ${i}`, match: 80 - i,
}))
const DIRECTOR = Array.from({ length: 6 }, (_, i) => ({
  tmdbId: 200 + i, title: `Dir film ${i}`, year: 2000 + i, poster: `d${i}.jpg`, yourRating: i === 0 ? 4 : null,
}))

describe('ExplorationTail — restrained exploration (F5.6)', () => {
  it('24/25/26. self-hides when both empty; otherwise shows "Continue the thread" as a plain section', () => {
    const { container } = render(<ExplorationTail similar={[]} directorFilms={[]} onOpenMovie={() => {}} />)
    expect(container).toBeEmptyDOMElement()
    render(<ExplorationTail similar={SIMILAR} directorFilms={[]} onOpenMovie={() => {}} />)
    expect(screen.getByText('Continue the thread')).toBeInTheDocument()
    // no disclosure toggle — no <details> element
    expect(document.querySelector('details')).toBeNull()
  })

  it('30/31/32. caps total at 5 in source order (similar fills first, director backfills)', () => {
    render(<ExplorationTail similar={SIMILAR} directorFilms={DIRECTOR} onOpenMovie={() => {}} />)
    // similar fills all 5 slots; director gets none
    const simButtons = screen.getAllByRole('button', { name: /^Open Sim/ })
    expect(simButtons.length).toBe(5)
    expect(simButtons.map((b) => b.getAttribute('aria-label'))).toEqual([
      'Open Sim 0 (2010)', 'Open Sim 1 (2011)', 'Open Sim 2 (2012)', 'Open Sim 3 (2013)', 'Open Sim 4 (2014)',
    ])
    expect(screen.queryAllByRole('button', { name: /^Open Dir film/ }).length).toBe(0)
  })

  it('30b. director backfills remaining slots when similar is short', () => {
    render(<ExplorationTail similar={SIMILAR.slice(0, 3)} directorFilms={DIRECTOR} onOpenMovie={() => {}} />)
    expect(screen.getAllByRole('button', { name: /^Open Sim/ }).length).toBe(3)
    expect(screen.getAllByRole('button', { name: /^Open Dir film/ }).length).toBe(2)
  })

  it('33/34. has NO reshuffle / pagination / load-more control', () => {
    render(<ExplorationTail similar={SIMILAR} directorFilms={DIRECTOR} onOpenMovie={() => {}} />)
    expect(screen.queryByText(/show me more|load more|reshuffle/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /next|previous|more|shuffle/i })).not.toBeInTheDocument()
  })

  it('35/36. no user-match %, but the honest similar "why" text remains', () => {
    const { container } = render(<ExplorationTail similar={SIMILAR} directorFilms={[]} onOpenMovie={() => {}} />)
    expect(container.textContent).not.toMatch(/\d+\s*%/)
    expect(screen.getByText('Shares mood 0')).toBeInTheDocument()
  })

  it('37. real director "your rating" badge remains (NEW-TO-YOU dropped)', () => {
    const { container } = render(<ExplorationTail similar={[]} directorFilms={DIRECTOR} onOpenMovie={() => {}} />)
    expect(container.textContent).toContain('4★ YOU')
    expect(container.textContent).not.toMatch(/NEW TO YOU/)
  })

  it('38. the open-movie callback receives the unchanged TMDB id', () => {
    const onOpenMovie = vi.fn()
    render(<ExplorationTail similar={SIMILAR} directorFilms={[]} onOpenMovie={onOpenMovie} />)
    fireEvent.click(screen.getByRole('button', { name: 'Open Sim 0 (2010)' }))
    expect(onOpenMovie).toHaveBeenCalledWith(100)
  })

  it('does not mutate the source arrays', () => {
    const sim = [...SIMILAR]
    const dir = [...DIRECTOR]
    render(<ExplorationTail similar={sim} directorFilms={dir} onOpenMovie={() => {}} />)
    expect(sim).toEqual(SIMILAR)
    expect(dir).toEqual(DIRECTOR)
    expect(sim.length).toBe(6)
  })
})
