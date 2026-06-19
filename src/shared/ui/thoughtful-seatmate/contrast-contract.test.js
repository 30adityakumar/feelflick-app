import { describe, expect, it } from 'vitest'
import { TS_TOKENS } from './tokens'

describe('theme contrast tokens', () => {
  it('uses accessible text and border roles', () => {
    expect(TS_TOKENS.textPrimary).toBe('#f5f2eb')
    expect(TS_TOKENS.textSecondary).toBe('#c9c5bc')
    expect(TS_TOKENS.textMuted).toBe('#a5a198')
    expect(TS_TOKENS.borderStrong).toBe('#747a82')
  })

  it('uses neutral actions and coral signature roles', () => {
    expect(TS_TOKENS.actionPrimaryFill).toBe('#f0ece4')
    expect(TS_TOKENS.actionPrimaryText).toBe('#0f1010')
    expect(TS_TOKENS.brandAccentText).toBe('#ed7a87')
    expect(TS_TOKENS.brandAccentStrong).toBe('#b83d4f')
  })
})
