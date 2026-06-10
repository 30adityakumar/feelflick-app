// src/shared/lib/profileEvidenceVersion.js
// One canonical version for Cinematic DNA evidence-derived caches (fingerprint + editorial).
//
// Bump this ONLY when the canonical EVIDENCE algorithm changes — canonical-history de-dup
// (F7.3), fingerprint inputs, or the generated-summary evidence inputs. Do NOT bump for copy,
// CSS, or accessibility changes. A cache hit is valid only when its stored evidenceVersion
// matches this value; TTL is a secondary freshness rule on top of the version match.
//
//   v1 (implicit, unstored) — pre-F7.3 caches derived from RAW duplicate history.
//   v2 — F7.3 canonical evidence (de-duplicated history feeds metrics, fingerprint, summary).
export const PROFILE_EVIDENCE_VERSION = 2

// The fingerprint cache object stores its version inline (taste_fingerprint.evidenceVersion).
// An unversioned (pre-F7.3) or mismatched fingerprint is stale and must be recomputed.
export function isFingerprintVersionCurrent(fingerprint) {
  return Boolean(fingerprint) && fingerprint.evidenceVersion === PROFILE_EVIDENCE_VERSION
}

// The editorial's evidence version is stored alongside the fingerprint on the same row
// (taste_fingerprint.editorialVersion), set ONLY by an explicit refresh. A pre-F7.6 editorial
// has no editorialVersion → stale → it must not be presented as the current reflection.
export function isEditorialVersionCurrent(fingerprint) {
  return Boolean(fingerprint) && fingerprint.editorialVersion === PROFILE_EVIDENCE_VERSION
}
