# Thoughtful Seatmate P2C-D — Real-Poster Holdout Validation (Evaluation Packet)

> **Methodology packet + closed outcome.** Sections 1–15 describe *how* the real-poster holdout
> validation was designed and run; that methodology body remains result-free and contains **no
> per-poster A/B mapping, no recommendation, no poster source URLs, and no key**. The final section,
> **"Final outcome — validation failed,"** records the closed result now that the validation is
> complete. The detailed objective metrics live in the separate objective-evidence bundle; rendered
> A/B comparisons live in the separate blind bundle; the per-poster mapping lives only in the sealed
> private key (none of which are committed). This was an isolated, dev-only Design Lab validation: it
> modified no product code, **authors no ADR**, and **starts no production pilot**. Its conclusion is
> that the validation **failed** — see the final section and the
> [validation closure record](thoughtful-seatmate-p2c-d-validation-closure.md).

## 1. Purpose & validation question

Earlier P-series work selected **edge-context** as the contextual-aura source-hue extraction method
on a *generated* poster-like corpus (P2C-C), under the accepted ADR 014–018 controls. Before that
selection can justify a future ADR or any scoped production pilot, it must be shown to hold up on
**genuine film poster artwork**. This phase answers exactly one question:

> *Does the frozen edge-context source-hue extraction method produce a sufficiently stable,
> poster-connected, non-incidental contextual aura on genuine film artwork to justify a future ADR
> and scoped production pilots?*

This is a **validation of a single, already-selected method** — **not** an extraction-method
competition. No new method is introduced, proposed, or tuned.

## 2. Scope & non-goals

In scope: running the frozen edge-context method and an off control over a sealed holdout of genuine
posters; measuring objective stability/validity/suppression; collecting blind image-based judgments
of usefulness-over-off and incidental-colour failure; applying a pre-registered decision rule.

Explicit non-goals (none of these were done):

- introduce or tune any extraction method, or change edge-context;
- reopen ADR 017 / ADR 018, or modify ADR 014–018;
- author ADR 019 or make a go/no-go product decision;
- start production implementation or the Tonight / Film File pilots;
- decide whether extraction would run client-side, server-side, at ingestion, or via a cached
  service (production runtime location is **out of scope**);
- relax any threshold after seeing the holdout.

## 3. Frozen controls

All of the following are **fixed controls**, reused byte-for-byte and never altered here:

- **ADR 014** — Inter for the interface.
- **ADR 015** — the 12-role warm-neutral foundation (canvas `#15120f` … focus `#f3ecdf`) plus the
  functional semantic set (amber / red / green / info).
- **ADR 016** — the ivory decision marker (`#f3ecdf`, 7 px dot in a 14 px slot), never recoloured.
- **ADR 017** — the normalization envelope: validate → OKLCH → suppress missing/invalid → suppress
  source chroma `< 0.04` → preserve hue → set `L = 0.62` → cap retained chroma `C = 0.04` →
  semantic-danger guard → gamut-map.
- **ADR 018** — single-hue radial aura, alpha **0.14**, fixed geometry, 180 ms transition,
  reduced-motion instant, behind the focal film only; no colour on text/controls/marker/focus/
  icons/borders/semantics; no full-page wash, multi-colour field, or legacy gradient.

The **frozen edge-context selector** (verbatim): build the shared deterministic `k = 6` OKLab
clusters once; among eligible clusters, **select the cluster with the highest edge-weighted share**,
where spatial weights are *outer 20 % border = 3.0, next 20 % band = 1.5, centre region = 1.0*;
tie-break by (1) higher edge-weighted share, (2) higher global share, (3) greater spatial spread,
(4) lower deterministic centroid index. The selector reads **poster pixels only** — never title,
genre, country, language, cast, user history, recommendation, mood, availability, popularity, or
rating.

The engine (`extract.js`, `normalize.js` and seeds) is copied byte-identical from P2C-C; the
edge-context output was proven output-equivalent before any holdout work began.

## 4. Genuine-poster sourcing & licensing posture

Per the §7 source order, posters are genuine film artwork retrieved transiently from the TMDB image
CDN using poster paths already present in the project's catalog metadata (read-only). No API key and
no credential are used for the image CDN; no credentials are exposed. Poster **binaries are never
committed** and never enter git history; the corpus and all renditions live only under
`/tmp/feelflick-thoughtful-seatmate-p2c-d-real-posters/`. The display lookup that inlines artwork is
git-ignored. Synthetic, generated, AI-generated, or swatch artwork is **not** used as a substitute —
if genuine artwork had been unobtainable the phase would have stopped as blocked; it was obtainable.

## 5. Corpus composition (genuine artwork)

The frozen corpus is **120 genuine posters = 20 shakedown + 100 sealed holdout**, drawn from a larger
downloaded, decoded, de-duplicated pool (exact-hash and perceptual near-duplicate rejected). The
100-poster holdout is stratified across:

- **Genre** (≥ 8 each): drama, comedy, romance, horror, thriller, action, animation, documentary,
  science-fiction, fantasy.
- **Region** (each present; none > 40 %): North America, India, East Asia, Europe, Latin America,
  Africa/Middle East (plus a small unclassified remainder, capped).
- **Decade** (all present): pre-1980, 1980s, 1990s, 2000s, 2010s, 2020s.
- **Artwork stresses** (objective colour/spatial stresses computed from the canonical raster; visual
  stresses tagged by image-capable review): face-heavy, skin-dominant, title-heavy, logo-heavy, dark,
  white/pale, monochrome, red, violet/magenta, blue/cyan, earth-tone, neon, illustrated, collage,
  tiny-vivid-object, edge≠centre, centre≠edge, unusual-aspect.

Difficult and unpolished artwork was deliberately included; only-famous / only-polished posters were
avoided. The exact per-cell counts are in the objective-evidence bundle's blind manifest (anonymous
poster ids only).

## 6. Shakedown vs holdout protocol

The 20 **shakedown** posters were used **only** to verify the tooling end-to-end — downloading,
decoding, manifest generation, capture framing, blind packaging, performance, and deterministic
replay. They were **never** used to tune edge weights, clustering, thresholds, suppression,
confidence, normalization, alpha, geometry, or the decision rule. The **100 holdout** posters stayed
sealed until the tooling and all thresholds were frozen. No threshold was changed after the holdout
was observed.

## 7. Two conditions & per-poster blinding

Each poster is shown under exactly **two conditions**:

- **edge-context aura** — the frozen method's normalized single-hue field at ADR 018 alpha 0.14; and
- **off control** — the identical DOM, the identical `.p2c-aura` element, the identical geometry /
  layout / transition, with **no colour** (field absent / alpha effectively zero).

The two conditions are labelled **A / B**. The A↔condition assignment is **cryptographically
randomized per poster** (not one global mapping): the aura lands on A for roughly half the posters and
on B for the rest. Because the assignment flips per poster, no per-condition data globally reveals
which letter is the method — the per-poster mapping is held only in the sealed private key. When the
frozen pipeline suppresses a poster, both conditions render identically (no field).

## 8. Pinned decode / extraction / normalization pipeline

Every input is decoded by the **same pinned Chromium decoder**: decode the genuine bytes → flatten
transparency on `#15120f` → high-quality area-downsample to the canonical **48×72** raster → OKLab/
OKLCH → eligibility (exclude transparent, very dark, very light, very low chroma) → shared
deterministic `k = 6` k-means → per-cluster statistics → **edge-context selection** → shared
confidence gate (suppress on missing/no-cluster/low-share/low-chroma/too-few-pixels/low-confidence)
→ ADR 017 normalization → ADR 018 render. Decode is verified deterministic by a repeat-decode hash.

## 9. Transformation & alternate-rendition stability suite

For every holdout poster the aura is re-extracted under **12 standard transforms** (resamples at
25/50/75 %, JPEG re-encodes at q55/q75/q90, WebP, two crops, letterbox, transparent-pad) applied to
the canonical raster, and under **genuine alternate CDN renditions** (w342, w500, w780). Transform
stability is summarized by median and P95 source-hue drift; alternate-rendition stability by the
same-poster cross-rendition P95 drift. **Robustness fixtures** (a missing file and a corrupt byte
stream) confirm safe suppression.

## 10. Objective hard gates (pre-registered)

Pre-registered before the holdout was observed; thresholds were not relaxed afterward:

| Gate | Threshold |
|---|---|
| Deterministic decode | 100 % |
| Decode success | ≥ 99 % |
| Missing / corrupt suppression | 100 % |
| Invalid normalized output | 0 |
| Forbidden-role leakage | 0 |
| Accessibility failures | 0 |
| Median transform hue drift | ≤ 5° |
| P95 transform hue drift | ≤ 18° |
| Unacceptable outputs (blind) | ≤ 5 % |
| Incidental-colour failures (blind) | ≤ 5 % |
| Same-poster alternate-rendition P95 drift | ≤ 22° |

Forbidden-role leakage is satisfied by construction: the selector's signature consumes only pixels +
width + height; no title/genre/country/language/cast/history/mood/availability/popularity/rating is
reachable from it.

## 11. Usefulness-over-off gates (pre-registered)

From the blind A/B adjudication, mapped through the sealed key after judging:

- edge-context **materially better** than off on **≥ 35 %** of all holdout posters;
- off **better** than edge-context on **≤ 10 %** of all holdout posters;
- **both** conditions unacceptable on **0 %** of posters;
- among **emitting** posters: edge-context preferred over off on **≥ 45 %**, off preferred over
  edge-context on **≤ 12 %**.

## 12. Suppression-quality classification

Every suppressed poster (both conditions render no field) is classified by image-capable review as:
*correct suppression* (no stable, materially useful atmosphere existed), *acceptable-conservative*
(a subtle atmosphere existed but absence is not harmful), or *materially harmful suppression* (a
clear, materially useful, stable atmosphere was wrongly dropped). The gate: **materially harmful
suppression ≤ 5 %** of holdout posters.

## 13. Blind scorecard, 20 questions & manual diagnostic reference

A blind scorecard scores the aura condition across five weighted dimensions — atmosphere fit (30),
non-incidental sourcing (25), stability (20), restraint/subordination to the film (15), and
accessibility/identity safety (10) — with a pre-registered pass bar of **≥ 85 / 100**, accompanied by
20 fixed blind questions. Separately, an **image-visible manual diagnostic reference** (two
image-capable reviewers plus a tie-breaker) characterizes, per poster, whether any emitted field
reflects the poster's broad atmosphere or an incidental element. The manual reference is
**diagnostic only** — it informs interpretation and does not by itself decide any gate.

## 14. Pre-registered decision rule

Consideration of a *future* ADR is permitted **only if all ten gate families pass**: (1) deterministic
decode, (2) decode success, (3) missing/corrupt suppression, (4) no invalid output, (5) no
forbidden-role leakage, (6) no accessibility failures, (7) transform hue-drift gates (median ≤ 5°,
P95 ≤ 18°) **and** alternate-rendition P95 ≤ 22°, (8) unacceptable ≤ 5 % **and** incidental ≤ 5 %,
(9) usefulness-over-off gates, (10) suppression-quality gate **and** blind scorecard ≥ 85. If any
gate fails, the pre-registered outcome is **do not proceed to an ADR**. Applying the rule is
mechanical.

## 15. Threats to validity, guardrails & what a pass would (not) authorize

Threats: synthetic adjudication is UX inspection, not real-user validation; the 48×72 canonical
raster is a deliberate fidelity/perf tradeoff; CDN renditions are a limited stand-in for the full
range of production image sources; blind reviewers can perceive aura-vs-no-aura even while blind to
the method label. Guardrails: tooling frozen before the holdout; thresholds pre-registered and not
relaxed; per-poster cryptographic blinding; binaries never committed; sealed key never copied into
the repo or any bundle. A pass would have justified **only** drafting a future ADR and designing
scoped, reversible pilots — never an immediate production rollout. A fail means the method, as frozen,
is not yet validated on genuine artwork.

---

## Final outcome — validation failed

> **The frozen edge-context poster source-hue extraction method did not pass the pre-registered
> real-poster holdout gates. Although it was deterministic, accessible, operationally safe, and
> rarely produced a clearly unacceptable aura, it was not stable enough across image transformations
> and alternate poster renditions, and it did not provide sufficient product value over showing no
> aura. No extraction method is accepted, ADR 019 is not created, and no production pilot is
> authorized.**

### Corpus and protocol

- 20 shakedown posters;
- 100 sealed genuine-poster holdout posters;
- genuine poster artwork sourced from the existing TMDB image-CDN paths;
- no synthetic or AI-generated substitutes;
- no holdout tuning;
- per-poster randomized A/B mapping;
- edge-context versus off;
- 708 captures;
- actual image-capable blind review;
- frozen decision rule.

### Technical gates that passed

- deterministic repeat rate: 100 %;
- decode success: 100 %;
- missing/corrupt safe suppression: 100 %;
- invalid outputs: 0;
- forbidden-role leakage: 0;
- accessibility hard failures: 0;
- median transformation hue drift: 0°;
- unacceptable-output rate: 2 %;
- both-unacceptable rate: 0 %;
- blind weighted score: 89/100;
- off materially better across all holdout posters: 10 %;
- aura preferred among emitting posters: 61.9 %.

### Gates that failed

| Gate | Required | Observed | Result |
|---|---|---|---|
| Transformation P95 hue drift | ≤ 18° | 26.7° | Fail |
| Alternate-rendition P95 hue drift | ≤ 22° | 32.0° | Fail |
| Obvious incidental-color rate among emitted auras | ≤ 5 % | 7.9 % | Fail |
| Edge-context materially better than off, all posters | ≥ 35 % | 19 % | Fail |
| Off preferred among emitted auras | ≤ 12 % | 15.9 % | Fail |
| Materially harmful suppression | ≤ 5 % | 7.0 % | Fail |

The method failed **multiple independent gates** — two stability gates, an incidental-color gate, two
usefulness-over-off gates, and a suppression-quality gate. The conclusion therefore does **not**
depend on any single borderline threshold; even setting aside the closest call, several gates fail by
clear margins.

### Failure mechanism

- transformation drift is **concentrated, not broadly noisy**;
- 13 of 76 emitting posters showed **tie-break flips**;
- affected cases had **low extraction confidence, all < 0.32**;
- median drift remained **near zero**;
- isolated flips reached up to **177.8°**;
- small edge changes can **reorder nearly tied clusters**, swapping the winning hue;
- this is a **genuine property of the frozen selector on ambiguous artwork**;
- it is **not** a decoder, capture, or rendering defect (decode was 100 % deterministic and the
  transforms/renditions applied correctly).

### Product-value finding

- technical safety **did not translate into sufficient incremental usefulness**;
- only **19 %** of all holdout posters were materially improved over off;
- off remained **fully acceptable and was never judged unacceptable**;
- the aura **frequently produced no meaningful difference**;
- on some emitting posters, **off preserved the product hierarchy better**;
- the feature must **earn** the extraction, caching, delivery, testing, and regression complexity it
  would impose — on this holdout it did not.

### Blinding correction disclosure

- an adversarial review discovered an **A/B-keyed verdict file** that could reveal the mapping when
  joined with each poster's emission state;
- the file was **removed from the bundle**;
- **six suppressed-poster noise verdicts were corrected to "equal,"** because both conditions
  rendered an identical no-field screen so a blind preference is undefined;
- the correction **did not alter any pass/fail outcome or the final decision** (it shifted "off
  better across all posters" from 14 % to 10 % and "materially better" from 20 % to 19 %; the
  decision was unchanged);
- the bundles were **regenerated and re-audited**;
- the **private key remained excluded** throughout.

### Final disposition

- **edge-context is not accepted;**
- **no fallback extraction method is selected;**
- **extraction remains unresolved;**
- **ADR 019 is not created;**
- **no production pilot is authorized;**
- **ADR 017 and ADR 018 remain accepted and unchanged;**
- the contextual-color **appearance** remains specified (hue preserved, L = 0.62, C = 0.04, alpha
  0.14, single focal film), but there is still **no accepted poster-to-source-hue method**.

See the companion [validation closure record](thoughtful-seatmate-p2c-d-validation-closure.md) for the
full closure, follow-up research boundaries, and consequences.
