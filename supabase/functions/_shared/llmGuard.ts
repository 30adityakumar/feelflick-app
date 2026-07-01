// supabase/functions/_shared/llmGuard.ts
// Shared guardrails for the paid OpenAI edge functions. Reference consumer: generate-taste-summary
// (the Cinematic DNA reflection). The other LLM functions (generate-movie-overlay,
// generate-reflection-prompt, ai-mood-context) should adopt verifyUser + guardGeneration the same
// way. See supabase/migrations/20260701000000_llm_generation_guardrails.sql for the DB side.
//
// NOTE ON BUNDLING: Supabase deploys each function with its `_shared` siblings. If a given deploy
// pipeline does NOT bundle `_shared` reliably, inline these helpers into the function instead.
//
// Design (security-and-data rule): a public anon key is NOT proof of identity — verify the real user
// JWT; use a DURABLE per-user limiter (the DB RPC), not an in-memory per-IP map; and treat model
// output as untrusted — ground it against the real evidence before returning it.

import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2'

const rawOrigins = Deno.env.get('ALLOWED_ORIGINS')
  ?? 'https://app.feelflick.com,https://feelflick.com,https://www.feelflick.com,https://feelflick-app.pages.dev,http://localhost:5173'
const ALLOWED_ORIGINS = rawOrigins.split(',').map((s) => s.trim())

export function corsHeaders(origin: string): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Vary': 'Origin',
  }
}

// Verify the caller's Supabase user JWT and return a token-bound client (so auth.uid() resolves to
// this user inside the RPCs, and RLS applies). Returns null when there is no valid user session — a
// replayed anon key is NOT a valid user JWT and fails here.
export async function verifyUser(req: Request): Promise<{ uid: string; client: SupabaseClient } | null> {
  const url = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  if (!url || !anonKey) return null
  const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '').trim()
  if (!token) return null
  const client = createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data, error } = await client.auth.getUser(token)
  if (error || !data?.user) return null
  return { uid: data.user.id, client }
}

export interface GuardConfig {
  functionName: string
  targetUserId: string
  cooldownSecs: number
  dailyCap: number
  globalCap: number
  materialSig?: string | null
}

// Atomic per-user gate via the SECURITY DEFINER RPC. Returns { allowed, reason, id }.
// An RPC error (incl. PT403 for a non-owner target) is treated as NOT allowed — never as a pass.
export async function guardGeneration(
  client: SupabaseClient,
  cfg: GuardConfig,
): Promise<{ allowed: boolean; reason: string; id: number | null }> {
  const { data, error } = await client.rpc('check_and_record_llm_generation', {
    p_function_name: cfg.functionName,
    p_target_user_id: cfg.targetUserId,
    p_cooldown_secs: cfg.cooldownSecs,
    p_daily_cap: cfg.dailyCap,
    p_global_cap: cfg.globalCap,
    p_material_sig: cfg.materialSig ?? null,
  })
  if (error || !data) return { allowed: false, reason: error?.code ?? 'gate_error', id: null }
  return { allowed: Boolean(data.allowed), reason: String(data.reason ?? ''), id: data.id ?? null }
}

// ── Public / anon path ────────────────────────────────────────────────────────────────────────
// For the anon-reachable LLM functions (generate-reflection-prompt, ai-mood-context,
// generate-movie-overlay) there is no per-user profile to own. Rate-limit by a server-derived
// caller_key (never a client-supplied id): the verified uid when a real JWT is present, else a hash
// of the forwarding IP. The global budget is the hard backstop.

// An anon-key client — used to call the public gate RPC when there is no user session.
export function anonClient(): SupabaseClient | null {
  const url = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  if (!url || !anonKey) return null
  return createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } })
}

// Non-cryptographic FNV-1a hash → 8 hex chars. Used so we store a HASHED IP, never a raw one.
export function hashIp(ip: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < ip.length; i++) { h ^= ip.charCodeAt(i); h = Math.imul(h, 0x01000193) }
  return (h >>> 0).toString(16).padStart(8, '0')
}

export interface PublicGuardConfig {
  functionName: string
  callerKey: string
  cooldownSecs: number
  dailyCap: number
  globalCap: number
}

// Durable per-caller gate for anon-reachable functions. Uses the given client (a user-bound client
// when signed in, else an anon client). A gate error is treated as NOT allowed.
export async function guardPublic(
  client: SupabaseClient,
  cfg: PublicGuardConfig,
): Promise<{ allowed: boolean; reason: string; id: number | null }> {
  const { data, error } = await client.rpc('check_and_record_llm_public', {
    p_function_name: cfg.functionName,
    p_caller_key: cfg.callerKey,
    p_cooldown_secs: cfg.cooldownSecs,
    p_daily_cap: cfg.dailyCap,
    p_global_cap: cfg.globalCap,
  })
  if (error || !data) return { allowed: false, reason: error?.code ?? 'gate_error', id: null }
  return { allowed: Boolean(data.allowed), reason: String(data.reason ?? ''), id: data.id ?? null }
}

// Stamp the terminal outcome of a reserved generation (audit accuracy). Best-effort; ignores errors.
export async function recordOutcome(
  client: SupabaseClient,
  id: number | null,
  outcome: string,
  meta: Record<string, unknown> = {},
): Promise<void> {
  if (id == null) return
  try {
    await client.rpc('record_llm_generation_outcome', { p_id: id, p_outcome: outcome, p_meta: meta })
  } catch { /* audit is best-effort */ }
}

// ── Output grounding ────────────────────────────────────────────────────────────────────────────
// Reject model text that names a FILM/DIRECTOR/proper noun the user never watched. Heuristic, tuned
// for zero false-positives on the common case: flag only multi-word Capitalized phrases (film titles
// / full names) or quoted phrases whose significant words are ALL absent from the evidence. Abstract
// signatures (no proper nouns) and legitimately-referenced titles/directors (whose words are in the
// evidence set) pass. Single stray Capitalized words are not flagged (accepted residual gap).
const GROUND_STOPWORDS = new Set([
  'you', 'your', 'yours', 'the', 'a', 'an', 'and', 'or', 'but', 'films', 'film', 'cinema', 'movies',
  'movie', 'stories', 'story', 'characters', 'director', 'directors', 'i', 'it', 'they', 'them',
])

function significantWords(s: string): string[] {
  return s.toLowerCase().split(/[^a-z0-9']+/i).filter((w) => w.length >= 3 && !GROUND_STOPWORDS.has(w))
}

export function groundingCheck(
  text: string,
  evidence: { watchedFilms?: string[]; directors?: string[] },
): { ok: boolean; offenders: string[] } {
  const terms = new Set<string>()
  for (const f of evidence.watchedFilms ?? []) significantWords(String(f)).forEach((w) => terms.add(w))
  for (const d of evidence.directors ?? []) significantWords(String(d)).forEach((w) => terms.add(w))

  const candidates: string[] = []
  // Quoted phrases (the prompt bans quotes, so any quoted span is suspicious).
  for (const m of text.matchAll(/["'“”‘’]([^"'“”‘’]{2,60})["'“”‘’]/g)) candidates.push(m[1])
  // Runs of 2+ Capitalized words (film titles / full names). Small connectors (of/the/and/&) allowed
  // inside a run so "Killing of a Sacred Deer" stays one candidate.
  for (const m of text.matchAll(/\b([A-Z][a-z0-9'’]+(?:\s+(?:of|the|and|a|&|de|di|la|le)\s+|\s+)[A-Z][a-z0-9'’]+(?:\s+[A-Z][a-z0-9'’]+)*)/g)) {
    candidates.push(m[1])
  }

  const offenders: string[] = []
  for (const cand of candidates) {
    const words = significantWords(cand)
    if (words.length === 0) continue
    const grounded = words.some((w) => terms.has(w))
    if (!grounded) offenders.push(cand.trim())
  }
  return { ok: offenders.length === 0, offenders: [...new Set(offenders)] }
}
