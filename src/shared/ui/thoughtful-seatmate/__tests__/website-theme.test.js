import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'

const foundations = readFileSync('src/shared/ui/thoughtful-seatmate/foundations.css', 'utf8')
const indexCss = readFileSync('src/index.css', 'utf8')
const globals = readFileSync('src/styles/globals.css', 'utf8')
const app = readFileSync('src/App.jsx', 'utf8')

describe('website theme', () => {
  it('uses one root theme boundary', () => {
    expect(app).toContain('theme-thoughtful')
    expect(app).toContain('theme-legacy')
    expect(foundations).toContain('.theme-thoughtful {')
  })

  it('uses deep ink and paper-white values', () => {
    expect(foundations).toContain('--color-canvas: #0f1010;')
    expect(foundations).toContain('--color-surface-raised: #2e3135;')
    expect(foundations).toContain('--color-text-primary: #f5f2eb;')
    expect(foundations).toContain('--color-text-muted: #a5a198;')
  })

  it('uses the coral-red signature without a new gradient', () => {
    expect(foundations).toContain('--color-brand-accent: #e5636f;')
    expect(foundations).toContain('--color-brand-accent-text: #ed7a87;')
    expect(indexCss).toContain('--pink-500: var(--color-brand-accent);')
  })

  it('uses the canonical focus and neutral scrollbar', () => {
    expect(globals).toContain('var(--color-focus, #f5f2eb)')
    expect(globals).toContain('var(--color-border-subtle, #3a3d41)')
  })
})
