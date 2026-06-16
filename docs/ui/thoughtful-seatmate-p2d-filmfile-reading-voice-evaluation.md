# Thoughtful Seatmate P2D — Film File Reading Voice (Evaluation Packet)

> **Methodology packet + resolved outcome.** Sections 1–20 describe *how* the Film File reading-voice
> typography experiment was designed and run; that methodology body was authored result-free during
> construction (no winner, ranking, recommendation, or mapping). The experiment is now **resolved**:
> the final section, **"Final outcome — Inter-only retained,"** records the locked blind scores, the
> now-unsealed X/Y mapping, the decision-rule application, and the decision. The private key was opened
> only to complete the audit trail; the key file and its fixture hashes are not committed. This was an
> isolated, dev-only Design Lab experiment: it modified no production Film File component, **authored no
> ADR**, and **starts no production migration**. Decision: **Film File remains Inter-only**; see the
> companion [closure record](thoughtful-seatmate-p2d-reading-voice-closure.md).

## 1. Experiment question

Should FeelFlick remain entirely Inter, or should genuinely long-form Film File prose receive a
tightly bounded Newsreader serif exception? Precisely:

> *Does Newsreader materially improve sustained long-form Film File reading enough to justify a
> tightly bounded exception to the accepted Inter-only core voice?*

It is **not** a font tournament: exactly two treatments are compared, and no third serif is introduced.

## 2. Why the serif role remained unresolved (before P2D)

ADR 014 accepted **Inter** as the single core Latin sans-serif voice and retired the F3/F4
“Inter-is-the-system, Newsreader-is-the-curator” split. The design authority and design-system rule
both left exactly one typography question open: *whether a serif earns a narrowly-bounded role in
genuinely long-form Film File reading.* P2D resolves only that question, under the frozen ADR 014–018
controls and the P2C-D closure.

## 3. The two treatments

- **Treatment A — Inter-only:** Inter for every element, including all long-form reading prose. This
  is the accepted ADR 014 default.
- **Treatment B — bounded Newsreader exception:** Inter for every interface and structural element;
  Newsreader applied **only** to paragraph text, blockquotes, and list prose inside a dedicated
  long-form Film File reading body.

## 4. Single-variable boundary

The only intended visual variable is the **font-family of eligible long-form prose**. Held identical
in both treatments: font-size, weight, line-height, letter-spacing, paragraph spacing, reading-column
width, margins, padding, headings, labels, content, DOM, element order, colours, backgrounds,
controls, links, blockquote treatment, list indentation, viewport, zoom, poster, contextual-color
state, selected state, motion, and loading behavior. No treatment was optically retuned; no size or
spacing was changed to flatter either font.

## 5. Eligible and forbidden serif scope

**Eligible (Treatment B serif):** `<p>`, `<blockquote>`, and `<li>` prose inside an
`<article class="p2d-reading" data-longform="true">` — the explicitly flagged long-form reading body.
Activation is an **explicit experimental flag**, never a hidden word-count heuristic.

**Forbidden (always Inter, both treatments):** page/film title, recommendation reason, short/medium
explanations, section headings, in-body headings, eyebrows, metadata, cast/crew, ratings,
availability, buttons, controls, tabs, chips, labels, captions, footnotes, source labels, evidence
headings, pull-out metrics, navigation, modal chrome, Diary, Cinematic DNA, Tonight, landing,
sharing, and the logo.

## 6. Fixed type settings

Long-form body, both treatments — desktop: `font-size 18px; font-weight 400; line-height 1.72;
letter-spacing normal; max-width 68ch`. Mobile (≤767px): `font-size 17px; line-height 1.7; max-width
none`. Newsreader italics are used only where the same semantic text is italic in Inter; no drop
caps, pull quotes, ornaments, rules, or editorial flourishes were added.

## 7. Frozen ADR controls

- **ADR 014** — Inter remains the accepted core interface voice; P2D tests only a bounded long-form
  exception.
- **ADR 015** — the warm-graphite / projection-ivory foundation, used unchanged.
- **ADR 016** — the ivory-only decision signal, unchanged.
- **ADR 017 / ADR 018** — the contextual-color appearance (source hue preserved, L = 0.62, C = 0.04,
  alpha 0.14, one focal film) is unchanged. Because **no extraction method is accepted** (P2C-D
  closure), the experiment uses **no aura** — identical in both treatments — so typography is tested
  independently of contextual-color extraction. Edge-context is not revived; no extraction is built.

## 8. Content-fixture design

All prose is **original**, non-copyrighted, written for the experiment; every film and person is
invented (each fixture carries a fictional-disclaimer footnote). Twelve long-form reading bodies
(~750–1,100 words) span editorial modes: reflective recommendation, evidence-led fit, cinematography,
performance, theme/subtext, historical/contextual, restrained disagreement, mixed/negative
assessment, tired-reader accessibility, denser analysis, quote-heavy, and list/evidence-heavy. Four
length controls (short 50–90w, medium 180–300w, long 450–600w, full 750–1,100w) verify the serif does
not leak into ordinary copy: short / medium / long stay Inter in **both** treatments.

## 9. Viewport and zoom matrix

Desktop 1440×1200 / 1280×900 / 1024×900; tablet 768×1024; mobile 430×932 / 390×844 / 360×800; zoom
100% / 200% / 400%. Captures and objective measurements were taken across this matrix without changing
unrelated styles to simulate states.

## 10. Mixed-script plan

Fixtures embed invented names/short passages in Latin diacritics (French/Spanish/German), Bengali,
Devanagari, Japanese, and Korean, plus a multi-script line. Newsreader covers extended Latin; Bengali/
Devanagari/CJK fall to the existing system fallback in both treatments. No additional script font was
installed; actual fallback behavior is recorded rather than assumed, and a severe mixed-font seam is
treated as a robustness failure.

## 11. Font-loading and fallback plan

Fonts load from the existing global Google Fonts `<link>` (`display=swap`; no new package, no font
binaries). Font states simulated: available, cached, loading, delayed, unavailable/fallback. Fallback
stacks: A `Inter → system-sans`; B `Newsreader → Georgia/Times`. The fallback→web-font reflow is
measured per treatment.

## 12. Accessibility gates

Both treatments must pass: WCAG text contrast; no clipping; no horizontal scroll at 200%/400% zoom;
usable at 360px; unchanged focus styles; identifiable links; unchanged semantic HTML and screen-reader
order; font carries no meaning; fallback preserves content; no invisible text during load;
reduced-motion and forced-colors behavior unchanged; no control/touch-target change; no layout shift
that moves an active control; no text-selection or copy/paste defect. Any hard accessibility failure
disqualifies a treatment.

## 13. Typography-specific gates

A treatment is disqualified if: the font leaks outside its allowed scope; content or DOM differs
between treatments; text is unreadable during loading; fallback drops glyphs; mixed-script loses
content; horizontal overflow occurs at a required viewport/zoom; glyphs clip; layout shift materially
moves a control or reading position; treatment order affects rendering; the ordinary production build
includes the experiment; selection/copy/links break; unsupported scripts are forced into an
unsuitable font; or the treatment alters colour, spacing, width, or hierarchy outside the eligible
font family.

## 14. Blind protocol

Two treatments were presented as **Treatment X / Treatment Y**, mapped to the internal treatments by a
**cryptographic** sealed key, with counterbalanced left/right order. The default review UI hid the
internal names, font-family values, computed font details, the X/Y mapping, the prior ADR outcome,
and any recommendation/winner language. The blind reviewer could of course *see* serif-vs-sans; the
blinding withheld *which letter is the already-accepted incumbent*, to prevent status-quo anchoring.

## 15. Scorecard

A weighted blind scorecard rated five dimensions — sustained reading comfort (30%), product-voice
coherence (25%), hierarchy and scanability (20%), cross-content and script robustness (15%), and
implementation confidence (10%) — each 1–5, with 20 required written questions. A treatment cannot
win for looking more cinematic, premium, literary, or editorial; it must improve the actual reading
experience.

## 16. Objective metrics

Per treatment × fixture × viewport × font-state: computed font-family, fallback use, font-load timing
and swap reflow, paragraph/article geometry, line count, characters per line, orphan/one-word final
lines, overflow, clipped glyphs, mixed-script fallback, zoom/mobile overflow, contrast, DOM identity,
and production-bundle exclusion. Geometric metrics are implementation and robustness evidence only —
they do **not** prove reading comprehension or comfort.

## 17. Pre-registered decision rule

Recorded before captures: accessibility hard failure, scope leakage, missing-glyph/content loss,
required-viewport/zoom overflow, material font-loading layout shift, or any treatment-dependent
DOM/content difference each **disqualify**. Eligible treatments must score ≥ 85/100. **Inter-only is
the default**; the bounded serif may win only if it beats Inter-only by ≥ 5 points overall, leads
sustained reading comfort by ≥ 1 full rating point, does not score lower on product-voice coherence
or cross-content/script robustness, and introduces no material loading/fallback penalty. A lead below
five points, or a tie, defaults to Inter-only. “More cinematic / premium / literary / editorial”
cannot justify selection.

## 18. Evidence limitations

The blind review is image-capable inspection, not real-user reading-comprehension testing. Geometry
(lines, chars/line, heights) is robustness evidence, not a comfort measure. Font-swap reflow is
measured as a synthetic worst case (fully-rendered fallback → web font); production `display=swap`
with CDN caching typically shifts less and earlier. Mixed-script coverage is limited to the existing
fonts and system fallback (no script fonts installed). Optical-size and hinting differences across
platforms are not exhaustively enumerated. Reading comfort was assessed by expert image-based
inspection of prototype fixtures, not real-user reading sessions; the 750–1,100-word fixtures
approximate but do not exhaust future Film File content. The result is still sufficient to reject the
exception because the pre-registered rule required a clear advantage and the outcome was a tie.

**Blinding limitation (disclosed).** Perfect blinding is impossible for a serif-vs-sans comparison: the
font difference is visible by design, and because the two faces render at different compactness, an
attentive reviewer holding the blind and objective bundles together could match article heights and
recover the X/Y → treatment mapping (taller render ↔ the more open face). The mitigation was the
**lock-first sequencing control** (lock the blind X/Y scorecard before opening the objective bundle),
stated in both bundle READMEs; neither bundle stated the mapping and the key was excluded from both.

## 19. No-winner statement (as run)

During construction this packet selected **no winner** and applied **no decision** — the protocol and
evidence design only. The decision below was made afterward, from the locked blind scorecard plus the
objective bundle, and is recorded in the **Final outcome** section and the closure record.

## 20. No-production-change statement

Nothing here changes production. No production Film File component, CSS, token, route, test, font, or
visual baseline was modified; no new font dependency or font binary was added; the guarded route is
excluded from the ordinary production build. Nothing was committed, pushed, merged, or deployed, and
no ADR was created.

---

## Final outcome — Inter-only retained

> **The bounded Newsreader long-form exception did not satisfy the pre-registered decision rule.
> Although it improved sustained reading comfort, reflective prose, long paragraphs, quotations, and
> reading-body scanability, it tied Inter-only overall at 90/100, scored lower on product-voice
> coherence and cross-content/script robustness, and introduced greater font-swap reflow. Film File
> therefore remains Inter-only, including genuinely long-form reading bodies. ADR 014 remains the
> governing typography decision. No production migration is authorized by this experiment.**

Unsealed mapping (opened only to complete the audit trail; the key file and its fixture hashes are not
committed): **Treatment X = Inter-only; Treatment Y = bounded Newsreader.**

### Experiment design (as run)

- exactly two treatments — Inter-only vs bounded Newsreader;
- only the eligible long-form body font-family differed;
- identical DOM, content, reading-column width, font-size, line-height, spacing, colours, and hierarchy;
- an explicit long-form flag (not a word-count heuristic);
- Newsreader forbidden outside `<p>`, `<blockquote>`, and `<li>` descendants of the designated
  long-form article;
- short, medium, and ordinary-long copy remained Inter in both treatments;
- 12 full-length fixtures (~750–1,100 words);
- mixed-script, loading, fallback, mobile, tablet, and zoom stresses;
- 182 deterministic captures;
- anonymous X/Y review;
- the blind scorecard was locked before objective evidence was opened;
- the private key was opened only after reconciliation.

### Blind scores

| Dimension | Weight | Inter-only | Bounded Newsreader |
|---|---|---|---|
| Sustained reading comfort | 30 | 4 | 5 |
| Product-voice coherence | 25 | 5 | 4 |
| Hierarchy and scanability | 20 | 4 | 5 |
| Cross-content and script robustness | 15 | 5 | 4 |
| Implementation confidence | 10 | 5 | 4 |
| **Weighted total** | **100** | **90** | **90** |

### What Newsreader improved

Bounded Newsreader was stronger for: sustained reading comfort; reflective and analytical long-form
prose; long paragraphs; quotations and italics; the distinction between interface structure and
reading body; and recovery after losing one’s place.

### What Inter preserved better

Inter-only was stronger for: continuity with the surrounding Film File UI; product-voice coherence;
evidence-heavy prose; lists; links; footnotes; mixed-script fallback; predictable implementation; and
maintaining one coherent product voice.

### Objective evidence

- both treatments passed accessibility;
- both passed scope containment (eligible serif only inside the long-form article; 0 forbidden leaks);
- both had identical DOM and content;
- both had no horizontal overflow at any required mobile or zoom state;
- both preserved mixed-script content;
- both preserved content under fallback;
- neither produced invisible text during font load;
- no production-bundle leakage;
- no missing-glyph or content-loss failure.

Measured font-swap reflow (fallback → web font, long-form bodies, desktop):

| Treatment | Mean article-height reflow | Maximum |
|---|---|---|
| Inter-only | 116 px | 186 px |
| Bounded Newsreader | 160 px | 217 px |

Clarifications: both web fonts already exist in the shipped transitional baseline, so the prototype
introduced **no new dependency or network request**; bounded Newsreader still showed **44 px greater
mean** and **31 px greater maximum** reflow; no interactive control sat below the article body, but the
reading position could still move during delayed font loading; this was a robustness penalty, **not**
the sole reason for the decision.

### Decision-rule application

Pre-registered serif-win requirements: (1) beat Inter-only by ≥ 5 points overall; (2) lead sustained
reading comfort by ≥ 1 rating point; (3) not score lower on product-voice coherence; (4) not score
lower on cross-content/script robustness; (5) introduce no material loading/fallback penalty.

Result: overall score **tied 90–90**; Newsreader **led comfort by one point** (req. 2 met); Newsreader
scored **one point lower on product-voice coherence** (req. 3 failed); Newsreader scored **one point
lower on cross-content/script robustness** (req. 4 failed); Newsreader had the **greater loading/reflow
penalty** (req. 5 weakened); and the overall **tie defaults to Inter-only** (req. 1 failed). The bounded
Newsreader exception therefore **does not qualify**.

### Final disposition

- Inter remains the **sole accepted Film File reading voice**;
- long-form Film File prose **remains Inter**;
- **no Newsreader long-form exception is accepted**;
- **ADR 014 remains sufficient and unchanged**;
- **no new ADR is created**;
- **no production migration is authorized**;
- existing transitional Newsreader usage remains unchanged until separately migrated.
