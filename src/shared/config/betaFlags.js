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

// Master gate for the hardened Cinematic DNA reflection pipeline. Defaults OFF (like the beta gate)
// so the client behaves EXACTLY as before until the backend is deployed. When OFF the reflection
// still generates via the anon key against the current edge function, and the client neither reads
// nor writes the editorial_material_sig column (which only exists after the guardrails migration).
// When ON it activates ALL of: auto-refresh on material taste change, user-JWT auth to the hardened
// edge function, and the material-signature column read/write. Turn on ONLY after the guardrail
// migration + edge redeploy are applied — via VITE_ENABLE_PROFILE_AUTO_REFRESH=true — or the client
// will send a JWT to an edge function that expects the anon key and write a column that doesn't
// exist yet.
export function isProfileAutoRefreshEnabled() {
  let raw
  try { raw = import.meta.env?.VITE_ENABLE_PROFILE_AUTO_REFRESH } catch { raw = undefined }
  const v = String(raw).toLowerCase()
  return v === 'true' || v === '1' || v === 'on'
}
