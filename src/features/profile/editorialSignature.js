// src/features/profile/editorialSignature.js
// The "material signature" of a taste fingerprint: a short, stable hash of the top mood / tone /
// fit tag IDENTITIES (and their rank order), NOT their counts. It answers one question — has the
// user's taste materially changed since the reflection was written? Adding another film of an
// already-dominant mood does not change it; a genuine shift in the top tags does.
//
// It is computed and stored entirely CLIENT-SIDE: `useProfileData` computes the live signature from
// the fetched fingerprint, and `regenerateEditorial` writes the same value to
// user_profiles_computed.editorial_material_sig at generation time. Because both sides derive from
// the same fingerprint, there is no client/server hashing to keep in sync — the stored value and the
// live value are produced by this one function. Deterministic and pure (unit-tested).

// How many top tags of each dimension define "material" identity. Mirrors the packet the edge
// function actually reasons over (buildSummaryRequest tops out at mood 6 / tone 4 / fit 3).
const TOP = { mood: 6, tone: 4, fit: 3 }

const keysOf = (list, n) =>
  (Array.isArray(list) ? list : [])
    .slice(0, n)
    .map((t) => t?.key)
    .filter((k) => typeof k === 'string' && k.length > 0)

// FNV-1a 32-bit → 8-char hex. Not a secret and not cryptographic — only a stable change-detector.
function fnv1a(str) {
  let h = 0x811c9dc5
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0).toString(16).padStart(8, '0')
}

/**
 * @param {{ topMoodTags?: Array<{key:string}>, topToneTags?: Array<{key:string}>, topFitProfiles?: Array<{key:string}> } | null} fingerprint
 * @returns {string|null} an 8-char hex signature, or null when there is not enough signal to compare.
 */
export function computeMaterialSignature(fingerprint) {
  if (!fingerprint) return null
  const mood = keysOf(fingerprint.topMoodTags, TOP.mood)
  const tone = keysOf(fingerprint.topToneTags, TOP.tone)
  const fit = keysOf(fingerprint.topFitProfiles, TOP.fit)
  // Nothing to characterise yet → no signature (treated as "cannot detect material change").
  if (mood.length === 0 && tone.length === 0 && fit.length === 0) return null
  const canonical = `m:${mood.join(',')}|t:${tone.join(',')}|f:${fit.join(',')}`
  return fnv1a(canonical)
}
