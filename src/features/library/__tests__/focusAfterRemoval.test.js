import { describe, it, expect, vi } from 'vitest'
import { nextFocusId, findRemoveControl, findFallback, scheduleFocus } from '../focusAfterRemoval'

describe('nextFocusId (pure)', () => {
  it('46. prefers the NEXT equivalent id', () => {
    expect(nextFocusId([1, 2, 3], 2)).toBe(3)
  })
  it('47. last-item removal falls back to the PREVIOUS id, then null (→ caller uses fallback)', () => {
    expect(nextFocusId([1, 2, 3], 3)).toBe(2)
    expect(nextFocusId([5], 5)).toBeNull() // only item → no sibling
  })
  it('returns null for an unknown id / bad input', () => {
    expect(nextFocusId([1, 2], 9)).toBeNull()
    expect(nextFocusId(null, 1)).toBeNull()
  })
})

describe('findRemoveControl / findFallback', () => {
  function mount(html) { const d = document.createElement('div'); d.innerHTML = html; return d }
  it('resolves a remove control by stable id + view (never by title)', () => {
    const c = mount(`
      <button data-library-action="remove" data-library-item-id="7" data-library-view="list">a</button>
      <button data-library-action="remove" data-library-item-id="8" data-library-view="list">b</button>`)
    expect(findRemoveControl(c, 8, 'list')?.textContent).toBe('b')
    expect(findRemoveControl(c, 99, 'list')).toBeNull()
  })
  it('findFallback returns the data-library-fallback element', () => {
    const c = mount(`<div data-library-fallback tabindex="-1">fb</div>`)
    expect(findFallback(c)?.textContent).toBe('fb')
  })
})

describe('scheduleFocus', () => {
  const syncRaf = (cb) => cb() // run both rAF layers synchronously
  it('focuses the resolved element', () => {
    const el = { focus: vi.fn() }
    scheduleFocus(() => el, { raf: syncRaf })
    expect(el.focus).toHaveBeenCalledTimes(1)
  })
  it('52. the cancel fn prevents focus (cleanup on unmount)', () => {
    let fire
    const deferRaf = (cb) => { fire = fire ? (() => { const p = fire; return () => { p(); cb() } })() : cb }
    const el = { focus: vi.fn() }
    // two-layer rAF: capture both callbacks, then fire after cancelling
    const layers = []
    const raf = (cb) => layers.push(cb)
    const cancel = scheduleFocus(() => el, { raf })
    cancel()
    layers.forEach(fn => fn()) // first layer schedules second
    layers.forEach(fn => fn())
    expect(el.focus).not.toHaveBeenCalled()
    void deferRaf; void fire
  })
  it('53. never focuses document.body or a null target', () => {
    const bodyFocus = vi.spyOn(document.body, 'focus')
    scheduleFocus(() => document.body, { raf: syncRaf })
    scheduleFocus(() => null, { raf: syncRaf })
    expect(bodyFocus).not.toHaveBeenCalled()
  })
})
