# Thoughtful Seatmate P2C-D — Real-Poster Holdout Validation Closure

> **This is not an ADR.** It is a closure record for a failed validation. It creates no decision,
> authorizes no production change, and is intentionally **not** added to the decision index. ADR 019
> is **not** created. ADR 014–018 remain accepted and unchanged. The companion evidence packet is
> [`thoughtful-seatmate-p2c-d-real-poster-holdout-evaluation.md`](thoughtful-seatmate-p2c-d-real-poster-holdout-evaluation.md).

## 1. Status

**Validation failed — extraction remains unresolved.** The frozen edge-context poster source-hue
extraction method did not pass the pre-registered real-poster holdout gates. No extraction method is
accepted; edge-context is **not** accepted, not provisionally accepted, not pilot-ready, and not a
default. No production pilot is authorized and no production code changed.

## 2. Validation question

> *Does the frozen edge-context source-hue extraction method produce a sufficiently stable,
> poster-connected, non-incidental contextual aura on genuine film artwork to justify a future ADR
> and scoped production pilots?*

This was a validation of a single, already-selected method on **genuine** artwork — not a new
method competition. The answer, on this holdout, is **no**.

## 3. Frozen method

The method under test was the **frozen edge-context selector**, unchanged and un-tuned: build the
shared deterministic `k = 6` OKLab clusters once; among eligible clusters, select the cluster with
the **highest edge-weighted share** (spatial weights: outer 20 % border = 3.0, next 20 % band = 1.5,
centre region = 1.0); tie-break by (1) higher edge-weighted share, (2) higher global share,
(3) greater spatial spread, (4) lower deterministic centroid index. It reads **poster pixels only**.
The engine was copied byte-identical from P2C-C and proven output-equivalent before any holdout work.

## 4. Frozen ADR 014–018 controls

Held fixed and never modified: **ADR 014** (Inter), **ADR 015** (12-role warm-neutral foundation +
functional semantics), **ADR 016** (ivory decision marker), **ADR 017** (strict normalization
envelope: preserve hue, L = 0.62, retained chroma cap C = 0.04, suppression + semantic-safety + gamut
rules), **ADR 018** (single-hue radial aura, compositing alpha 0.14, fixed geometry, focal-film
scope). This validation tested only **extraction**; the appearance treatment was the accepted control.

## 5. Genuine-poster corpus

- **120 genuine posters = 20 shakedown + 100 sealed holdout**, from a larger downloaded pool.
- Genuine film artwork retrieved transiently from the **TMDB image CDN** via catalog poster paths
  (read-only, no API key, no credentials). **No synthetic / generated / AI / swatch substitutes.**
- De-duplicated (exact-hash + perceptual near-duplicate rejected); decoded deterministically.
- Stratified: genre (≥ 8 each across ten genres), region (six named regions present, none > 40 %),
  decade (all six present), and eighteen artwork stresses (face / skin / title / logo / dark / pale /
  monochrome / red / violet / blue / earth / neon / illustrated / collage / tiny-vivid / edge≠centre
  / centre≠edge / unusual-aspect). Difficult, unpolished artwork was deliberately included.
- Poster **binaries were never committed** and never entered git history.

## 6. Holdout protections

- The 20 shakedown posters verified tooling only (download, decode, manifest, capture framing, blind
  packaging, performance, deterministic replay); they were never used to tune weights, clustering,
  thresholds, suppression, confidence, normalization, alpha, geometry, or the decision rule.
- The 100 holdout posters stayed **sealed** until tooling and all thresholds were frozen.
- **No threshold was relaxed after the holdout was observed.**

## 7. Blind methodology

- Two conditions per poster: **edge-context aura** vs an **off control** (identical DOM / aura
  element / geometry / transition; no colour).
- Conditions labelled **A / B** with a **per-poster cryptographic** assignment (not one global
  mapping); the mapping is held only in a sealed private key, never committed or bundled.
- **708 captures** rendered the genuine artwork under both conditions across Tonight and Film File,
  desktop and mobile, high-risk subsets, and states.
- An **image-capable blind A/B adjudication** judged each poster (unacceptable, incidental-colour,
  and which condition better serves a Tonight recommendation), blind to which letter was the method.
- A separate **manual diagnostic reference** (two reviewers + tie-break) characterized whether each
  emitted field reflected the poster's broad atmosphere — diagnostic only, deciding no gate.

## 8. Objective methodology

The same pinned Chromium decoder produced the canonical **48×72** raster (flatten on `#15120f`,
high-quality area-downsample); the frozen edge-context selection + ADR 017 normalization ran
deterministically in Node. Stability was measured under **12 standard transforms** and **genuine CDN
renditions (w342 / w500 / w780)**; robustness fixtures (a missing file and a corrupt byte stream)
checked safe suppression. 1,800 decode operations ran in total. Decode determinism was verified by
repeat-decode hashing.

## 9. Passed gates

- deterministic repeat rate: **100 %**;
- decode success: **100 %** (1,800 / 1,800);
- missing / corrupt safe suppression: **100 %**;
- invalid normalized outputs: **0**;
- forbidden-role leakage: **0** (the selector consumes only pixels + width + height);
- accessibility hard failures: **0** (aura colour confined to the single radial field; reduced-motion
  collapses the transition; forced-colors keeps the field decorative; 400 % zoom shows no overflow);
- median transformation hue drift: **0°**;
- unacceptable-output rate: **2 %**;
- both-unacceptable rate: **0 %**;
- blind weighted score: **89 / 100**;
- off materially better across all holdout posters: **10 %**;
- aura preferred among emitting posters: **61.9 %**.

The method is, in short, **operationally safe**: deterministic, decode-robust, accessible, and rarely
producing a clearly unacceptable aura.

## 10. Failed gates

| Gate | Required | Observed | Result |
|---|---|---|---|
| Transformation P95 hue drift | ≤ 18° | 26.7° | Fail |
| Alternate-rendition P95 hue drift | ≤ 22° | 32.0° | Fail |
| Obvious incidental-color rate among emitted auras | ≤ 5 % | 7.9 % | Fail |
| Edge-context materially better than off, all posters | ≥ 35 % | 19 % | Fail |
| Off preferred among emitted auras | ≤ 12 % | 15.9 % | Fail |
| Materially harmful suppression | ≤ 5 % | 7.0 % | Fail |

Six independent gates fail — across stability, incidental colour, usefulness-over-off, and
suppression quality. The conclusion does **not** rest on a single borderline threshold.

## 11. Failure mechanism

Transformation drift is **concentrated, not broadly noisy**. Of 76 emitting posters (holdout +
shakedown), 13 showed **tie-break flips**, and **all 13 had extraction confidence below 0.32**. For
most, the median drift was **near 0°** while a single transform or alternate rendition flipped the
selected cluster to a near-opposite hue (isolated flips up to **177.8°**). The cause is structural:
on ambiguous artwork two edge-weighted clusters of different hue can be nearly tied, and a small edge
change (a crop, a re-encode, a different CDN downscale) reorders them and swaps the winning hue. This
is a **genuine property of the frozen selector on ambiguous artwork**, not a decoder, capture, or
rendering defect — decode was 100 % deterministic and the transforms/renditions applied correctly.

## 12. Product-value findings

Technical safety did **not** translate into sufficient incremental usefulness:

- only **19 %** of all holdout posters were materially improved by the aura over showing no aura;
- the off control was **fully acceptable and never judged unacceptable** (0 %);
- the aura **frequently produced no meaningful difference** from off;
- on some emitting posters, **off preserved the product hierarchy better** than the aura;
- a contextual aura would impose extraction, caching, delivery, testing, and regression complexity —
  on this holdout it did not earn that cost.

Among the subset where the aura *did* emit, it was the preferred condition 61.9 % of the time — which
clears only the emitting-conditioned sub-threshold, **not** the all-poster usefulness gates; across
the full holdout the aura's net advantage over off is below the bar and the validation fails.

## 13. Suppression findings

Of the 100 holdout posters, **37 suppressed** (no field under either condition) and 63 emitted —
consistent with the synthetic P2C-C range (36–41 %). Suppression was driven by the shared confidence
gate and the ADR 017 envelope (normalization suppression, low confidence, low share, low chroma).
But **materially-harmful suppression was 7.0 %** of holdout posters — above the ≤ 5 % bar — meaning
the frozen pipeline dropped a clear, materially-useful, stable atmosphere on more posters than the
gate permits. The selector both **flips** on some ambiguous posters and **over-suppresses** on others.

## 14. Regional / genre / style findings

The holdout was stratified, and the failures were **not isolated to one stratum**:

- **Drift flips** track *low extraction confidence and near-tied clusters*, an artwork-ambiguity
  property that appears across genres and regions rather than in any single bucket.
- **Incidental-colour failures** concentrated on **title-heavy, collage, and multi-colour** artwork,
  where a bold title hue or one isolated panel can win the edge-weighted share even though it does not
  represent the poster's broad atmosphere.
- **Suppression** was more common on near-achromatic, monochrome, and low-chroma vintage artwork
  (correctly), but **harmful suppression** also appeared on some genuinely warm/atmospheric posters.
- **Caveat (evidence limitation):** per-stratum cell sizes are small (roughly 8–11 posters per genre
  or region), so stratum-level usefulness differences are **not statistically conclusive**; these are
  qualitative tendencies from the blind review and manual diagnostic reference, not powered
  sub-analyses. The aggregate gate failures, however, are clear.

## 15. Blinding leak and correction

An adversarial review of the evidence bundles found a real blinding weakness and it was corrected
transparently:

- an **A/B-keyed per-poster verdict file** had been placed in the objective bundle; joined with each
  poster's emission state it could **recover the sealed A/B↔aura mapping** (a suppressed poster
  renders both conditions identically, so any non-equal verdict betrays key-aware data);
- the file was **removed from the bundle**;
- **six suppressed-poster verdicts that had picked a side were corrected to "equal,"** the only valid
  reading for identical no-field renders;
- the correction **did not change any pass/fail outcome or the final decision** — it shifted "off
  better across all posters" from 14 % to 10 % and "materially better" from 20 % to 19 %, and the
  decision (fail) was unchanged;
- the bundles were **regenerated and re-audited**; the **private key remained excluded** from the
  repository and from every bundle throughout.

This correction is disclosed rather than concealed.

## 16. Decision-rule application

The pre-registered rule permits considering a future ADR **only if all ten gate families pass**.
Six gates fail (§10). Applying the rule mechanically, the outcome is **do not proceed to an ADR**.
The passing blind scorecard (89 / 100) does **not** override the failing per-gate thresholds; the
decision rule uses the per-gate results, not the scorecard alone.

## 17. Final disposition

- **edge-context is not accepted** (not provisionally accepted, not pilot-ready, not a default);
- **no fallback extraction method is selected;**
- **extraction remains unresolved;**
- **ADR 019 is not created;**
- **no production pilot is authorized;**
- **ADR 017 and ADR 018 remain accepted and unchanged;**
- the contextual-color **appearance** remains specified (hue preserved, L = 0.62, C = 0.04, alpha
  0.14, single focal film), but there is still **no accepted poster-to-source-hue method**, so there
  is **no production aura**.

## 18. Consequences

- The contextual film aura **cannot ship** until a future extraction method passes a real-poster
  holdout of at least this rigor.
- Manual deterministic seeds remain **non-production** (they were a test instrument only).
- The P2C-D prototype, corpus, bundles, and key remain **isolated and uncommitted**; nothing from the
  prototype enters production or the repository.
- Durable authority (the design-authority document, the design-system rule, and the root guide) now
  records that edge-context failed and must not be implemented in production.

## 19. What remains unresolved

- which poster-to-source-hue **extraction method**, if any, can be both stable and useful on genuine
  artwork;
- how to behave when an extraction is **ambiguous** (near-tied clusters);
- how to keep extraction **stable** across crops, compression, and CDN renditions;
- how to **suppress** appropriately without dropping clearly useful atmospheres;
- whether a contextual aura earns its complexity over simply showing **no aura**.

## 20. Follow-up research boundaries

The evidence indicates that any *future* extraction research must address: (1) ambiguity between
near-tied clusters; (2) instability across trims, compression, and CDN renditions; (3) suppression
when the winning margin is too small; (4) excessive suppression of useful posters; (5) incidental edge
colours; and (6) demonstrable value over off.

Permitted *future hypotheses* (recorded as research directions only — **none is accepted, none is
selected, and they must not be combined into a new method here**):

- winner-margin confidence;
- cross-rendition consensus;
- stability-aware suppression;
- cluster persistence across lightweight transformations;
- multiple-edge-region agreement;
- "no aura" when extraction is ambiguous.

No next experiment is approved or named as approved by this document. Any future attempt must be its
own pre-registered, real-poster-holdout-validated effort.

## 21. Evidence limitations

- The blind review and manual diagnostic reference are **image-capable synthetic inspection**, not
  real-user validation.
- The canonical **48×72** raster is a deliberate fidelity/performance tradeoff.
- The CDN renditions (w342 / w500 / w780) are a limited stand-in for the full range of production
  image sources.
- Per-stratum cell sizes are small, so genre/region/style sub-findings are **directional, not
  conclusive** (§14).
- Blind reviewers can perceive aura-vs-no-aura even while blind to the method label; the blinding
  protects *which letter is the method*, not the existence of a field.

## 22. No-production-change statement

This closure changed **documentation only**. No production code, CSS, design tokens, components,
routes, tests, fonts, or visual baselines were modified. No poster binaries, source URLs, private
manifests, A/B mappings, credentials, or private keys were committed. The P2C-D prototype remains
uncommitted and was treated as read-only. ADR 014–018 are unchanged, no ADR 019 was created, no
decision-index row was added, no global contextual-color token was created, and no production pilot
was authorized.
