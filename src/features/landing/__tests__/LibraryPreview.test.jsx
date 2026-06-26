import { afterEach, describe, expect, it } from 'vitest'
import { render, screen, within, fireEvent, cleanup } from '@testing-library/react'
import LibraryPreview from '../components/LibraryPreview'

afterEach(() => cleanup())

const WATCH_FILMS = [
  ['Past Lives', 'Quiet evening'],
  ['Arrival', 'Thoughtful'],
  ['Her', 'Warm sci-fi'],
  ['Moonlight', 'Tender'],
  ['Get Out', 'Tense'],
]
const TOOLS = ['Search by title', 'Filter by mood', 'Recently saved']
const DIARY = [
  ['18', '2026-06-18', 'June 18, 2026', 'Parasite', 'Loved', /changing shape without ever losing control/i],
  ['7', '2026-06-07', 'June 7, 2026', 'Past Lives', 'Liked', /Quiet, exact and still lingering/i],
  ['29', '2026-05-29', 'May 29, 2026', 'Arrival', 'Loved', /emotion arrived before the idea did/i],
  ['11', '2026-05-11', 'May 11, 2026', 'Moonlight', 'Loved', /Tender without simplifying anything/i],
]

describe('LibraryPreview — section + tabs', () => {
  it('keeps section id, eyebrow, heading, supporting copy, illustrative label, two ordered tabs (Watchlist default)', () => {
    const { container } = render(<LibraryPreview />)
    expect(container.querySelector('section#library')).not.toBeNull()
    expect(screen.getByText('Your film life')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Save the future. Remember the past.')
    expect(screen.getByText(/Watchlist keeps saved films easy to retrieve/i)).toBeInTheDocument()
    expect(screen.getByText(/Neither becomes another feed\./i)).toBeInTheDocument()
    expect(screen.getByText('Illustrative private library')).toBeInTheDocument()

    const tabs = screen.getAllByRole('tab')
    expect(tabs).toHaveLength(2)
    expect(tabs[0]).toHaveTextContent('Watchlist')
    expect(tabs[1]).toHaveTextContent('Diary')
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true')

    for (const tab of tabs) {
      const id = tab.getAttribute('aria-controls')
      expect(id).toBeTruthy()
      expect(container.querySelector(`#${id}`)).not.toBeNull()
    }
    const wl = container.querySelector('#ff-l-library-panel-watchlist')
    const di = container.querySelector('#ff-l-library-panel-diary')
    expect(wl.hidden).toBe(false)
    expect(di.hidden).toBe(true)
    expect(wl.getAttribute('aria-labelledby')).toBe('ff-l-library-tab-watchlist')
    expect(di.getAttribute('aria-labelledby')).toBe('ff-l-library-tab-diary')
  })
})

describe('LibraryPreview — Watchlist (retrieval grid)', () => {
  it('shows the internal heading, description, retrieval tools, and five ordered films with meta + poster alt', () => {
    const { container } = render(<LibraryPreview />)
    const wl = container.querySelector('#ff-l-library-panel-watchlist')
    expect(within(wl).getByRole('heading', { level: 3, name: 'Saved for later' })).toBeInTheDocument()
    expect(within(wl).getByText(/A calm place to find the film you saved/i)).toBeInTheDocument()
    for (const t of TOOLS) expect(within(wl).getByText(t)).toBeInTheDocument()

    const grid = wl.querySelector('.ff-l-watch-grid')
    const items = within(grid).getAllByRole('listitem')
    expect(items).toHaveLength(5)
    WATCH_FILMS.forEach(([title, meta], i) => {
      expect(within(items[i]).getByText(title)).toBeInTheDocument()
      expect(within(items[i]).getByText(meta)).toBeInTheDocument()
      expect(within(items[i]).getByRole('img', { name: `${title} poster` })).toBeInTheDocument()
    })
  })

  it('retrieval tools and the grid are not interactive controls (no buttons/inputs/links inside the panel)', () => {
    const { container } = render(<LibraryPreview />)
    const wl = container.querySelector('#ff-l-library-panel-watchlist')
    // The only interactive tab controls live OUTSIDE the panel (in the tablist).
    expect(wl.querySelectorAll('button, input, select, textarea, a, [role="button"]')).toHaveLength(0)
    // Tools are list items, not focusable controls.
    const tools = wl.querySelector('.ff-l-tools__list')
    expect(within(tools).getAllByRole('listitem')).toHaveLength(3)
    expect(tools.querySelector('[tabindex]')).toBeNull()
  })
})

describe('LibraryPreview — Diary (chronological record)', () => {
  it('reveals the chronological panel on activation, hides Watchlist, and shows heading + description', () => {
    const { container } = render(<LibraryPreview />)
    fireEvent.click(screen.getByRole('tab', { name: /diary/i }))
    const wl = container.querySelector('#ff-l-library-panel-watchlist')
    const di = container.querySelector('#ff-l-library-panel-diary')
    expect(di.hidden).toBe(false)
    expect(wl.hidden).toBe(true)
    expect(within(di).getByRole('heading', { level: 3, name: 'A record of how films landed' })).toBeInTheDocument()
    expect(within(di).getByText(/Watched films stay in chronological order/i)).toBeInTheDocument()
  })

  it('groups entries by month (June 2026 then May 2026) in chronological order with date, title, reaction, note, poster alt', () => {
    const { container } = render(<LibraryPreview />)
    fireEvent.click(screen.getByRole('tab', { name: /diary/i }))
    const di = container.querySelector('#ff-l-library-panel-diary')

    const months = within(di).getAllByRole('heading', { level: 4 })
    expect(months.map((m) => m.textContent)).toEqual(['June 2026', 'May 2026'])

    const entries = di.querySelectorAll('.ff-l-diary-entry')
    expect(entries).toHaveLength(4)
    DIARY.forEach(([day, datetime, dateLabel, title, reaction, note], i) => {
      const e = entries[i]
      // Date: visible day digit + machine-readable <time datetime> + accessible full date.
      const timeEl = within(e).getByText(day).closest('time')
      expect(timeEl).not.toBeNull()
      expect(timeEl).toHaveAttribute('datetime', datetime)
      expect(timeEl).toHaveAttribute('aria-label', dateLabel)
      expect(within(e).getByText(title)).toBeInTheDocument()
      expect(within(e).getByText(reaction)).toBeInTheDocument()
      expect(within(e).getByText(note)).toBeInTheDocument()
      expect(within(e).getByRole('img', { name: `${title} poster` })).toBeInTheDocument()
    })

    // Chronology is verified from the live DOM (independent of fixture order): the rendered
    // entry dates must be strictly newest-first. (Non-stickiness is checked in the E2E,
    // where real CSS is applied — jsdom does not apply the stylesheet.)
    const rendered = [...di.querySelectorAll('.ff-l-diary-entry time[datetime]')].map((t) => t.getAttribute('datetime'))
    expect(rendered).toHaveLength(4)
    expect(rendered).toEqual([...rendered].sort((a, b) => (a < b ? 1 : a > b ? -1 : 0)))
  })

  it('Diary is a chronological record, not the Watchlist poster grid', () => {
    const { container } = render(<LibraryPreview />)
    fireEvent.click(screen.getByRole('tab', { name: /diary/i }))
    const di = container.querySelector('#ff-l-library-panel-diary')
    expect(di.querySelector('.ff-l-watch-grid')).toBeNull()
    expect(di.querySelectorAll('.ff-l-diary-entry').length).toBeGreaterThan(0)
  })
})

describe('LibraryPreview — integrity (no feed / social / false precision)', () => {
  it('has no star rating, match %, public social counts, recommendation-feed language, or links/fake CTAs', () => {
    const { container } = render(<LibraryPreview />)
    const txt = container.textContent // both panels are in the DOM
    expect(txt).not.toMatch(/\d+\s*%/)
    expect(txt).not.toMatch(/★|⭐|\d(?:\.\d)?\s*\/\s*5\b/)
    expect(txt).not.toMatch(/\b\d+\s*(?:likes?|views?|comments?|followers?|watching)\b/i)
    expect(txt).not.toMatch(/recommended for you|trending|popular this week|activity feed/i)
    expect(container.querySelectorAll('a')).toHaveLength(0)
    expect(container.querySelectorAll('button:not([role="tab"])')).toHaveLength(0)
  })
})
