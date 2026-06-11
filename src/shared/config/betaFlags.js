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
