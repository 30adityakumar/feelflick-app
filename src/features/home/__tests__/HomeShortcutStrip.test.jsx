import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import HomeShortcutStrip from '../components/HomeShortcutStrip'

describe('HomeShortcutStrip', () => {
  it('renders the three shortcuts with correct destinations', () => {
    render(<MemoryRouter><HomeShortcutStrip /></MemoryRouter>)
    const nav = screen.getByRole('navigation', { name: 'Quick actions' })
    expect(nav).toBeInTheDocument()

    const match = screen.getByRole('link', { name: /Match the moment/i })
    expect(match).toHaveAttribute('href', '/discover')
    expect(screen.getByText('Mood, company, and time')).toBeInTheDocument()

    const browse = screen.getByRole('link', { name: /Browse your way/i })
    expect(browse).toHaveAttribute('href', '/browse')

    // Log a movie is a button that opens global search, not a nav link.
    const log = screen.getByRole('button', { name: /Log a movie/i })
    expect(log).toBeInTheDocument()
  })

  it('dispatches ff:open-search when Log a movie is clicked', () => {
    render(<MemoryRouter><HomeShortcutStrip /></MemoryRouter>)
    const listener = vi.fn()
    window.addEventListener('ff:open-search', listener)
    fireEvent.click(screen.getByRole('button', { name: /Log a movie/i }))
    expect(listener).toHaveBeenCalledTimes(1)
    window.removeEventListener('ff:open-search', listener)
  })
})
