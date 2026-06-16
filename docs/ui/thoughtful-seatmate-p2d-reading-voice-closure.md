# Thoughtful Seatmate P2D — Film File Reading Voice Closure

> **This is not an ADR.** It records the application of **ADR 014** to the previously-unresolved
> long-form Film File typography question. It creates no new decision policy, authorizes no production
> change, and is intentionally **not** added to the decision index. ADR 014 remains unchanged. The
> companion evidence packet is
> [`thoughtful-seatmate-p2d-filmfile-reading-voice-evaluation.md`](thoughtful-seatmate-p2d-filmfile-reading-voice-evaluation.md).

## 1. Status

**Resolved — Film File remains Inter-only.** A bounded Newsreader long-form exception was tested
against Inter-only and did not satisfy the pre-registered decision rule. No new ADR; no production
migration.

## 2. Question resolved

The single typography question ADR 014 left open: *does a serif earn a narrowly-bounded role in
genuinely long-form Film File reading?* Resolved: **no** — Film File long-form body prose remains
Inter.

## 3. Existing authority

ADR 014 accepted **Inter** as FeelFlick’s single core Latin sans-serif voice and retired the
“Inter-is-the-system, Newsreader-is-the-curator” split. P2D tested only whether a tightly bounded
long-form exception was defensible; it does not introduce new typography policy. ADR 015 (foundation),
ADR 016 (ivory decision signal), and ADR 017/018 (contextual-color appearance) are unchanged controls.

## 4. Treatments

Exactly two: **A = Inter-only** (Inter everywhere, including long-form reading prose, the ADR 014
default); **B = bounded Newsreader exception** (Inter for all interface/structure; Newsreader only on
paragraph/blockquote/list prose inside a dedicated long-form Film File reading body). No third serif.

## 5. Single-variable boundary

The only intended visual variable was the eligible long-form prose font-family. Reading-column width
(686 px desktop), font-size (18 px), line-height (31 px), letter-spacing, paragraph spacing, margins,
padding, headings, colours, hierarchy, DOM, and content were held **identical** between treatments and
verified byte-equal across 66 fixture×viewport pairs.

## 6. Long-form fixture set

12 original, non-copyrighted long-form reading bodies (~750–1,100 words; invented films, fictional
disclaimers) across editorial modes (reflective, evidence-led, cinematography, performance,
theme/subtext, historical, restrained disagreement, mixed/negative, tired-reader, dense, quote-heavy,
list-heavy), plus 4 length controls (short/medium/long stay Inter in both treatments; full = long-form)
and 6 mixed-script fixtures (Latin diacritics, Bengali, Devanagari, Japanese, Korean, multi-script).

## 7. Blind methodology

Treatments were presented as **Treatment X / Treatment Y**, mapped by a cryptographic sealed key with
counterbalanced order; the review UI hid internal names, font values, computed details, the mapping,
and the prior ADR outcome. 182 deterministic captures spanned long-form, counterbalanced sheets, length
controls, mixed-script, and layout/state stresses. The blind scorecard was locked before the objective
bundle was opened; the private key was unsealed only afterward, for the audit trail.

## 8. Locked blind scores

| Dimension | Weight | Inter-only | Bounded Newsreader |
|---|---|---|---|
| Sustained reading comfort | 30 | 4 | 5 |
| Product-voice coherence | 25 | 5 | 4 |
| Hierarchy and scanability | 20 | 4 | 5 |
| Cross-content and script robustness | 15 | 5 | 4 |
| Implementation confidence | 10 | 5 | 4 |
| **Weighted total** | **100** | **90** | **90** |

Unsealed mapping (audit trail only; key/hashes not committed): **Treatment X = Inter-only; Treatment
Y = bounded Newsreader.**

## 9. Newsreader strengths

Bounded Newsreader was genuinely stronger for: sustained reading comfort; reflective and analytical
long-form prose; long paragraphs; quotations and italics; the distinction between interface structure
and reading body; and recovery after losing one’s place. These advantages are real and recorded — the
decision does not pretend Newsreader is a poor typeface or that serif reading typography never works.

## 10. Inter strengths

Inter-only was stronger for: continuity with the surrounding Film File UI; product-voice coherence;
evidence-heavy prose; lists; links; footnotes; mixed-script fallback; predictable implementation; and
maintaining one coherent product voice.

## 11. Objective eligibility

Both treatments cleared the disqualifying gates: both passed accessibility; both passed scope
containment (eligible serif only inside the long-form article; **0 forbidden-scope leaks**); both had
identical DOM and content; neither overflowed at any required mobile or zoom state; both preserved
mixed-script content and content under fallback; neither produced invisible text during load; there
was no production-bundle leakage and no missing-glyph or content-loss failure. Neither treatment was
disqualified — the decision was made on the weighted scores and the rule, not by elimination.

## 12. Loading and layout findings

Measured font-swap reflow (fallback → web font, long-form bodies, desktop): **Inter-only mean 116 px /
max 186 px; bounded Newsreader mean 160 px / max 217 px.** Both web fonts already exist in the shipped
transitional baseline, so the prototype introduced no new dependency or network request. Bounded
Newsreader still carried **44 px greater mean** and **31 px greater maximum** reflow. No interactive
control sat below the article body, but the reading position could move during delayed font loading.
This was a robustness penalty, **not** the sole reason for the decision.

## 13. Fallback and mixed-script findings

Fallback stacks (A `Inter → system-sans`; B `Newsreader → Georgia/Times`) preserved content with no
invisible text in either treatment. Newsreader covers extended Latin (French/Spanish/German diacritics
render in the reading face); Bengali, Devanagari, and CJK fall to the same system stack in both
treatments, so the non-Latin glyphs are font-identical across treatments. Inter-only was judged
slightly more robust across the mixed-script and evidence/list/link/footnote content; no severe seam
caused a content-loss failure in either treatment.

## 14. Decision-rule application

Pre-registered serif-win requirements and results:

1. beat Inter-only by ≥ 5 points overall — **failed** (tied 90–90);
2. lead sustained reading comfort by ≥ 1 rating point — **met** (5 vs 4);
3. not score lower on product-voice coherence — **failed** (4 vs 5);
4. not score lower on cross-content/script robustness — **failed** (4 vs 5);
5. introduce no material loading/fallback penalty — **weakened** (greater reflow);
6. tie defaults to **Inter-only**.

The bounded Newsreader exception **does not qualify**. The conclusion does not rest on the comfort lead
alone; it rests on the overall tie plus the coherence, robustness, and reflow results, under a rule
that requires a *clear* advantage to displace the accepted incumbent.

## 15. Final decision

**Film File remains Inter-only, including genuinely long-form reading bodies.** No bounded Newsreader
exception is accepted. ADR 014 remains the governing typography decision and is unchanged. No new ADR
is created. No production migration is authorized.

## 16. Consequences

- Inter is the **sole accepted Film File reading voice**; long-form prose stays Inter.
- **No second long-form reading voice** is justified by the P2D evidence.
- **Do not introduce Newsreader or another serif into Film File long-form body prose.**
- No new font dependency or type token is created.
- The durable design authority and design-system rule now record this and remove the serif-role
  question from the list of unresolved prototype questions.

## 17. Existing transitional usage

This decision does **not** approve, expand, or remove existing shipped Newsreader usage. Newsreader
remains part of the **transitional shipped baseline** only (e.g. current `/home` editorial moments).
The app is **not** uniformly Inter; do not claim that it is.

## 18. Production migration boundary

- This experiment authorizes **no** typography migration.
- Existing Newsreader usage must **not** be removed opportunistically; any removal requires a separate,
  deliberate, scoped migration with its own re-baselining.
- Inter-only consolidation continues only through the established migration gates.

## 19. Evidence limitations

The review used prototype fixtures, not real-user reading sessions; reading comfort was assessed by
expert image-based inspection; objective geometry (lines, chars/line, heights) does not prove
comprehension; the 750–1,100-word fixtures approximate Film File depth but do not cover every future
content type; browser/system script fallback varies by operating system. None of these overclaim
reading-speed or comprehension gains. The result is still sufficient to **reject** the exception
because the pre-registered rule required a clear advantage and the outcome was a tie.

## 20. No-production-change statement

This closure changed **documentation only**. No production code, CSS, design tokens, fonts, routes,
tests, or visual baselines were modified; no production Film File component was touched. No prototype
source, generated fixtures, captures, bundles, mapping file, font binaries, or private key were
committed. ADR 014–018 are unchanged, no new ADR was created, and no decision-index row was added.
