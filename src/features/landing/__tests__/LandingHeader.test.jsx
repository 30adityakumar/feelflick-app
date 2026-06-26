import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react'

// Control the shared OAuth hook.
const startGoogleAuth = vi.fn()
let hookState
vi.mock('@/shared/hooks/useGoogleAuth', () => ({ useGoogleAuth: () => hookState }))

import { LandingAuthProvider } from '../LandingAuth'
import LandingHeader from '../components/LandingHeader'

// A stub hero primary CTA so the header's IntersectionObserver has a target.
function HeroStub() {
  return (
    <div className="ff-l-hero-actions">
      <button type="button" className="ff-l-btn ff-l-btn--primary">hero cta</button>
    </div>
  )
}
function renderHeader() {
  return render(
    <LandingAuthProvider>
      <HeroStub />
      <LandingHeader />
    </LandingAuthProvider>
  )
}

// Capture the most recent IntersectionObserver callback.
let ioCallback
class MockIO {
  constructor(cb) { ioCallback = cb; this.observe = vi.fn(); this.disconnect = vi.fn() }
}
const fireIO = (isIntersecting) => act(() => ioCallback([{ isIntersecting }]))

beforeEach(() => {
  startGoogleAuth.mockReset()
  hookState = { signInWithGoogle: startGoogleAuth, isAuthenticating: false, authError: null, clearAuthError: vi.fn() }
  ioCallback = undefined
  vi.stubGlobal('IntersectionObserver', MockIO)
})
afterEach(() => { cleanup(); vi.unstubAllGlobals() })

describe('LandingHeader — desktop composition', () => {
  it('shows the canonical FeelFlick wordmark (mixed case, not all-caps)', () => {
    renderHeader()
    const mark = screen.getByRole('link', { name: /feelflick home/i })
    expect(mark.textContent).toBe('FeelFlick')
  })

  it('has exactly one header nav link: How it works (no section links)', () => {
    renderHeader()
    expect(screen.getByRole('link', { name: /how it works/i })).toHaveAttribute('href', '#how-it-works')
    for (const gone of [/film file/i, /cinematic dna/i, /library/i, /people/i]) {
      expect(screen.queryByRole('link', { name: gone })).toBeNull()
    }
    // wordmark + one nav link = 2 links total in the header
    expect(screen.getAllByRole('link')).toHaveLength(2)
  })

  it('has one Continue with Google action and no Menu button / dialog', () => {
    renderHeader()
    expect(screen.getByRole('button', { name: /continue with google/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^menu$/i })).toBeNull()
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('the header CTA invokes the shared Google auth operation', () => {
    renderHeader()
    fireEvent.click(screen.getByRole('button', { name: /continue with google/i }))
    expect(startGoogleAuth).toHaveBeenCalledTimes(1)
  })
})

describe('LandingHeader — mobile scroll-reveal', () => {
  it('keeps the header CTA hidden while the hero CTA is visible, and reveals it once it leaves', () => {
    renderHeader()
    const cta = screen.getByRole('button', { name: /continue with google/i })
    fireIO(true)  // hero CTA visible
    expect(cta).not.toHaveAttribute('data-revealed')
    fireIO(false) // hero CTA scrolled away
    expect(cta).toHaveAttribute('data-revealed', 'true')
    fireIO(true)  // scrolled back
    expect(cta).not.toHaveAttribute('data-revealed')
  })

  it('the revealed compact control keeps the accessible name "Continue with Google"', () => {
    renderHeader()
    fireIO(false)
    const cta = screen.getByRole('button', { name: 'Continue with Google' })
    expect(cta).toHaveAttribute('data-revealed', 'true')
    fireEvent.click(cta)
    expect(startGoogleAuth).toHaveBeenCalledTimes(1)
  })

  it('shows a clear loading state and disables the control while pending', () => {
    hookState.isAuthenticating = true
    renderHeader()
    const cta = screen.getByRole('button', { name: /opening google/i })
    expect(cta).toBeDisabled()
  })

  it('falls back to an available CTA when IntersectionObserver is unsupported', () => {
    vi.stubGlobal('IntersectionObserver', undefined)
    renderHeader()
    expect(screen.getByRole('button', { name: /continue with google/i })).toHaveAttribute('data-revealed', 'true')
  })
})
