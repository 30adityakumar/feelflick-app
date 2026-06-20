import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import HomeShortcutStrip from '../components/HomeShortcutStrip'

describe('HomeShortcutStrip', () => {
  it('renders the three shortcuts pointing at the real routes', () => {
    render(<MemoryRouter><HomeShortcutStrip /></MemoryRouter>)
    const nav = screen.getByRole('navigation', { name: 'Quick actions' })
    expect(nav).toBeInTheDocument()

    const match = screen.getByRole('link', { name: /Match the moment/i })
    expect(match).toHaveAttribute('href', '/discover')
    expect(screen.getByText('Mood, company, and time')).toBeInTheDocument()

    const browse = screen.getByRole('link', { name: /Browse your way/i })
    expect(browse).toHaveAttribute('href', '/browse')

    const log = screen.getByRole('link', { name: /Log a movie/i })
    expect(log).toHaveAttribute('href', '/browse')
  })
})
