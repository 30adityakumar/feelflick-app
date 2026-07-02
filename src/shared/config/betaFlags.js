// src/shared/config/betaFlags.js
//
// B1.3 — the smallest safe runtime kill-switch layer for private beta. NOT a feature-flag platform:
// flags are read from public build-time env vars and default to ENABLED (current behavior). When a
// flag is explicitly set to 'false' or '0', the owning surface must show an honest fallback — never
// crash, never expose private data. This lets us disable a misbehaving surface during beta without a
// code change, while regular users see no difference unless a flag is flipped.
//
// To disable a surface for a deploy, set the env var to 'false', e.g. VITE_ENABLE_PEOPLE=false.

const FLAG_ENV = Object.freeze({
  people: 'VITE_ENABLE_PEOPLE',
  profileRefresh: 'VITE_ENABLE_PROFILE_REFRESH',
  dailyBriefing: 'VITE_ENABLE_DAILY_BRIEFING',
  discoverRecommendations: 'VITE_ENABLE_DISCOVER_RECOMMENDATIONS',
})

// Read live from import.meta.env each call so tests can stub a single flag without reloading.
export function isEnabled(key) {
  const envKey = FLAG_ENV[key]
  if (!envKey) return true // unknown flag → never gate
  let raw
  try { raw = import.meta.env?.[envKey] } catch { raw = undefined }
  if (raw === undefined || raw === null || raw === '') return true // default ON
  const v = String(raw).toLowerCase()
  return !(v === 'false' || v === '0' || v === 'off')
}

export const FLAG_KEYS = Object.freeze(Object.keys(FLAG_ENV))

// The private-beta access gate is the INVERSE of the feature kill-switches: it defaults to OFF
// (only 'true'/'1' turns it on) so dev/CI/E2E and current users are unaffected until an operator
// explicitly enables it for a production beta deploy via VITE_ENABLE_BETA_GATE.
export function isBetaGateEnabled() {
  let raw
  try { raw = import.meta.env?.VITE_ENABLE_BETA_GATE } catch { raw = undefined }
  const v = String(raw).toLowerCase()
  return v === 'true' || v === '1' || v === 'on'
}

// The guardrails migration + hardened edge function are now permanently deployed (no rollback, no
// anon-key fallback server-side) — user-JWT auth and the editorial_material_sig column read/write
// used by the MANUAL "Generate reflection" button are unconditional and do NOT depend on this flag.
// This flag now gates ONLY the AUTOMATIC (no-click) behaviors: the living-DNA staleness auto-refresh
// effect and the first-ever-generation rollout (see useProfileData.jsx). Defaults OFF so a fresh
// environment (new deploy, local dev, CI) never starts making automatic Edge calls without an
// explicit opt-in — the manual button already works regardless of this flag.
export function isProfileAutoRefreshEnabled() {
  let raw
  try { raw = import.meta.env?.VITE_ENABLE_PROFILE_AUTO_REFRESH } catch { raw = undefined }
  const v = String(raw).toLowerCase()
  return v === 'true' || v === '1' || v === 'on'
}

// FNV-1a 32-bit → a stable 0-99 bucket. Not a secret and not cryptographic — only a deterministic,
// evenly-distributed per-user rollout assignment (same user always lands in the same bucket).
function fnv1aBucket(str) {
  let h = 0x811c9dc5
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0) % 100
}

// Percentage rollout dial for AUTOMATICALLY GENERATING a user's FIRST-EVER reflection. This is
// distinct from isProfileAutoRefreshEnabled() above, which only re-generates an EXISTING reflection
// once the underlying taste has materially changed — it has no signal to compare against for a user
// who has never generated one, so it can never cover a first-ever generation on its own. Turning
// isProfileAutoRefreshEnabled() on does not, by itself, start auto-generating first reflections for
// every eligible user's next visit — that's a real automatic-LLM-call/cost change across the whole
// user base (bounded by the existing per-user cooldown/cap and global daily budget guardrails, but
// still a genuine increase in call volume), so it ships behind its own dial, defaulting to 0 (off).
// Set VITE_PROFILE_AUTO_GEN_ROLLOUT_PCT to a number 0-100 to widen the rollout without a code change.
export function isUserInProfileAutoGenRollout(userId) {
  if (!userId) return false
  let raw
  try { raw = import.meta.env?.VITE_PROFILE_AUTO_GEN_ROLLOUT_PCT } catch { raw = undefined }
  const pct = Number(raw)
  if (!Number.isFinite(pct) || pct <= 0) return false
  if (pct >= 100) return true
  return fnv1aBucket(String(userId)) < pct
}
