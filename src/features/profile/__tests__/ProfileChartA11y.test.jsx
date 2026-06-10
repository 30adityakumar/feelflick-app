import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

// jsdom has no IntersectionObserver (MoodRadar uses it) — stub it.
beforeEach(() => {
  vi.stubGlobal('IntersectionObserver', class { observe() {} disconnect() {} unobserve() {} })
})

import { ProfileDataProvider } from '../useProfileData'
import { MoodRadar } from '../sections-top'
import { Trajectory, SignatureDirectors } from '../sections-bottom'

const renderWith = (Comp, value) => render(
  <MemoryRouter><ProfileDataProvider value={{ isSelf: true, ...value }}><Comp /></ProfileDataProvider></MemoryRouter>
)

describe('MoodRadar — F7.5 text equivalent + hidden geometry', () => {
  const moods = [
    { name: 'Reflective', count: 12, weight: 0.74, hex: '#A78BFA' },
    { name: 'Intimate', count: 9, weight: 0.61, hex: '#EC4899' },
    { name: 'Slow-burning', count: 7, weight: 0.5, hex: '#7DD3FC' },
    { name: 'Wry', count: 4, weight: 0.33, hex: '#34D399' },
  ]
  it('wraps the chart in a figure, hides the SVG, and exposes an ordered list with rank words (not raw weights)', () => {
    const { container } = renderWith(MoodRadar, { moods, stats: { filmsLogged: 18, filmsRated: 7 } })
    expect(container.querySelector('figure')?.getAttribute('aria-labelledby')).toBe('ff-mood-title')
    expect(container.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true')
    expect(container.querySelector('ol')).toBeTruthy()                       // ordered text equivalent
    expect(screen.getByText('strongest signal')).toBeInTheDocument()
    expect(screen.getAllByText(/signal/).length).toBeGreaterThanOrEqual(3)   // rank descriptors
    expect(screen.queryByText('74')).not.toBeInTheDocument()                 // no raw weight number
    // summary names the top signals + states the denominator
    expect(screen.getByText(/Reflective, Intimate, Slow-burning/)).toBeInTheDocument()
    expect(screen.getByText(/18 watched films/)).toBeInTheDocument()
  })
  it('the section references its heading', () => {
    const { container } = renderWith(MoodRadar, { moods, stats: { filmsLogged: 18, filmsRated: 7 } })
    expect(container.querySelector('section')?.getAttribute('aria-labelledby')).toBe('ff-mood-title')
    expect(container.querySelector('#ff-mood-title')).toBeTruthy()
  })
})

describe('Trajectory — F7.5 control semantics + hidden bars', () => {
  const value = {
    trajectory: [{ label: 'Jan', count: 3, hex: '#A78BFA' }, { label: 'Feb', count: 5, hex: '#EC4899' }],
    trajectoryAllTime: [{ label: '2024', count: 8, hex: '#A78BFA' }, { label: '2025', count: 12, hex: '#EC4899' }],
  }
  it('uses a button GROUP with aria-pressed (not a partial radiogroup)', () => {
    const { container } = renderWith(Trajectory, value)
    expect(container.querySelector('[role="radiogroup"]')).toBeNull()
    expect(container.querySelector('[role="radio"]')).toBeNull()
    const group = container.querySelector('[role="group"]')
    expect(group?.getAttribute('aria-label')).toBe('Time range')
    const year = screen.getByRole('button', { name: 'Year', pressed: true })
    const allTime = screen.getByRole('button', { name: 'All time', pressed: false })
    fireEvent.click(allTime)
    expect(screen.getByRole('button', { name: 'All time', pressed: true })).toBeInTheDocument()
    expect(year).toHaveAttribute('aria-pressed', 'false')
  })
  it('the section references its heading and the bar geometry is aria-hidden', () => {
    const { container } = renderWith(Trajectory, value)
    expect(container.querySelector('section')?.getAttribute('aria-labelledby')).toBe('ff-traj-title')
    expect(container.querySelector('#ff-traj-title')).toBeTruthy()
    expect(container.querySelectorAll('[aria-hidden="true"]').length).toBeGreaterThan(0) // bar geometry
    // labels + counts remain visible (the text equivalent)
    expect(screen.getByText('Jan')).toBeInTheDocument()
  })
})

describe('SignatureDirectors — F7.5 landmark', () => {
  it('references its heading', () => {
    const { container } = renderWith(SignatureDirectors, {
      directors: [{ name: 'Mara Vance', films: 4, avg: 4.5, accent: '#A78BFA', firstWatchedYear: 2021, signature: '' }],
    })
    expect(container.querySelector('section')?.getAttribute('aria-labelledby')).toBe('ff-dir-title')
    expect(container.querySelector('#ff-dir-title')).toBeTruthy()
  })
})
