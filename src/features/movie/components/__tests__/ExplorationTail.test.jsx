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

describe('ExplorationTail — restrained exploration disclosure (F5.6)', () => {
  it('24/25/26. self-hides when both empty; otherwise collapsed under "Explore from here"', () => {
    const { container } = render(<ExplorationTail similar={[]} directorFilms={[]} onOpenMovie={() => {}} />)
    expect(container).toBeEmptyDOMElement()
    const { container: c2 } = render(<ExplorationTail similar={SIMILAR} directorFilms={[]} onOpenMovie={() => {}} />)
    expect(c2.querySelector('details').open).toBe(false)
    expect(screen.getByText('Explore from here')).toBeInTheDocument()
    expect(screen.getByText(/A few nearby films—similar in spirit or from the same director/i)).toBeInTheDocument()
  })

  it('27. similar-only renders only the "Similar in spirit" subsection', () => {
    render(<ExplorationTail similar={SIMILAR} directorFilms={[]} onOpenMovie={() => {}} />)
    expect(screen.getByText('Similar in spirit')).toBeInTheDocument()
    expect(screen.queryByText(/More from/i)).not.toBeInTheDocument()
  })

  it('28. director-only renders only the "More from …" subsection', () => {
    render(<ExplorationTail similar={[]} directorFilms={DIRECTOR} directorName="Bong Joon-ho" onOpenMovie={() => {}} />)
    expect(screen.getByText('More from Bong Joon-ho')).toBeInTheDocument()
    expect(screen.queryByText('Similar in spirit')).not.toBeInTheDocument()
  })

  it('29. both subsections render when both arrays have data', () => {
    render(<ExplorationTail similar={SIMILAR} directorFilms={DIRECTOR} directorName="Bong Joon-ho" onOpenMovie={() => {}} />)
    expect(screen.getByText('Similar in spirit')).toBeInTheDocument()
    expect(screen.getByText('More from Bong Joon-ho')).toBeInTheDocument()
  })

  it('30/31/32. caps each subsection at 4, in source order', () => {
    render(<ExplorationTail similar={SIMILAR} directorFilms={DIRECTOR} onOpenMovie={() => {}} />)
    const simButtons = screen.getAllByRole('button', { name: /^Open Sim/ })
    expect(simButtons.length).toBe(4)
    expect(simButtons.map((b) => b.getAttribute('aria-label'))).toEqual([
      'Open Sim 0 (2010)', 'Open Sim 1 (2011)', 'Open Sim 2 (2012)', 'Open Sim 3 (2013)',
    ])
    expect(screen.getAllByRole('button', { name: /^Open Dir film/ }).length).toBe(4)
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

  it('39/40. full-filmography link opens TMDB in a new tab with safe rel', () => {
    render(<ExplorationTail similar={[]} directorFilms={DIRECTOR} directorId={42} onOpenMovie={() => {}} />)
    const link = screen.getByRole('link', { name: /Full filmography/i })
    expect(link).toHaveAttribute('href', 'https://www.themoviedb.org/person/42')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link.getAttribute('rel')).toMatch(/noopener/)
    expect(link.textContent).toMatch(/opens in a new tab/i)
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
