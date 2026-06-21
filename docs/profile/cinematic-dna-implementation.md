# Cinematic DNA — implementation record (redesign)

Implementation record for the evidence-led Cinematic DNA portrait redesign of `/profile`. This
documents WHAT shipped and the contracts it preserves. It does **not** replace the historical F7
decision ledger ([`f7-summary.md`](f7-summary.md)) or
[`cinematic-dna-profile-vnext-f7.md`](../cinematic-dna-profile-vnext-f7.md), and it does not
rewrite [`product-doctrine.md`](../product-doctrine.md).

- Approved base: `a6da9f6f5aac82f1991874172dd0b862504b801e`
- Implementation head: `7414bf7c0c0f22d16bfc84443d34dd1088a56c5b`
- Foundation: Adaptive Editorial Cinema ([ADR 021](../decisions/021-adaptive-editorial-cinema-foundation.md)) — Inter-only, flat Ink canvas, ivory primary, single coral signal.

## Locked-prototype authority

The visual + IA authority is the locked prototype `feelflick-cinematic-dna-mobile-final(1).html`
(kept untracked under `.cdna-tmp/prototype/`, never committed). The production surface reproduces
its composition; documented deviations below exist only where truthfulness or an unbuilt backend
required them. No further visual reinterpretation is permitted without a new approval.

## Primary experience

A private, evidence-led taste portrait: a cinematic Portrait hero (deterministic archetype identity
+ privacy-safe Passport preview), a sticky **Portrait · Response · Journey · Voices · Passport**
section nav, then Response (rating language), Journey (chapters), Voices (directors), the Cinematic
Passport (privacy-safe export), and an Evidence sheet. Everything is owner-private.

## Evidence classification (Measured / Derived / Generated)

The Evidence sheet separates three layers and discloses that the language model does **not**
calculate the profile:
- **Measured** — direct account facts (watched films, ratings + distribution, repeated directors, dates).
- **Derived** — deterministic, inspectable formulas (archetype, evidence band, rating language, journey chapters, normalized director order, passport tags).
- **Generated** — only the short written reflection (summary + signature), from a bounded packet of the evidence above; shown only when current.

## Rating storage / display contract + ten-bucket decision

`user_ratings.rating` is the canonical integer **1–10** scale; display = `rating / 2` (0.5★…5.0★).
The in-app star UI writes `stars × 2` (even values); external imports can write odd values
(half-stars). The Response histogram therefore uses **ten 0.5★ buckets** keyed by the stored
integer — the exact stored contract, never nine forced buckets. Behavioural interpretation
("warm, but selective", etc.) appears only at ≥ 8 ratings and is derived from the distribution
(average + five-star rarity), never the average alone, never via the LLM.

## Journey eligibility + segmentation

Deterministic chronological segmentation: returns **0** chapters below the floor (≥ 12 films + a
real time span), **2** for a medium span, **3** only for a larger span (≥ 24 films + ≥ 18 months).
Real min/max watch dates per chapter; a mood must be supported by ≥ 2 films to headline a chapter
(no single-film claims). Never forces a third chapter; the headline adapts to the real count; no
fabricated prose.

## Voices — director-only scope

Headline "**The voices you trust.**" (locked) with explicit scope copy ("Shown through the
directors you return to most, among filmmakers with at least two films of evidence"). The nav label
is **Voices**; the section id is `dna-voices`. Eligibility ≥ 2 films; deterministic ordinal ranking;
**normalized, unlabeled** bars (no 0–100 score, no percentage, no false precision); factual labels
only (films watched, average stars). No writer/actor/cinematographer claim — only director data exists.

## Maturity vs evidence-maturity (presentation distinction)

Two independent axes, both unchanged in formula:
- **Identity maturity** (`classifyProfileMaturity`): forming / taking-shape / established → which
  composition renders.
- **Evidence band** (`deriveConfidenceBand` over `computeDnaConfidence`): the richness of evidence.

To avoid a specific archetype reading as contradictory beside the bare phrase "Still forming", the
hero presents the band with **evidence-maturity vocabulary** — "Evidence still growing / taking
shape / well established" — plus an accessible "Taste evidence maturity: …" label. This is
presentation only: `classifyProfileMaturity`, `deriveConfidenceBand`, `computeDnaConfidence` and the
Profile/Account shared number are unchanged. The forming page still says "Your Cinematic DNA is
still forming" (that refers to the identity state itself).

## Passport privacy whitelist

The Cinematic Passport (preview + exported PNG) renders ONLY: a safe display label / first name,
the archetype, the current valid signature, ≤ 4 grounded tags, the decorative barcode, and FeelFlick
branding. It excludes surname (where not approved), email, UUID, exact counts, history, reviews,
friends, and timestamps. The exported PNG (`html-to-image` `toPng`) is CORS-safe by construction
(abstract face, no remote artwork) and carries the same whitelist (rasterised pixels, no text/metadata identifiers).

## Barcode privacy model

The passport barcode is decorative and deterministic from a **privacy-safe seed** = evidence
version + archetype + **sorted** tags. It is identical for identical safe input, tag-order
invariant, changes with allowed DNA inputs, and ignores user id / email / film ids. The rendered
DOM is CSS-custom-prop bars only; no reconstructable raw evidence in DOM or image.

## Explicit-only editorial refresh

No Edge call on page load or when opening the Evidence sheet. The reflection is (re)generated only
by an explicit user action, gated by the `profileRefresh` kill switch, within a 24h TTL +
evidence-version validation. A failed refresh preserves the last valid reflection; stale/missing
states surface an honest "Generate reflection" affordance inside the Evidence sheet. The Edge
function schema is unchanged.

## Forming / taking-shape / established states

- **Forming** — no archetype, no generated prose, factual counts + guidance + a route to Tonight.
- **Taking shape** — deterministic archetype with tentative framing.
- **Established** — full composition; the evidence band still reflects real richness (an established
  identity can carry "Evidence still growing").
- **Loading / error / private** — polite status skeleton; fixed safe error copy (raw backend text
  never shown); owner-private state for `/profile/:userId` of another user with **zero** profile-data fetch.

## Omitted correction action

The hero's "Doesn't feel like me" action from the prototype is **not rendered**: no correction
persistence exists, and a fake success would be dishonest. The hero offers "Share portrait" in its
place. Re-adding it requires a separately approved correction backend.

## Deferred deep dossier (and other deferred scope)

Deliberately deferred (present in the prototype for reference only): correction persistence,
"Doesn't feel like me" success state, deep-dossier tabs, anchors, saved-vs-watched comparisons,
moment/context change claims, stable-vs-emerging traits, per-context learning bars, expanded LLM
output, public-Profile sharing, and any database migration.

## Intentional prototype deviations (truthful by design)

1. **Passport title separator** — the production archetype is structurally two-part, so the passport
   title renders e.g. "The Watcher · The Quiet"; the prototype used a single poetic phrase. The
   capture comparison for this is labelled **matched-length**, not "same-content".
2. **Ten half-star buckets vs the prototype's nine illustrative bars** — production keeps the
   truthful 1–10 contract.
3. **"Share portrait" replaces the unsupported correction action.**
4. **Correction + deep dossier deferred.**

## Visual-review process

The redesign passed an external screenshot review across three rounds: initial implementation, a
corrective pass (four mobile/desktop release-blockers), and a fidelity pass (Portrait nav IA +
"Voices" headline). Evidence was delivered as portable ZIP bundles (prototype vs truthful-production
vs matched-length, side-by-sides, 50% overlays, shell-visible reachability, state matrix, exported
passport, privacy/barcode evidence). Bundles and the prototype were never committed.

## CI baseline provenance

Playwright snapshots are platform-specific; the authoritative baselines are **Linux**, generated in
CI (macOS-local snapshots are not authoritative). Authenticated Profile baselines are regenerated by
pushing a `visual-baselines/profile-*` branch, which runs `npm run test:visual:profile:update` on
Linux and commits the snapshots back; those are then folded into the feature branch. The visual
states live in `e2e/visual-auth/profile.visual.js` (+ `…-snapshots/`), driven by the deterministic
`e2e/fixtures/profile.js` interception fixture (fixed clock, seeded RNG, reduced motion, DSF 1, no
live backend). A production-fixture-containment test
(`src/features/profile/__tests__/ProductionFixtureContainment.test.js`) proves a shipped build can
never activate the capture fixtures.

## Rollback boundary

This change is **presentation, pure Profile derivations, route composition, tests, and
Profile-owned visual baselines only**. No engine, schema, migration, RLS, auth, LLM-contract,
shared-confidence-formula, route, or package change. Reverting the Profile feature files + the
Profile snapshots fully rolls it back.
