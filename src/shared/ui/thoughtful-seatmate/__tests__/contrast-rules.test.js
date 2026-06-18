import { describe, expect, it } from 'vitest'
import { TS_TOKENS } from '../tokens'

// === Stage 5 (B1) — enforceable contrast + usage rules ======================
//
// Computes WCAG 2.x contrast ratios from the ACTUAL --ts-* token values and locks
// the documented usage table. If a token value drifts such that a rule breaks (or
// a previously-failing pairing starts passing), this test fails — forcing the
// foundation contract (README) + the migrated surfaces to be re-reviewed before the
// change ships. AA = 4.5:1 (normal text), 3:1 (large text ≥24px / ≥18.66px bold).

const AA = 4.5
const AA_LARGE = 3.0

function lin(c) { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 }
function L(hex) {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16)
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}
function ratio(fg, bg) { const a = L(fg) + 0.05, b = L(bg) + 0.05; return Math.max(a, b) / Math.min(a, b) }

const T = TS_TOKENS
const STOPS = { canvas: T.canvas, 'surface-1': T.surface1, 'surface-2': T.surface2, 'surface-raised': T.surfaceRaised }

describe('Thoughtful Seatmate — text contrast on every PageDepth stop', () => {
  it('text-primary passes AA on every surface', () => {
    for (const [name, bg] of Object.entries(STOPS)) {
      expect(ratio(T.textPrimary, bg), `text-primary on ${name}`).toBeGreaterThanOrEqual(AA)
    }
  })
  it('text-secondary passes AA on every surface', () => {
    for (const [name, bg] of Object.entries(STOPS)) {
      expect(ratio(T.textSecondary, bg), `text-secondary on ${name}`).toBeGreaterThanOrEqual(AA)
    }
  })
  // RULE (B1): text-muted is permitted ONLY on canvas / surface-1 / surface-2; it
  // FAILS AA on surface-raised. On raised (and any lighter surface) promote muted →
  // text-secondary. This boundary is locked here so the rule stays honest.
  it('text-muted passes AA on canvas/surface-1/surface-2 but FAILS on surface-raised (usage rule)', () => {
    expect(ratio(T.textMuted, T.canvas), 'muted/canvas').toBeGreaterThanOrEqual(AA)
    expect(ratio(T.textMuted, T.surface1), 'muted/surface-1').toBeGreaterThanOrEqual(AA)
    expect(ratio(T.textMuted, T.surface2), 'muted/surface-2').toBeGreaterThanOrEqual(AA)
    expect(ratio(T.textMuted, T.surfaceRaised), 'muted/surface-raised must stay restricted').toBeLessThan(AA)
  })
})

describe('Thoughtful Seatmate — primary action + focus', () => {
  it('action-primary text-on-fill passes AA', () => {
    expect(ratio(T.actionPrimaryText, T.actionPrimaryFill)).toBeGreaterThanOrEqual(AA)
  })
  it('focus (projection ivory) is highly visible on every surface', () => {
    for (const [name, bg] of Object.entries(STOPS)) {
      expect(ratio(T.focus, bg), `focus on ${name}`).toBeGreaterThanOrEqual(AA_LARGE)
    }
  })
})

describe('Thoughtful Seatmate — bounded rose usage rules', () => {
  // RULE (B1): rose as SMALL text only on canvas / surface-1 (AA 4.5). As LARGE text
  // it is acceptable on all stops (AA-large 3.0). Otherwise use ivory or the
  // white-on-rose solid pill. These bounds are locked here.
  it('rose small text passes AA only on canvas + surface-1', () => {
    expect(ratio(T.brandRose, T.canvas), 'rose small/canvas').toBeGreaterThanOrEqual(AA)
    expect(ratio(T.brandRose, T.surface1), 'rose small/surface-1').toBeGreaterThanOrEqual(AA)
    expect(ratio(T.brandRose, T.surface2), 'rose small/surface-2 must fail (use ivory)').toBeLessThan(AA)
    expect(ratio(T.brandRose, T.surfaceRaised), 'rose small/raised must fail (use ivory)').toBeLessThan(AA)
  })
  it('rose large text passes AA-large on every surface', () => {
    for (const [name, bg] of Object.entries(STOPS)) {
      expect(ratio(T.brandRose, bg), `rose large on ${name}`).toBeGreaterThanOrEqual(AA_LARGE)
    }
  })
  it('the white-on-rose solid pill (brand-rose-contrast) passes AA for white text', () => {
    expect(ratio('#ffffff', T.brandRoseContrast)).toBeGreaterThanOrEqual(AA)
  })
})
