// src/features/movie/derive/providerState.js
// F5.7 — pure classifier for the Film File's "Where to watch" truth state. The
// provider request's success and failure are tracked separately in useMovieData so
// that an EMPTY result and a FAILED request are no longer indistinguishable.
//
//   idle    — no request has started / providers intentionally absent
//   loading — the request is still pending
//   found   — the request succeeded and at least one offer exists
//   empty   — the request succeeded but flatrate/rent/buy are all empty
//   error   — the request explicitly failed
//
// Explicit failure wins over an empty result. Pure + null-safe + non-mutating; does
// NOT sort or deduplicate.

const asArray = (x) => (Array.isArray(x) ? x : [])

/**
 * @param {object} [args]
 * @param {boolean} [args.loading]   request still pending
 * @param {boolean} [args.failed]    request explicitly failed
 * @param {object|null} [args.providers]  mapped providers ({ flatrate, rent, buy, link } or null)
 * @returns {{ status: 'idle'|'loading'|'found'|'empty'|'error', hasAny: boolean }}
 */
export function classifyMovieProviderState({ loading = false, failed = false, providers = null } = {}) {
  const hasAny =
    asArray(providers?.flatrate).length +
    asArray(providers?.rent).length +
    asArray(providers?.buy).length > 0

  let status
  if (failed) status = 'error'            // explicit failure wins over empty
  else if (loading) status = 'loading'    // request still pending
  else if (hasAny) status = 'found'       // a real offer exists
  else if (providers) status = 'empty'    // succeeded, but no offers (link-only counts as empty)
  else status = 'idle'                    // no request / intentionally absent

  return { status, hasAny }
}
