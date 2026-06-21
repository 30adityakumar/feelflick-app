// src/features/profile/derive/dnaBarcode.js
// Pure deterministic, PRIVACY-SAFE barcode for the Cinematic Passport.
//
// The barcode is DECORATIVE. Its geometry/colour is derived ONLY from a privacy-safe seed:
//   evidence version + deterministic archetype key + SORTED grounded tag keys.
// It must NEVER include the user id, email, raw film ids, raw ratings, watch history, or any
// reconstructable behavioural data — only the same non-identifying DNA inputs already shown on
// the passport face. Sorting the tag keys makes ordering irrelevant (same DNA → same barcode).

const PALETTE = ['#eda8cc', '#edc97c', '#e5636f', '#91d2ee', '#b5a4ec', '#92c2a6']

// Build the privacy-safe seed string. Lower-cased + tag keys sorted so ordering never matters.
export function barcodeSeed({ evidenceVersion = 0, archetype = [], tags = [] } = {}) {
  const arche = (Array.isArray(archetype) ? archetype : []).map((s) => String(s).toLowerCase().trim()).join('|')
  const tagKeys = (Array.isArray(tags) ? tags : []).map((s) => String(s).toLowerCase().trim()).filter(Boolean).sort()
  return `v${evidenceVersion}::${arche}::${tagKeys.join(',')}`
}

// Deterministic 32-bit string hash (FNV-1a-ish) → seed for the PRNG.
function hashString(str) {
  let h = 0x811c9dc5
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193) }
  return h >>> 0
}
function mulberry32(seed) {
  return function () { let t = (seed += 0x6d2b79f5); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}

/**
 * Deterministic bar list for the passport barcode.
 * @returns {Array<{ color, weight, opacity, scale }>} — purely visual; no data values rendered.
 */
export function deriveDnaBarcode({ evidenceVersion = 0, archetype = [], tags = [], bars = 60 } = {}) {
  const seed = barcodeSeed({ evidenceVersion, archetype, tags })
  const rnd = mulberry32(hashString(seed))
  const out = []
  for (let i = 0; i < bars; i++) {
    out.push({
      color: PALETTE[Math.floor(rnd() * PALETTE.length)],
      weight: 1 + Math.floor(rnd() * 3) * 0.12,
      opacity: Math.round((0.6 + rnd() * 0.38) * 100) / 100,
      scale: Math.round((0.58 + rnd() * 0.42) * 100) / 100,
    })
  }
  return out
}
