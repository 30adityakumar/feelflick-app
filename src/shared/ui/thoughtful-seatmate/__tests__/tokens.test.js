import { describe, expect, it } from 'vitest'
import { TS_TOKENS } from '../tokens'

describe('theme tokens', () => {
  it('uses the adaptive editorial cinema palette', () => {
    expect(TS_TOKENS.canvas).toBe('#0f1010')
    expect(TS_TOKENS.surface1).toBe('#171819')
    expect(TS_TOKENS.surface2).toBe('#222427')
    expect(TS_TOKENS.surfaceRaised).toBe('#2e3135')
    expect(TS_TOKENS.textPrimary).toBe('#f5f2eb')
    expect(TS_TOKENS.textSecondary).toBe('#c9c5bc')
    expect(TS_TOKENS.textMuted).toBe('#a5a198')
    expect(TS_TOKENS.brandAccent).toBe('#e5636f')
    expect(TS_TOKENS.brandAccentText).toBe('#ed7a87')
    expect(TS_TOKENS.brandAccentStrong).toBe('#b83d4f')
  })
})
