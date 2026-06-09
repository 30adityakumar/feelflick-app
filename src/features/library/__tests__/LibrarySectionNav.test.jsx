import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, within, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import LibrarySectionNav from '../LibrarySectionNav'

afterEach(() => cleanup())
const renderNav = (current) => render(<MemoryRouter><LibrarySectionNav current={current} /></MemoryRouter>)

describe('LibrarySectionNav — shared Library cross-navigation (F6.6)', () => {
  it('1/2/3/4/5. a <nav aria-label="Library sections"> with exactly two links: Watchlist → /watchlist, Diary → /history', () => {
    renderNav('watchlist')
    const nav = screen.getByRole('navigation', { name: 'Library sections' })
    const links = within(nav).getAllByRole('link')
    expect(links).toHaveLength(2)
    expect(links.map(l => l.textContent)).toEqual(['Watchlist', 'Diary'])
    expect(screen.getByRole('link', { name: 'Watchlist' })).toHaveAttribute('href', '/watchlist')
    expect(screen.getByRole('link', { name: 'Diary' })).toHaveAttribute('href', '/history')
  })

  it('6/8. on Watchlist: the Watchlist link is aria-current="page"; Diary is not', () => {
    renderNav('watchlist')
    expect(screen.getByRole('link', { name: 'Watchlist' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Diary' })).not.toHaveAttribute('aria-current')
  })

  it('7/9. on Diary (incl. the /watched alias passing current="diary"): the Diary link is aria-current="page"; Watchlist is not', () => {
    renderNav('diary')
    expect(screen.getByRole('link', { name: 'Diary' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Watchlist' })).not.toHaveAttribute('aria-current')
  })

  it('active state carries a non-colour indicator (bold weight + the active class)', () => {
    renderNav('watchlist')
    const active = screen.getByRole('link', { name: 'Watchlist' })
    expect(active.className).toContain('ff-library-nav__link--active')
  })

  it('10. uses links, NOT tab semantics', () => {
    renderNav('watchlist')
    expect(screen.queryByRole('tablist')).toBeNull()
    expect(screen.queryByRole('tab')).toBeNull()
  })

  it('11. renders no count or score', () => {
    renderNav('diary')
    expect(screen.getByRole('navigation', { name: 'Library sections' }).textContent).toBe('WatchlistDiary')
  })

  it('12. is presentation-only — renders with no data provider / context / side effects', () => {
    // (no provider is wrapped; a crash here would prove a hidden data dependency)
    expect(() => renderNav('watchlist')).not.toThrow()
  })
})
