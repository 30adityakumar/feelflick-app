import { describe, it, expect } from 'vitest'
import { useState } from 'react'
import { render, screen, fireEvent, within } from '@testing-library/react'

import { Poster, LandingTabs } from '../primitives'

describe('landing primitives (redesign)', () => {
  it('Poster renders an <img> with an accessible alt for content posters', () => {
    render(<Poster path="/abc.jpg" title="Parasite" />)
    const img = screen.getByAltText('Parasite poster')
    expect(img.tagName).toBe('IMG')
    expect(img).toHaveAttribute('loading', 'lazy')
  })

  it('Poster eager LCP candidate loads eagerly', () => {
    render(<Poster path="/abc.jpg" title="Hero" eager />)
    expect(screen.getByAltText('Hero poster')).toHaveAttribute('loading', 'eager')
  })

  it('Poster decorative variant is alt="" + hidden from AT', () => {
    const { container } = render(<Poster path="/abc.jpg" title="Decor" decorative />)
    const img = container.querySelector('img')
    expect(img).toHaveAttribute('alt', '')
  })

  it('Poster falls back to a deterministic React node (no innerHTML) on error', () => {
    render(<Poster path="/missing.jpg" title="Fallback Film" />)
    const img = screen.getByAltText('Fallback Film poster')
    fireEvent.error(img)
    expect(screen.getByText('Fallback Film')).toBeInTheDocument()
  })

  it('LandingTabs exposes a tablist with aria-selected + activates on click', () => {
    function Harness() {
      const [active, setActive] = useState('a')
      return (
        <LandingTabs label="Example" idBase="t" active={active} onChange={setActive}
          tabs={[{ id: 'a', label: 'Alpha' }, { id: 'b', label: 'Beta' }]} />
      )
    }
    render(<Harness />)
    const list = screen.getByRole('tablist', { name: 'Example' })
    const alpha = within(list).getByRole('tab', { name: 'Alpha' })
    const beta = within(list).getByRole('tab', { name: 'Beta' })
    expect(alpha).toHaveAttribute('aria-selected', 'true')
    expect(beta).toHaveAttribute('aria-selected', 'false')
    expect(alpha).toHaveAttribute('aria-controls', 't-panel-a')
    fireEvent.click(beta)
    expect(screen.getByRole('tab', { name: 'Beta' })).toHaveAttribute('aria-selected', 'true')
  })

  it('LandingTabs moves selection with ArrowRight/Home/End', () => {
    function Harness() {
      const [active, setActive] = useState('a')
      return (
        <LandingTabs label="Kbd" idBase="k" active={active} onChange={setActive}
          tabs={[{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }, { id: 'c', label: 'C' }]} />
      )
    }
    render(<Harness />)
    // Keydown is handled on the focused tab (buttons are the focusable widgets).
    fireEvent.keyDown(screen.getByRole('tab', { name: 'A' }), { key: 'ArrowRight' })
    expect(screen.getByRole('tab', { name: 'B' })).toHaveAttribute('aria-selected', 'true')
    fireEvent.keyDown(screen.getByRole('tab', { name: 'B' }), { key: 'End' })
    expect(screen.getByRole('tab', { name: 'C' })).toHaveAttribute('aria-selected', 'true')
    fireEvent.keyDown(screen.getByRole('tab', { name: 'C' }), { key: 'Home' })
    expect(screen.getByRole('tab', { name: 'A' })).toHaveAttribute('aria-selected', 'true')
  })
})
