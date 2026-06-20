import { describe, expect, it } from 'vitest'
import { TS_TOKENS as T } from './tokens'

const linear = (value) => {
  const n = value / 255
  return n <= 0.03928 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4
}

const luminance = (hex) => {
  const value = hex.slice(1)
  const r = parseInt(value.slice(0, 2), 16)
  const g = parseInt(value.slice(2, 4), 16)
  const b = parseInt(value.slice(4, 6), 16)
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b)
}

const contrast = (a, b) => {
  const first = luminance(a) + 0.05
  const second = luminance(b) + 0.05
  return Math.max(first, second) / Math.min(first, second)
}

const surfaces = [T.canvas, T.surface1, T.surface2, T.surfaceRaised]

describe('theme contrast contract', () => {
  it('keeps meaningful text readable', () => {
    for (const surface of surfaces) {
      expect(contrast(T.textPrimary, surface)).toBeGreaterThanOrEqual(4.5)
      expect(contrast(T.textSecondary, surface)).toBeGreaterThanOrEqual(4.5)
      expect(contrast(T.textMuted, surface)).toBeGreaterThanOrEqual(4.5)
      expect(contrast(T.brandAccentText, surface)).toBeGreaterThanOrEqual(4.5)
    }
  })

  it('keeps focus and functional boundaries visible', () => {
    for (const surface of surfaces) {
      expect(contrast(T.borderStrong, surface)).toBeGreaterThanOrEqual(3)
      expect(contrast(T.focus, surface)).toBeGreaterThanOrEqual(3)
    }
  })

  it('keeps filled actions readable', () => {
    expect(contrast(T.actionPrimaryText, T.actionPrimaryFill)).toBeGreaterThanOrEqual(4.5)
    // White-text and paper-white-text filled coral signatures both clear AA.
    expect(contrast('#ffffff', T.brandAccentStrong)).toBeGreaterThanOrEqual(4.5)
    expect(contrast(T.textPrimary, T.brandAccentStrong)).toBeGreaterThanOrEqual(4.5)
  })

  it('primary text + primary action are AAA (the strongest tiers carry the experience)', () => {
    expect(contrast(T.actionPrimaryText, T.actionPrimaryFill)).toBeGreaterThanOrEqual(7)
    for (const surface of surfaces) {
      expect(contrast(T.textPrimary, surface)).toBeGreaterThanOrEqual(7)
    }
  })

  it('the accent signature is at least large-text/UI legible on every surface (text role uses brandAccentText)', () => {
    for (const surface of surfaces) {
      expect(contrast(T.brandAccent, surface)).toBeGreaterThanOrEqual(3)
    }
  })

  it('the decorative boundary is intentionally below 3:1 (functional boundary carries the load)', () => {
    // borderSubtle is decorative only; borderStrong is the 3:1 functional boundary (asserted above).
    expect(contrast(T.borderSubtle, T.canvas)).toBeLessThan(3)
  })
})
