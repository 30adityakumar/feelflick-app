import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { mergeWithDefaults } from '@/features/account/useAccountData'

const DNA_DIR = resolve(import.meta.dirname, '..')

function walk(dir) {
  const out = []
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    const s = statSync(p)
    if (s.isDirectory()) { if (name !== '__tests__') out.push(...walk(p)) }
    else if (/\.(jsx?|css)$/.test(name)) out.push(p)
  }
  return out
}

describe('DNA feature — no prototype fiction ships', () => {
  it('never hard-codes prototype demo data in shipped source', () => {
    const files = walk(DNA_DIR)
    const banned = ['Maya Sen', 'mayawatches', '@mayawatches', '1.8K', 'Toronto']
    for (const f of files) {
      const src = readFileSync(f, 'utf8')
      for (const b of banned) expect(src, `${f} contains "${b}"`).not.toContain(b)
    }
  })
})

describe('DNA feature — cross-user data only via profilePublic-gated RPCs', () => {
  it('the visitor path uses the gated RPCs, not direct cross-user table reads', () => {
    const src = readFileSync(resolve(DNA_DIR, 'useDnaProfileData.jsx'), 'utf8')
    expect(src).toContain("rpc('get_dna_public_profile'")
    expect(src).toContain("rpc('get_dna_public_taste'")
    expect(src).toContain("rpc('get_dna_public_reviews'")
    // The only direct user_history/user_ratings reads are in the isSelf (owner) branch.
    expect(src).toMatch(/if \(isSelf\)/)
  })

  it('all three migration files are profilePublic-gated and revoke anon/public', () => {
    const mig = resolve(DNA_DIR, '../../../supabase/migrations')
    for (const name of ['get_dna_public_profile', 'get_dna_public_taste', 'get_dna_public_reviews']) {
      const file = readdirSync(mig).find((f) => f.includes(name))
      expect(file, `${name} migration exists`).toBeTruthy()
      const sql = readFileSync(join(mig, file), 'utf8')
      expect(sql).toMatch(/security definer/i)
      expect(sql).toMatch(/profilePublic/)
      expect(sql).toMatch(/revoke all on function[\s\S]*from public, anon/i)
      expect(sql).toMatch(/grant execute on function[\s\S]*to authenticated/i)
    }
    // reviews RPC additionally requires reviewsPublic
    const rev = readFileSync(join(mig, readdirSync(mig).find((f) => f.includes('get_dna_public_reviews'))), 'utf8')
    expect(rev).toMatch(/reviewsPublic/)
  })

  it('social-model tables enable RLS with own-write policies and NO fabricated seed rows', () => {
    const mig = resolve(DNA_DIR, '../../../supabase/migrations')
    for (const name of ['dna_endorsements', 'review_likes']) {
      const sql = readFileSync(join(mig, readdirSync(mig).find((f) => f.includes(name))), 'utf8')
      expect(sql, `${name} enables RLS`).toMatch(/enable row level security/i)
      expect(sql, `${name} own-insert policy`).toMatch(/for insert with check \(\(select auth\.uid\(\)\)/i)
      expect(sql, `${name} blocks self`).toMatch(/<>/)
      expect(sql, `${name} revokes anon`).toMatch(/revoke all on public\.\w+ from anon/i)
      // No fabricated seed rows — the counts must start at 0.
      expect(sql, `${name} has no seed INSERT`).not.toMatch(/insert into public\./i)
    }
    // Social-counts RPC is profilePublic-gated + locked down.
    const counts = readFileSync(join(mig, readdirSync(mig).find((f) => f.includes('get_dna_social_counts'))), 'utf8')
    expect(counts).toMatch(/security definer/i)
    expect(counts).toMatch(/profilePublic/)
    expect(counts).toMatch(/revoke all on function[\s\S]*from public, anon/i)
    expect(counts).toMatch(/grant execute on function[\s\S]*to authenticated/i)
    // Follower/following counts were added to the identity RPC.
    const prof = readFileSync(join(mig, readdirSync(mig).find((f) => f.includes('get_dna_public_profile'))), 'utf8')
    expect(prof).toMatch(/followers_total/)
    expect(prof).toMatch(/following_total/)
  })
})

describe('settings merge preserves unrelated keys (dnaProfile + privacy defaults)', () => {
  it('adds dnaProfile + public-profile privacy defaults while keeping prefs/unknown keys', () => {
    const merged = mergeWithDefaults({ prefs: { engineX: 1 }, dnaProfile: { bio: 'hi' }, futureKey: 'keep' })
    expect(merged.prefs).toEqual({ engineX: 1 })
    expect(merged.futureKey).toBe('keep')
    expect(merged.dnaProfile.bio).toBe('hi')
    expect(merged.dnaProfile.schemaVersion).toBe(1) // default filled
    expect(merged.privacy.profilePublic).toBe(false) // default private
    expect(merged.privacy.reviewsPublic).toBe(false)
  })
})
