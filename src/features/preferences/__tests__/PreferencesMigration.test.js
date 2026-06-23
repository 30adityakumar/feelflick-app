import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

// Verify the correctness migration's security + transactional contract from the
// SQL source. (No live Postgres in CI; the runtime behaviour is exercised by
// the provider tests against the RPC error contract.)
const sql = readFileSync(
  resolve(import.meta.dirname, '../../../../supabase/migrations/20260622120000_preferences_rls_and_save_rpc.sql'),
  'utf8',
).toLowerCase()

describe('migration — user_preferences owner-only RLS (assert, not re-add)', () => {
  it('verifies the table exists and ensures RLS is enabled', () => {
    expect(sql).toContain("table_name = 'user_preferences'")
    expect(sql).toContain('enable row level security')
  })
  it('only establishes owner-only policies as a fail-safe when none exist (no redundant policies)', () => {
    expect(sql).toContain('if not v_has_policy then') // skip on production (policies already exist)
    for (const verb of ['for select', 'for insert', 'for update', 'for delete']) expect(sql).toContain(verb)
    expect((sql.match(/auth\.uid\(\)\) = user_id/g) || []).length).toBeGreaterThanOrEqual(4)
    expect(sql).toContain('to authenticated')
  })
  it('keeps anon locked out and asserts owner-RLS is in force', () => {
    expect(sql).toContain('revoke all on table public.user_preferences from anon')
    expect(sql).toContain('is not owner-rls protected') // sql is lowercased by the test loader
  })
})

describe('migration — save_user_preferences_v2 RPC', () => {
  it('is owner-derived from auth.uid(), never a client user id', () => {
    expect(sql).toContain('v_uid uuid := (select auth.uid())')
    expect(sql).not.toMatch(/p_user_id|p_uid/) // no caller-authoritative user id parameter
  })
  it('is SECURITY DEFINER with a fixed safe search_path (no pg_temp)', () => {
    expect(sql).toContain('security definer')
    expect(sql).toContain('set search_path = public, pg_catalog')
    expect(sql).not.toContain('pg_temp')
  })
  it('serializes concurrent saves with an xact advisory lock (first-save race)', () => {
    expect(sql).toContain('pg_advisory_xact_lock(hashtext(v_uid::text))')
  })
  it('validates genres against the authoritative catalog (preferred + avoided)', () => {
    expect(sql).toContain('unknown preferred genre')
    expect(sql).toContain('unknown avoided genre')
    expect(sql).toContain("('sci-fi', 878)") // app label, not the genres-table 'Science Fiction'
  })
  it('is least-privilege: revoked from public + anon, granted only to authenticated', () => {
    expect(sql).toContain('revoke all on function public.save_user_preferences_v2(timestamptz, integer[], jsonb) from public')
    expect(sql).toContain('revoke all on function public.save_user_preferences_v2(timestamptz, integer[], jsonb) from anon')
    expect(sql).toContain('grant execute on function public.save_user_preferences_v2(timestamptz, integer[], jsonb) to authenticated')
  })
  it('rejects unauthenticated callers (PT401)', () => {
    expect(sql).toContain("raise exception 'unauthenticated' using errcode = 'pt401'")
  })
  it('validates the patch key allowlist and rejects unexpected keys (PT400)', () => {
    expect(sql).toContain("raise exception 'unexpected prefs key")
    for (const k of ['moodweights', 'avoidgenres', 'trusteddirectors', 'muteddirectors', 'runtimefloor', 'runtimecap', 'boundaries', 'subtitles', 'spoilertier', 'languages']) {
      expect(sql).toContain(`'${k}'`)
    }
  })
  it('validates ranges/enums/overlaps/sizes', () => {
    expect(sql).toContain('mood value out of range')
    expect(sql).toContain('runtime cap must exceed floor by at least 5')
    expect(sql).toContain('genre cannot be both preferred and avoided')
    expect(sql).toContain('director cannot be both trusted and muted')
    expect(sql).toContain('too many preferred genres')
    expect(sql).toContain('invalid subtitles')
    expect(sql).toContain('invalid language')
  })
  it('locks the settings row and detects a stale updated_at (PT409 conflict)', () => {
    expect(sql).toContain('for update')
    expect(sql).toContain('is distinct from p_expected_updated_at')
    expect(sql).toContain("using errcode = 'pt409'")
  })
  it('atomically replaces genres, merges prefs preserving unrelated keys, invalidates cache', () => {
    expect(sql).toContain('delete from public.user_preferences where user_id = v_uid')
    expect(sql).toContain('insert into public.user_preferences')
    expect(sql).toContain('v_existing_prefs || p_prefs_patch') // patch overrides only its keys
    expect(sql).toContain('update public.user_profiles_computed set computed_at = null where user_id = v_uid')
  })
  it('returns the newly persisted updated_at', () => {
    expect(sql).toContain("jsonb_build_object('updated_at', v_new_updated_at)")
  })
})
