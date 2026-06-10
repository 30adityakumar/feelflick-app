# F7 — Profile / Cinematic DNA: final summary

**Status: complete and closed.** Verdict: **READY FOR PRIVATE / BETA TESTING** (0 open P0/P1).
Main at closure: `89c6a7c6`. This is the closure ledger for F7.1–F7.10.

> This is a historical closure record, not active guidance. The maintained rules live in
> `.claude/rules/`; volatile facts (versions, counts) are derived from source. Where this
> document cites counts or SHAs they were verified against the repository at closure.

---

## 1. Initiative overview

F7 began because the Profile / Cinematic DNA surface — the route that tells a user "who you are as
a filmgoer" — was simultaneously the most identity-laden surface in the product and the least
honest. The F7.1 audit found:

- **A live cross-user behavioral exposure.** Any authenticated user could read another user's raw
  watch history / ratings, and the DNA could be rendered for other users.
- **False privacy controls** — "Public profile" / "Public diary" toggles that promised a model that
  did not exist or was not enforced.
- **Raw duplicate history inflating the identity** — multiple history rows per film inflated "films
  logged", hours, signature directors, distributions and the generated summary.
- **Generated prose presented without provenance** — LLM-written summaries read as measured fact.
- **One-film identity generation** — a confident generated identity could appear from almost no
  evidence.
- **Opaque confidence** — an exact "DNA confidence %" implied accuracy, and small-sample
  distributions showed unsupported precision.
- **Weak chart accessibility and contrast** — meaning lived in SVG geometry; muted labels fell
  below AA.
- **Render-triggered LLM/cache work** — opening the Profile could call the editorial Edge Function
  and write the cache.
- **Stale pre-canonical caches** — caches built before the canonical fix stayed valid for their TTL.
- **No Profile E2E or visual coverage.**

**Target doctrine (achieved):** *Cinematic DNA is a private, self-only reflection dossier based on
canonical evidence. It distinguishes measured activity, derived patterns and generated
interpretation; it never silently generates an identity, never exposes another user's behavioral
portrait, and never presents evidence maturity as certainty.*

---

## 2. Final product experience

The self-view (`/profile`) reads top-to-bottom as a reflection dossier — meaning before analytics:

1. **Identity masthead** — name + a labelled *FeelFlick reflection* (when eligible) and a derived
   *Taste pattern* archetype.
2. **Evidence summary** — "Based on N watched films and M ratings", beside the identity claim.
3. **Qualitative maturity / confidence** — an evidence-maturity band ("Still forming / Taking shape
   / Well established"), framed as evidence, never accuracy.
4. **Mood / director / motif patterns.**
5. **Trajectory** (range-toggleable).
6. **Decade / runtime / daypart habits.**
7. **Mixtape and Year-in-Review.**
8. **Explicit Share DNA.**
9. **Explicit Refresh reflection** — shown only for an eligible self profile whose reflection is
   missing or stale.

Honesty rules in the final product:

- **Forming profiles receive no generated identity** — they show honest "still forming" guidance.
- **Emerging / established profiles may show a labelled FeelFlick reflection** — described as a
  *generated interpretation of your film activity, not a measured fact*.
- **The archetype is labelled *Derived*** (from your film signals), not generated.
- **The exact DNA-confidence percentage is gone** — replaced by a qualitative band.
- **Small samples do not display unsupported precision** — percentages are suppressed or count-led.
- **`/profile/:otherUserId` shows a private state and fetches no target data** — it short-circuits
  to a private view before any behavioral query.

---

## 3. Phase ledger — F7.1 → F7.10

All squash SHAs below are reachable from `main` (`89c6a7c6`) and were verified against GitHub.

| Phase | Title | Type | PR | Squash SHA | Outcome | Key frozen contract preserved |
|---|---|---|---|---|---|---|
| F7.1 | Cinematic DNA readiness audit | audit | — | — | Found 1 P0 (cross-user behavioral exposure) + 2 P1; set the target doctrine. | — (audit only) |
| F7.2 | Contain Cinematic DNA and behavioral-data privacy | privacy/security | #263 | `50d4864c` | Restored owner/participant RLS; made Profile self-only; removed cross-user DNA links + unenforced public toggles. | Metric/fingerprint formulas; section order |
| F7.3 | Canonicalize Cinematic DNA evidence + Profile safety tests | data truth / test safety | #264 | `972a13ab` | One-film-per-history canonical boundary (`dedupeHistoryByMovie`); canonicalised fingerprint + summary inputs; sanitized route errors. | Formulas; maturity not yet introduced |
| F7.4 | Harden Cinematic DNA trust and maturity framing | trust / product framing | #265 | `40e474e4` | Forming/emerging/established maturity; labelled generated content; identity suppressed below the floor; qualitative confidence band. | Fingerprint formula; section order |
| F7.5 | Harden Cinematic DNA charts and accessibility | accessibility | #266 | `bb7a94eb` | Chart summaries + denominators; decorative geometry hidden; trajectory control semantics; contrast + reflow hardening (`INK_LABEL`). | Chart values; engine |
| F7.6 | Version Cinematic DNA caches and make reflection refresh explicit | cache / reliability architecture | #267 | `5d5f8d5c` | `PROFILE_EVIDENCE_VERSION`; stale pre-canonical caches invalidated; generation removed from render; explicit settled refresh. | Formulas; prompt/schema; no migration needed |
| F7.7 | Add Cinematic DNA E2E and authenticated visual coverage | testing / tooling | #268 | `641297fc` | Intercepted authenticated E2E + 8 Darwin/8 Linux visuals; fixed two browser-exposed defects (StrictMode refresh settle; sub-AA labels → `INK_LABEL`). | Product behavior (test phase) |
| F7.8 | Production-readiness audit | audit | — | — | Found a residual projection-view P0 (anon-readable fingerprint/similarity) + a refresh-persistence P1. | — (audit only) |
| F7.9 | Secure Cinematic DNA projections and fix reflection persistence | privacy/security + reliability | #269 | `89c6a7c6` | Dropped the two SECURITY DEFINER projection views; authenticated least-data RPC for People; editorial cache-write error now settles honestly. | Base RLS shape; formulas; People visible behavior |
| F7.10 | Document Cinematic DNA F7 completion | documentation closure | _(this PR)_ | _pending_ | This summary; one docs-index link. | Everything (docs-only) |

---

## 4. Before / after transformation

| Before | After |
|---|---|
| Cross-user behavioral Profile | Self-only Cinematic DNA |
| Broad behavioral RLS | Owner / participant-scoped RLS |
| Anonymous fingerprint / similarity projections | Views removed; authenticated least-data RPC |
| Raw duplicate history | Shared canonical one-film-per-history boundary |
| Unlabelled generated identity | Labelled FeelFlick reflection |
| Identity generated from one film | Shared maturity floor |
| Exact confidence percentage | Qualitative evidence-maturity band |
| Small-N exact percentages | Count / denominator-aware framing |
| Charts dependent on visual geometry | Ordered text equivalents + labelled figures |
| Weak muted contrast | Profile load-bearing labels meet AA (`INK_LABEL`) |
| Editorial generated on render | Explicit Refresh reflection action |
| Unversioned stale caches | Evidence-versioned fingerprint / editorial caches |
| Cache-write failure falsely confirmed | Persistence error throws and settles honestly |
| No Profile browser proof | Intercepted authenticated E2E + Darwin/Linux visuals |

---

## 5. Privacy incident and remediation

The privacy work was the spine of F7. Two distinct exposures were found and closed, at two layers,
without exposing any real user details and without mutating any user row.

### F7.2 — base behavioral boundary (#263 `50d4864c`)

- **Owner-only SELECT** restored on `user_history` and `user_ratings`.
- **Participant-only SELECT** restored on `user_similarity`.
- **Profile made self-only**; cross-user DNA deep-links removed.
- **Unenforced "Public Profile" / "Public Diary" controls removed.**
- The database boundary was verified with read-only / simulated-role checks
  (`scripts/verify-owner-only-rls.sql`).

### F7.9 — projection-view exposure (#269 `89c6a7c6`)

F7.8 confirmed (via an anonymous-role simulation that returned real cross-user rows) that
`public.user_fingerprint_public` and `public.user_similarity_discoverable` were **SECURITY DEFINER**
views, granted to `anon` and `authenticated`, that **bypassed** the protected base-table boundary —
so a logged-out client with the public key could read every non-opted-out user's taste fingerprint
and the similarity graph. F7.9:

- **Dropped both views** (0 dependents each), closing all anonymous / direct browser access and
  clearing both SECURITY DEFINER advisor errors outright.
- Introduced **`get_discoverable_taste_profiles()`** as the **only** People projection path:
  authenticated-only, least-data (five fingerprint fields), `auth.uid()`-derived (no caller-supplied
  identity), bounded, read-only, with a pinned `search_path`.
- **People retained its existing product experience** through the RPC (the four direct view reads
  became one RPC call; cards/ranking/empty/error states unchanged).
- The RPC **enforces the existing `showOnLeaderboards` setting** exactly. That setting remains
  **default-on / opt-out** and is recorded as a **public-production policy item** (see §17).
- **No live user rows were changed**; the security-advisor view errors were cleared.

**Three distinct concepts, kept distinct:** *RLS is access control. Account settings are user
intent. Consent / publication is a future product policy.* **RLS alone is not consent.**

---

## 6. Final privacy model

- Cinematic DNA is **self-only**.
- Raw history and ratings are **owner-only**.
- Raw similarity is **participant-only**.
- Computed Profile is **owner-only**.
- **Anonymous clients cannot read any taste projection.**
- **Authenticated clients cannot directly query the retired views** (they no longer exist).
- People receives **only opted-in, least-data fingerprint fields** through the RPC.
- The RPC returns **no** raw watched titles, dates, reviews, or generated editorial.
- **Social / public Profile publication remains deliberately unavailable.**

Film File social features (e.g. Taste-Twins) currently fail safe or use their separately approved
privacy behavior (see `docs/movie/social-content-policy-f56.md`); the deeper public social model is
**not** complete and is not claimed to be.

---

## 7. Canonical evidence boundary

The shared canonical-history rule (`src/shared/lib/canonicalHistory.js` → `dedupeHistoryByMovie`):

- **one contribution per `movie_id`**;
- **most-recent valid `watched_at` wins**;
- invalid / null history rows are excluded;
- **no synthetic rewatch count** is invented;
- **Diary and Profile use the same shared helper.**

Computations now fed by canonical evidence: films logged · hours watched · this-month count ·
director affinity · motifs · decades · runtime · daypart · trajectory · Year-in-Review · confidence
maturity · fingerprint mood/tone/fit weights · generated-summary evidence · shareable claims.

The Profile does **not** assume the Diary's rendered output fixes downstream identity — it applies
the canonical boundary independently from `user_history`.

---

## 8. Trust, provenance and maturity outcome

A two-axis provenance model, in product terms:

- **real / direct** — measured activity (films, hours, ratings, dates, directors);
- **real / derived** — distributions, archetype, maturity, qualitative confidence, trajectory,
  fingerprint;
- **generated interpretation** — the FeelFlick reflection summary + signature;
- **static guidance** — forming-state / empty-state copy.

Recorded outcomes:

- the FeelFlick-generated summary / signature is **labelled as generated interpretation**;
- the deterministic archetype is **labelled derived**;
- the **evidence count sits beside the identity claim**;
- a single `classifyProfileMaturity` (forming / emerging / established) is **shared across
  generation eligibility, rendering, confidence and share**;
- **no generated identity below the maturity floor**;
- a **qualitative maturity band** replaces the exact confidence percentage;
- mature distributions are **denominator-qualified**; small samples are provisional / count-led;
- the **Mood Radar exposes rank words**, not raw weights;
- the **share card follows the same provenance and maturity rules** (only a current reflection is
  exported; otherwise a neutral structured line).

---

## 9. Cache and explicit-refresh architecture

- **`PROFILE_EVIDENCE_VERSION`** (`src/shared/lib/profileEvidenceVersion.js`) is the single owner.
- Fingerprint and editorial cache validity each require **current version + TTL**; old / unversioned
  / mismatched caches are **stale**.
- **Forming profiles suppress cached editorial.**
- **Mount / rerender / scroll / chart interaction / share perform zero editorial Edge calls and zero
  editorial cache writes.** Only the explicit **Refresh reflection** action initiates generation.
- The refresh has an **in-flight duplicate guard**, a **busy state**, **settled polite live
  announcements**, **malformed-response rejection**, and — after F7.9 — **honest cache-write
  failure** (the write `{error}` is inspected and thrown, so a failed persistence never reports
  success; the prior valid reflection survives).
- Sibling JSON metadata is **merge-preserved**; **no schema migration was needed** for the version
  metadata (it rides on the existing `taste_fingerprint` JSONB).

**Honest residual:** the *fingerprint recommendation-cache* may still materialise (idempotent owner
`insert`/`update`) on a cache **miss** during the render fetch — this is a separate, cheap,
non-LLM recommendation-cache behavior, distinct from the editorial contract, and is in the residual
register (§15).

---

## 10. Accessibility and contrast outcome

- exactly **one `<h1>` per state**;
- a labelled **`#cinematic-dna-content`** region (skip target);
- **no nested `<main>`**;
- loading uses **`role="status"` + `aria-busy`** with decorative geometry hidden;
- a safe **error `role="alert"`** with retry + Home recovery;
- the **private state is named and navigable**;
- generated content is **associated with its provenance disclosure**;
- the confidence band is **plain text** (no fake meter / progressbar);
- charts are **figures with ordered text equivalents**; decorative chart geometry is `aria-hidden`;
- the **trajectory control uses `aria-pressed`**; the Mood Radar is an **ordered list**; denominator
  context is present;
- **reduced-motion** compliant; **focus-visible** controls; gradient text has a **solid fallback**;
- a **Profile-specific colour-contrast-enabled axe run passes with no new exclusion**, and the
  load-bearing muted labels were raised to the Profile **`INK_LABEL`** (~7:1) token.

This is **not** a claim of full-app WCAG compliance. The remaining **shell-level skip link** and a
few **sub-44px masthead touch targets** are in the deferred register (§15).

---

## 11. Architecture

- **`TasteProfile.jsx`** — route entry; self-vs-private gate (short-circuits to a private view
  before any fetch); section composition + the labelled content region.
- **`useProfileData.jsx`** — orchestration: canonical history, derivations, fingerprint, maturity,
  editorial status, and the explicit `refreshEditorial` lifecycle (incl. the F7.9 persistence fix).
- **`src/shared/lib/canonicalHistory.js`** — the one-film-per-history boundary (shared with Diary).
- **`derive/profilePresentation.js`** — `classifyProfileMaturity` + confidence-band derivation.
- **`DnaConfidence.jsx`** — qualitative, plain-text confidence band.
- **top / bottom sections** — masthead + reflection + evidence + the chart/pattern/mixtape/YIR/share
  sections.
- **archetype helper** — deterministic, labelled-derived archetype.
- **summary request builder (`buildSummaryRequest.js`)** — pure, canonical-fed editorial request.
- **`src/shared/lib/profileEvidenceVersion.js`** — the evidence-version contract.
- **`src/shared/services/tasteCache.js`** — versioned fingerprint cache.
- **People boundary** — `usePeopleData.jsx` reads cross-user taste only via the
  `get_discoverable_taste_profiles()` RPC.
- **Tests** — `e2e/fixtures/profile.js`, `e2e/app/profile.e2e.js`, `e2e/visual-auth/profile.visual.js`,
  plus the Profile unit suite.

No reducer / state-machine extraction was needed; no broad design-system rewrite occurred; the
generated-summary Edge Function prompt/schema and the recommendation formulas were unchanged.

---

## 12. Frozen contracts

Unchanged through F7 (except where explicitly listed as a remediation): recommendation scoring
formulas · fingerprint weighting formulas · Profile metric formulas · section hierarchy · maturity
thresholds (after F7.4) · generated editorial schema + prose prompt · self-only Profile route
behavior · route paths + auth/onboarding guards · Home / Discover / Film File / Library product
flows. **No public Profile route was introduced. No user data was migrated or rewritten during the
privacy remediations.**

Database objects deliberately changed: behavioral SELECT policies (F7.2); retired projection views +
the authenticated least-data RPC (F7.9).

---

## 13. Verification evidence

Counts verified from the repository at closure:

- **Profile unit/component tests: 66.**
- **Full unit suite: 1,381.**
- **Profile E2E: 16 `test()` literals → 18 executed scenarios** (scenario **B** parameterises over 3
  editorial modes) **→ 19 reported passes including the shared auth-setup dependency.**
- **Profile visual states: 8.**
- **Profile snapshots: 8 Darwin + 8 Linux PNGs.**
- **Authenticated-app visual run: 41 reported tests** (Profile's 8 + the other routes' states + the
  shared setup).
- **Public visual tests: 2** (unchanged).

**F7.7 fixture model** (`e2e/fixtures/profile.js`): real `/auth/v1` only; every Profile REST
read/write intercepted; the editorial Edge Function intercepted; image requests mocked; a fixed UTC
clock + seeded randomness; separate **read / Edge / cache / shell / unexpected** ledgers; **fail-closed
unexpected-write** behavior; fictional fixture data; a **private-route zero-target-read** proof; a
**no-render-side-effect** proof; refresh **success / failure / malformed** coverage; **six responsive
widths**; **standard and contrast-enabled axe** coverage.

**F7.9 validation** (read-only against live): anonymous direct view access removed (both views
dropped); anonymous RPC denied; authenticated RPC allowed and returning only the opted-in least-data
set incl. the caller's own row; the **four base SELECT policies remained intact**; the view advisor
errors were cleared; **no live user rows were modified**.

> **Intercepted authenticated browser evidence proves application contracts and prevents unintended
> writes, but it does not replace real production integration and beta observation.**

---

## 14. Readiness verdict

**READY FOR PRIVATE / BETA TESTING.**

- F7.1 identified **1 P0 and 2 P1**.
- F7.2 closed the raw behavioral-data exposure and the false privacy controls.
- F7.3 closed duplicate-data inflation.
- F7.8 found a **residual projection-view P0** (anon-readable fingerprint/similarity) and a
  **refresh-persistence P1**.
- F7.9 closed both.
- **No open P0/P1 remains. F7 formally closes.**

This is **not** unrestricted public-production approval. Before unrestricted public production the
project still needs: a deliberate **public Profile / social consent model**; an **opt-in decision for
`showOnLeaderboards`**; a **security review of all remaining SECURITY DEFINER functions/views**;
remediation of **anonymous diagnostic RPC exposure**; **audit logging / monitoring**; **database
patching and leaked-password-protection hardening**; **real beta evidence**; and
**performance / scale observation**.

---

## 15. Deferred register (verified, non-blocking)

### P2

- dead / misleading taste-twin films-count query under owner-only RLS (renders "0" per twin);
- unbounded Profile history load (no LIMIT) — degrades at high watch counts;
- duplicate history load on a fingerprint cache miss;
- no shell-level skip link (the content region is a skip *target* with no skip *link*);
- sub-44px masthead controls on mobile (Edit / Share / Back / "Find people");
- public-scale discoverability / consent policy;
- broader security review for the new and existing SECURITY DEFINER RPCs.

### P3

- fingerprint cache may materialise on render after a miss (idempotent, non-LLM);
- Year-in-Review "rewatched" cannot be meaningful under one-film canonical history (always 0);
- native-share fallback can expose a `null` string for non-current editorial;
- one skew-delta contrast token remains marginal (~4.33:1);
- evocative derived archetype shown at low evidence (labelled);
- `derive` file/directory naming + a stale `/profile-v2` comment;
- `deriveFriends` label/count mismatch ("top 3" vs slice(4));
- the share path lacks a dedicated E2E;
- an actual browser 200%-zoom screenshot was not captured (covered by source/reflow + six widths).

### Peripheral security backlog — **outside F7 product scope; NOT resolved by F7**

- anonymous-executable diagnostic functions such as `get_cron_secret()` — **urgent security review**;
- remaining SECURITY DEFINER views/functions such as `list_follower_counts` and `vw_movies_scored`;
- extensions installed in the `public` schema;
- leaked-password protection disabled;
- long OTP expiry where applicable;
- an available Postgres security patch.

---

## 16. Beta-learning plan

Private beta must answer: whether users understand "FeelFlick reflection" versus measured facts;
whether the evidence count + maturity band build trust; whether forming users understand why no
generated identity appears; whether **Refresh reflection** is discoverable and worth using; real Edge
latency / cost / failure rate; how often stale-reflection states occur; fingerprint quality for cold /
emerging users; Profile usability at 100 / 500 / 1,000 watched films; the real contrast / zoom
experience; whether the self-only stance feels correct; whether users want a public / follower-only
Profile; whether `showOnLeaderboards` should become explicit opt-in; what fields users are
comfortable exposing in People; and whether the existing least-data People projection is
understandable.

---

## 17. Public Profile and People privacy work deliberately deferred

F7 intentionally did **not** create a public Profile. A future social/privacy initiative must decide
and implement: explicit **opt-in publication**; **public vs follower-only** visibility; **revocation**;
**deletion**; **review/Diary visibility**; which **DNA aggregates are shareable**; **least-data RPCs**;
**consent enforcement**; **security-invoker vs tightly scoped security-definer** boundaries;
**similarity transparency**; **auditability**; and **migration off default-on `showOnLeaderboards`**
if product research supports it.

**RLS is not consent.**

---

## 18. Next initiative

**People / social restoration with consent-based, narrowly scoped data projections and RPCs**,
preceded or accompanied by the urgent cross-app **security backlog** where necessary.

Why: Profile is now safely self-only; **People is the intentional consumer of cross-user taste
projections**; F7.9 introduced the safe minimum RPC but did **not** redesign the social-consent
model; social features lost some enrichment after owner-only RLS; restoring them safely is the
highest-trust and highest-dependency next step. Browse, Lists and Account polish can follow.
**Operational beta instrumentation is a parallel priority for learning** — not necessarily a
product-redesign initiative.

---

## 19. Closure statement

F7 is complete. **Cinematic DNA is self-only.** The privacy boundary is **enforced in the database**.
All identity claims use **canonical evidence**. Generated interpretation is **labelled**. **Low
evidence cannot produce a generated identity.** Editorial generation is **explicit**. Caches are
**version-aware**. Refresh persistence is **honest**. Charts are **accessible and contrast-hardened**.
**Authenticated E2E and visual coverage are in place.** **No P0/P1 remains.** Further Profile work is
**beta-evidence-, security-backlog-, or defect-driven.**
