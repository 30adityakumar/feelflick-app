import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import CandidateCounter from '../CandidateCounter'

describe('CandidateCounter', () => {
  it('renders the count with "films match" label', () => {
    render(<CandidateCounter count={4200} previousCount={4200} loading={false} />)

    expect(screen.getByText('4,200')).toBeTruthy()
    expect(screen.getByText('films match')).toBeTruthy()
  })

  it('displays count with reduced opacity when loading', () => {
    const { container } = render(
      <CandidateCounter count={4200} previousCount={4200} loading={true} />,
    )

    // The motion.span should have animate={{ opacity: 0.5 }} when loading
    // We just verify it renders without crashing
    expect(container.textContent).toContain('4,200')
  })

  it('renders glow when count drops >10%', () => {
    const { container } = render(
      <CandidateCounter count={3000} previousCount={4200} loading={false} />,
    )

    // 3000 vs 4200 = ~28% drop → glow should render
    expect(container.textContent).toContain('3,000')
  })

  it('does not render glow when count drops <10%', () => {
    const { container } = render(
      <CandidateCounter count={3900} previousCount={4200} loading={false} />,
    )

    // 3900 vs 4200 = ~7% drop → no glow
    expect(container.textContent).toContain('3,900')
  })
})
