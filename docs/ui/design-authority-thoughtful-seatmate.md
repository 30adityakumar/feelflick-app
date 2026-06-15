# FeelFlick — Design Authority: The Thoughtful Seatmate Direction

> **This is the active design-authority document for FeelFlick.** It supersedes
> [`design-authority-f3.md`](design-authority-f3.md) as the *target* for new
> design and migration work. Detailed, durable visual implementation rules live in
> [`.claude/rules/design-system.md`](../../.claude/rules/design-system.md); product
> doctrine lives in [`product-doctrine.md`](../product-doctrine.md).
>
> When this document and [`.claude/rules/design-system.md`](../../.claude/rules/design-system.md)
> appear to conflict, this document governs design direction and status;
> `design-system.md` governs durable implementation rules. Update both together when
> an accepted design principle changes.

---

## 1. Status and scope

**Status:** Accepted at the **principle level**. The replacement *specifics* are
under **active prototype validation**. **Not yet implemented.**

This document governs the visual and interaction *direction* for every FeelFlick
surface. The core voice (Inter, [ADR 014](../decisions/014-thoughtful-seatmate-p1-core-voice.md))
and the exact foundation token values (warm graphite / projection-ivory,
[ADR 015](../decisions/015-thoughtful-seatmate-p2a-foundation.md)) are now accepted —
the foundation values as prototype / pilot-scoped, **not yet** global production
tokens. The contextual-color treatment is now accepted in full — the **normalization
envelope** (strict, [ADR 017](../decisions/017-thoughtful-seatmate-p2c-a-contextual-color-envelope.md))
and the **aura strength** (alpha 0.14, [ADR 018](../decisions/018-thoughtful-seatmate-p2c-b-aura-strength.md));
navigation structure, couple-mode mechanics, the contextual-color **extraction** method,
gradient survival, and the long-form serif exception remain prototype questions (§19).

This document deliberately does **not** use "approved and fully migrating"
language. The foundation principles below are accepted, and the core voice (ADR 014)
and the foundation token values (ADR 015) are fixed for prototypes and scoped pilots,
and the decision signal is ivory-only (ADR 016, no warm-cue token), and the
contextual-color treatment is accepted in full (strict normalization envelope, ADR 017;
aura strength alpha 0.14, ADR 018); the contextual-color **extraction** method, gradient
survival, and the serif exception remain open and must be validated before they become
doctrine or global production tokens.

### Status legend

Every statement in FeelFlick design guidance should be readable as one of:

- **Accepted principle** — a settled direction; build toward it.
- **Current production baseline** — what the shipped app does today (may be a
  transitional state, not the target).
- **Active prototype question** — genuinely unresolved; must be validated by
  rendered prototypes before it becomes an accepted principle.
- **Historical decision** — a superseded record kept for context only.

---

## 2. Relationship to the previous F3/F4 authority

[`design-authority-f3.md`](design-authority-f3.md) is now a **historical
decision** record. It documents the F3/F4 "Design Authority Lock" — the Midnight
Film Journal + Cinematic Concierge direction (Newsreader editorial voice, rose
`#DD4E83` accent, numbered I/II recommendation case). It was introduced on `/home`
in F1–F2, and F4 then expanded the Newsreader/Inter/rose typography and palette
across many feature surfaces.

That implementation is a **current production baseline** — a *transitional* state,
not the target. It remains in production and **must not be removed or rewritten in
this documentation phase**.

This document **supersedes** F3/F4 as the *target* direction. The F3/F4 migration
order is **no longer active**: do not migrate new surfaces to Newsreader / rose /
numbered-case.

**What carries over from F3/F4 (accepted principles, unchanged):**

- warm, near-black cinematic neutrals as the foundation
- high-contrast ivory/bone text
- poster treated as a cinematic/editorial object, not a flat grid thumbnail
- hairline rules over generic glass/gradient cards
- reduced decorative chrome
- the purple→pink gradient retired as a primary CTA
- the honesty layer (no fabricated reasons, no claimed mood)
- a dignified "Not tonight"
- one visible Tonight recommendation

**What this document reverses from F3/F4 (now retired as the target):**

- a permanent serif-versus-system personality split ("Newsreader is the curator")
- Newsreader as the default recommendation-title and rationale voice
- rose as the permanent brand signature and primary-action color
- a numbered roman-numeral recommendation case as a universal requirement
- "contemporary film journal" / "trusted curator" as the defining identity framing

---

## 3. Product model: Compounding Decision Companion

FeelFlick is a **Compounding Decision Companion**.

> Help someone choose one film that fits the present moment, explain why it fits,
> and become meaningfully better through watches, skips, saves, ratings, and
> corrections.

- **Tonight** provides the immediate value.
- **Tonight** presents one visible primary recommendation by default.
- A rejection normally produces **one sequential replacement**, not visible backup
  cards.
- **Film File** supplies evidence and deeper trust.
- **History / Diary** creates taste memory.
- **Cinematic DNA** makes the product's learning visible.
- **Discover** supports intentional exploration.
- **Search** supports known intent.
- **Watchlist** preserves deferred intent.
- A future **couple or group mode** may use a bounded shortlist or negotiation
  flow; its exact mechanics remain **provisional** (§19).
- **Taste memory** is the long-term strategic moat beneath the immediate decision
  experience.

This is the design-authority restatement of the product model. The canonical
product doctrine is [`product-doctrine.md`](../product-doctrine.md), operationalized
by [`.claude/rules/product.md`](../../.claude/rules/product.md).

---

## 4. Product character: the Thoughtful Seatmate

The product behaves like a thoughtful seatmate — the person beside you who knows
film, reads the room, and hands you the right one:

- serious taste without arrogance
- empathy without indecision
- evidence without dryness
- curiosity without insecurity
- speed without apathy
- craft without aloofness

---

## 5. Design north star: smart but tired

**Design for someone smart but tired.** They have taste and limited energy; the
product should do the reasoning and hand over a decision worth trusting.

The experience should feel:

- calm at first glance
- intelligent on closer inspection
- deep only when invited
- confident without false certainty
- personal without intrusion
- polished without aloofness
- film-literate without elitism

---

## 6. Surface roles

| Surface | Role |
|---|---|
| **Tonight** (`/home`) | The immediate value: one visible primary recommendation with the reason it fits. |
| **Film File** (`/movie/:id`) | Evidence and deeper trust — the case-making and detail layer. |
| **History / Diary** (`/history`) | Taste-memory substrate; learning infrastructure, not a social feed front door. |
| **Cinematic DNA / Profile** (`/profile`) | The visible payoff of accumulated learning. |
| **Discover** (`/discover`) | Intentional exploration; complementary to Tonight, never a competing recommender. |
| **Search** | Known-intent retrieval. |
| **Watchlist** | Deferred intent. |
| **Couple / group mode** (future) | A bounded shortlist or negotiation flow — **provisional**, mechanics unresolved. |

Tonight defaults to one visible recommendation. Bounded choice is appropriate
only for explicit exploration or group-negotiation modes, never as the default
Tonight recovery model.

---

## 7. Accepted product and visual principles

**Accepted principles** (build toward these):

- warm graphite / warm-neutral foundation
- projection-ivory or equivalent high-contrast neutral text
- one coherent human sans-serif voice across the core product
- film imagery and normalized contextual film color supplying emotional specificity
- ivory-only confirmation for meaningful selection or commitment — a supplementary
  projection-ivory marker with redundant non-color signals; no separate warm cue (ADR 016)
- a neutral, high-contrast primary action
- progressive recommendation depth
- brief, purposeful, nonblocking motion
- legacy purple–pink–amber gradient kept out of default actions, selected states,
  application chrome, generic AI/premium signaling, and permanent atmosphere (any
  narrow reveal/memory/campaign/sharing/celebration role remains an unresolved
  prototype question)
- no default visible backup recommendations on Tonight
- no permanent serif-versus-system personality split
- no permanent rose/plum foundation as the core identity
- no roman-numeral case structure as a universal requirement

---

## 8. Recommendation presentation model

- **One visible primary recommendation by default** on Tonight.
- **Sequential replacement:** a "Not tonight" / reject produces the next single
  pick. The prior pick steps aside; no stack of visible backup cards appears by
  default.
- **The explanation is present and truthful.** Never fabricate user-specific
  recommendation evidence. When a user-specific engine reason is unavailable, do not
  invent one — but the recommendation may still carry a clearly non-personal
  rationale grounded in the film's qualities, an explicit session constraint, a
  documented quality signal, or honest cold-start language. Do not present broad or
  editorial reasoning as though it came from the user's history, and do not let the
  pick read as unexplained certainty merely because mature personalization evidence
  is unavailable.
- **Mood claims require explicit input.** Do not infer or claim the user's current
  mood unless they explicitly selected or described it this session. An auto-selected
  baseline mood is an internal ranking signal and must not be presented as a fact
  about the user. When the user explicitly provided a mood or viewing intent, the
  interface may reflect it accurately, concisely, and non-clinically.
- **No universal numbered structure.** The explanation should read as natural
  progressive depth, not a mandatory roman-numeral case. A numbered structure may
  be *one* legitimate presentation when multiple truthful rungs genuinely exist,
  but it is not required and is not the identity of the recommendation.
- **Skip is dignified.** Rejecting is a useful signal, not a failure.

---

## 9. Progressive explanation depth

Depth arrives only when invited:

1. **Glance** — the pick and a short, true reason it fits the moment.
2. **Reason** — the fuller "why this one," in plain language.
3. **Evidence** — the Film File: signals, context, and the case for trust.
4. **Memory** — over time, History/Diary and Cinematic DNA show the accumulated
   learning that shaped the pick.

Calm at first glance; intelligent on closer inspection; deep only when invited.
Do not relegate the reason to a tiny tinted chip, and do not force full evidence
into the first glance.

---

## 10. Typography direction

- **Accepted principle:** one coherent **human sans-serif** voice across the core
  product, and that voice is **Inter** — FeelFlick's single core Latin sans-serif.
  Interface and editorial text share this family; hierarchy comes from scale,
  weight, measure, spacing, and composition — not from a separate serif personality.
- **Accepted (P1 — Core Voice, 2026-06-14):** Inter was retained after a controlled
  blind comparison against Instrument Sans. Instrument Sans did not show sufficient
  whole-system benefit to justify migration, and a near-tie favours the
  already-integrated font. See
  [ADR 014](../decisions/014-thoughtful-seatmate-p1-core-voice.md) and the
  [evidence packet](thoughtful-seatmate-p1-core-voice-evaluation.md). ("Latin" is
  intentional — non-Latin fallback coverage was not tested.)
- **Retired as target:** the permanent "Inter is the system; Newsreader is the
  curator" serif-versus-system split, and Newsreader as the default
  recommendation-title and rationale voice.
- **Active prototype question (still open):** whether a serif has **any** role in
  genuinely **long-form Film File reading**. This is a narrowly-bounded exception to
  test, not a default; it must not reinstate a system/editorial split.
- **Restraint, not a locked scale:** keep type restrained and legible across
  narrow screens, long titles, localization, and zoom. Do not lock one exact scale,
  weight, or tracking value across every future surface.
- **Current production baseline (mixed):** Newsreader, Inter, and Outfit are all
  loaded; F4 shipped Newsreader/Inter typography across many feature surfaces, while
  residual global, shared, and legacy areas still use Outfit. This is transitional —
  Inter-only consolidation is later, gated surface work; do not extend the serif
  split to new surfaces.

---

## 11. Color architecture

- **Accepted principle:** a **warm graphite / warm-neutral** foundation carries
  most backgrounds, surfaces, text, borders, and chrome, framing film artwork
  rather than competing with it. Text is **projection-ivory** (or an equivalent
  high-contrast warm neutral).
- **Retired as target:** rose as the permanent brand signature; plum as the normal
  supporting atmosphere; any permanent rose/plum core identity.
- **Accepted (P2A — Foundation Neutrals, 2026-06-14):** the exact warm graphite
  foundation values and the projection-ivory hierarchy — with the related surface,
  border, and neutral-action roles — are now fixed, per
  [ADR 015](../decisions/015-thoughtful-seatmate-p2a-foundation.md). The P1-control
  warm graphite system won a controlled blind comparison against a warmer and a more
  neutral graphite (the warmer imposed too much atmosphere; the neutral read
  neutral-to-cool rather than unmistakably warm). These are **accepted prototype /
  pilot-scoped values**: they must be used **unchanged** in P2B and as scoped/local
  values in the Tonight and Film File pilots. They are **not yet global production
  tokens**, and shared-token promotion remains gated by pilot validation (§21, gate 5).

  ```css
  --canvas: #15120f;
  --surface-1: #1d1814;
  --surface-2: #241e19;
  --surface-raised: #2d2621;

  --text-primary: #f3ecdf;        /* projection ivory */
  --text-secondary: #beb8ad;
  --text-muted: #8d887f;

  --border-subtle: #302c28;
  --border-strong: #46423d;

  --neutral-action-fill: #efe7d7;
  --neutral-action-text: #221b13;
  --neutral-focus: #f3ecdf;
  ```
- **Semantic colors remain load-bearing.** Amber (rating/caution), red
  (destructive/error), and green (success/watched/public) are functional, not
  brand, and must not be folded into the brand palette. See
  [`design-system-hardening-f3.md`](../design-system-hardening-f3.md) for the
  semantic-accent rationale.
- **Current production baseline (mixed):** F4 shipped the rose `#DD4E83` (with
  `ROSE_DEEP`) palette treatment across many feature surfaces, while residual
  global, shared, and legacy areas still contain purple/pink tokens and gradient
  treatments. Transitional.

---

## 12. Contextual film color

- **Accepted principle:** mood- or poster-derived color makes recommendation and
  Film File surfaces emotionally specific.
- It must be **normalized** into system roles (luminance, minimum contrast,
  maximum chroma, surface role, light/dark compatibility, fallback). Never inject a
  raw extracted poster color into UI text or controls. Limit the number of
  simultaneously active contextual colors.
- **Accepted (P2C-A — Contextual-Color Envelope, 2026-06-15):** the **normalization
  envelope** is fixed, per
  [ADR 017](../decisions/017-thoughtful-seatmate-p2c-a-contextual-color-envelope.md).
  The accepted envelope, validated by a controlled blind comparison of an off control
  against three increasing chroma caps (off → 0.04 → 0.07 → 0.10), is the **strict**
  envelope — the lowest tested non-zero cap:
  - one deterministic source hue; **preserve source hue** (never rotate);
  - **output lightness L = 0.62**;
  - **retained chroma cap C = 0.04**;
  - **suppress** missing/invalid source;
  - **suppress** effectively achromatic source where **source C < 0.04**;
  - **semantic danger distance < 0.05** → **reduce chroma only, never rotate hue**;
  - **suppress** if the safety reduction falls below the low-saturation threshold;
  - **deterministic gamut mapping** by chroma reduction;
  - **single focal-film scope** (Tonight hero, Film File hero, their mobile
    equivalents, the active replacement film after "Not tonight");
  - **no color on controls, text, marker, focus, semantics, or chrome.**

  The balanced envelope (0.07) was what independently cleared the pre-registered
  ≥5-point bar over the off control; the pre-registered lower-envelope tie-break then
  carried the accepted cap down to strict (the two were within one point and the higher
  carried a hierarchy/restraint penalty). This is not a blend. **P2C-A does not
  authorize a production aura** — it authorizes only the normalization **envelope** for
  P2C-B and scoped pilot evaluation.
- **Accepted (P2C-B — Aura Strength, 2026-06-15):** the aura **compositing strength** is
  fixed at **alpha 0.14**, per
  [ADR 018](../decisions/018-thoughtful-seatmate-p2c-b-aura-strength.md). A controlled
  blind comparison held the strict envelope fixed and varied only the compositing alpha
  across an off control and three non-zero strengths (0 → 0.07 → 0.14 → 0.21). The
  **reference strength (alpha 0.14) independently cleared** the pre-registered ≥5-point
  bar over off; **alpha 0.07 did not clear it** and **alpha 0.21 scored below off**
  (weakened hierarchy and product consistency). Because exactly one non-off treatment
  qualified, **no lower-strength tie-break was needed** and **no blending or interpolation
  occurred**. The **complete accepted contextual-color treatment** is therefore: preserve
  source hue, output **L = 0.62**, retained chroma cap **C = 0.04**, **compositing alpha
  0.14**, single focal-film scope, under the fixed suppression/semantic-safety/gamut
  rules. **No production aura is authorized**; no global contextual-color token is created.
- **Active prototype question (still open):** the **extraction algorithm and
  seed-generation method** (P2C-A and P2C-B both used manually assigned deterministic
  seeds only to isolate the variable under test; **no extraction method is accepted**, and
  manual deterministic seeds are **not** an accepted production extraction method). This
  must be resolved with representative posters before any production aura.

---

## 13. Primary-action and decision-signal philosophy

- **Accepted principle:** on dark core surfaces the **default primary commitment
  action uses a solid light-neutral fill with dark warm text** — calm and legible.
  It must not depend on contextual film color, the legacy gradient, or a permanent
  rose accent. The exact ivory and graphite foundation token values are now
  **accepted** (warm graphite / projection-ivory,
  [ADR 015](../decisions/015-thoughtful-seatmate-p2a-foundation.md), prototype /
  pilot-scoped — see §11). Alternate polarity is permitted only when the surrounding
  surface or accessibility requirements justify it.
- **Accepted (P2B — Decision Signal, 2026-06-15):** meaningful **selected and
  committed states remain ivory-only**. The decision signal is a small supplementary
  confirmation marker in **projection ivory `#f3ecdf`** (the existing ADR 015 value),
  restricted to meaningful selection/commitment and always paired with redundant
  **non-color** signals (semantic state such as `aria-pressed`/`role=status`, a changed
  label, a check/bookmark icon, a neutral selected fill or border, status text, stable
  position). **No separate permanent warm decision-signal hue and no new color token**
  are introduced; the marker is never the sole state indicator. It is **not** a CTA
  color, brand accent, focus, navigation, semantic, or aura color. See
  [ADR 016](../decisions/016-thoughtful-seatmate-p2b-decision-signal.md). Cue scope and
  the marker architecture are in §13a below.
- **Retired as target:** rose as the default primary CTA color; and a separate warm
  decision-signal hue — P2B rejected every warm candidate (each trailed the ivory
  control by ≥15 weighted points and sat perceptually near red/amber).

### 13a. Decision-signal marker and cue scope (accepted, P2B)

**Marker architecture (accepted prototype/pilot pattern):** a 7px circular marker in
a permanently reserved 14px slot; no glow, blur, gradient, shadow, pulse, or ambient
animation; zero layout shift; reduced-motion safe; colour = projection ivory
`#f3ecdf`. The marker is supplementary and **never the sole state indicator** — every
selected/committed state also uses redundant non-color communication.

**Permitted cue scope** (meaningful selection/commitment only): (1) an explicitly
selected session intent; (2) a recommendation explicitly chosen for tonight; (3) a
confirmed watchlist save; (4) one current/present-tense active pick reflected in
memory. Normal composition shows no more than one marker in the primary decision
area; two may appear only when two legitimate commitments coexist (chosen + saved) —
a density boundary, not a decorative pattern.

**Forbidden cue scope:** default primary CTA, hover, focus, general navigation, tabs,
routine filters, every chip, loading, disabled, errors, destructive actions, ratings,
caution, success/watched semantics, availability, confidence, recommendation
headings, wordmark/logo, AI signalling, premium signalling, page atmosphere, poster
aura, decorative separators. The marker is not a general brand accent.

**Token discipline:** do not create a new global `--decision-signal` color token that
merely aliases `#f3ecdf`. Scoped pilots may use a **local semantic alias** that
references the ADR 015 projection-ivory role; the source of colour truth remains
ADR 015. Pilot implementation stays scoped/local — no global token migration is
authorized.

---

## 14. Legacy-gradient status

- **Current production baseline:** the legacy purple→pink gradient and purple/pink
  tokens remain on unmigrated surfaces; `/home` already replaced the gradient CTA
  with a neutral primary.
- **Accepted restriction:** the legacy purple–pink–amber gradient must **not**
  function as the default primary action, a routine selected state, application
  chrome, a generic AI/premium signal, or permanent atmosphere.
- **Active prototype question:** whether it retains any **narrow** role — a rare
  reveal, memory, campaign, sharing, or celebration moment — is **unresolved**, as is
  whether it survives at all. Do **not** create new production uses of the gradient
  until such a role has been validated; a possible future use is not an approved
  production treatment.

---

## 15. Film imagery

Posters, backdrops, and stills are primary visual material; the interface supports
their emotional specificity rather than overpowering it.

- preserve recognizable poster crops; avoid covering key faces/titles
- keep text readable over imagery; use focal points where available
- reserve aspect ratio to prevent layout shift; lazy-load below the fold
- handle missing, broken, and low-quality sources with useful fallbacks
- avoid overlays that flatten every film into the same mood
- test bright and dark artwork, extreme ratios, and long titles

---

## 16. Motion philosophy — "house lights down"

Motion is brief, purposeful, and nonblocking — like the house lights dimming
before a film: it sets attention, it does not perform.

- motion communicates response, selection, continuity, or meaningful transition —
  never decoration or technical capability
- keep interaction response immediate; no long entrance sequences before the user
  can act
- avoid ambient parallax, looping shimmer, and hover glow on every card
- **reduced motion is mandatory** — provide a stable, instant experience under
  `prefers-reduced-motion`; no affordance may depend on motion

---

## 17. Accessibility and performance expectations

**Accessibility** is part of design quality: text and non-text contrast, visible
focus, non-color state communication, readable measure, zoom/reflow, touch-target
size, keyboard navigation, screen-reader structure, image alternatives, and clear
disabled/error/loading states. Do not rely on nominal contrast math when thin
weights, translucency, glow, blur, or imagery reduce practical readability.

**Performance** must stay compatible with a media-heavy app: watch font requests,
image loading and decoding, responsive sources, animation/blur cost, route bundle
growth, layout shift, client-side color extraction, and low-end mobile behavior.
Prefer CSS and native browser capability over heavy libraries for small effects.

---

## 18. Current production baseline versus target direction

| Dimension | Current production baseline (F3/F4, transitional) | Accepted target direction | Status of the gap |
|---|---|---|---|
| Foundation | warm near-black canvas + ivory/bone text | ADR 015 warm graphite / projection-ivory system (exact values) | accepted for prototype and scoped pilots; production migration gated |
| Type voice | Newsreader + Inter + Outfit, mixed across surfaces | **Inter** — single core Latin sans-serif (one coherent voice) | accepted (ADR 014); Newsreader/Outfit consolidation is later, gated surface work |
| Brand color | rose `#DD4E83` accent + legacy purple/pink tokens | warm-neutral identity; no separate warm cue | accepted (ADR 016): ivory-only decision signal, no warm-cue token |
| Primary action | neutral solid fill on `/home`; gradient/rose elsewhere | solid light-neutral fill + dark warm text on dark surfaces | accepted principle; not yet migrated |
| Decision signal (selected/committed) | ivory-only selected states on `/home`; no distinct marker | restrained projection-ivory marker (`#f3ecdf`) + redundant non-color signals; no separate warm cue | accepted for prototype and scoped pilots (ADR 016); production migration gated |
| Recommendation case | numbered I/II case shipped on `/home` | natural progressive explanation; no required numbering | accepted principle; reversal is later code work |
| Gradient | retired as CTA on `/home`; legacy elsewhere | barred from default action/selected-state/chrome/atmosphere; any narrow role unresolved | active prototype question |
| Identity framing | "Midnight Film Journal / trusted curator" | Compounding Decision Companion / Thoughtful Seatmate | accepted |

**Do not claim the Thoughtful Seatmate direction is implemented.** It is not. The
table's left column is what ships today.

---

## 19. Explicitly provisional decisions

These are **active prototype questions**. None is finalized here:

- the contextual-color **extraction algorithm and seed-generation method** (P2C-A and
  P2C-B both used manually assigned deterministic seeds only to isolate the variable
  under test; manual deterministic seeds are **not** an accepted production extraction
  method)
- whether the legacy gradient ultimately survives
- whether a serif has any role in genuinely long-form Film File reading
- exact bottom-navigation structure
- exact couple-mode interaction

**Resolved (moved to accepted):**

- the single core sans-serif voice is **Inter**, per
  [ADR 014](../decisions/014-thoughtful-seatmate-p1-core-voice.md) (P1 — Core Voice);
- the exact **warm graphite foundation values** and the **projection-ivory
  hierarchy** (the twelve foundation roles), per
  [ADR 015](../decisions/015-thoughtful-seatmate-p2a-foundation.md) (P2A — Foundation
  Neutrals) — accepted as prototype / pilot-scoped values (see §11), not yet global
  production tokens;
- the **decision signal**: meaningful selected/committed states are **ivory-only**
  (projection ivory `#f3ecdf`, supplementary marker + redundant non-color signals);
  **no separate warm decision-signal hue and no new color token**, per
  [ADR 016](../decisions/016-thoughtful-seatmate-p2b-decision-signal.md) (P2B —
  Decision Signal). This resolves both the *exact warm decision-signal hue* and the
  *ivory-only vs ivory-plus-warm-cue* questions (see §13 / §13a);
- the contextual-color **normalization envelope**: the **strict** envelope — preserve
  source hue, output lightness **L = 0.62**, retained chroma cap **C = 0.04**, under the
  fixed low-saturation, semantic-safety, and gamut rules, single focal-film scope — per
  [ADR 017](../decisions/017-thoughtful-seatmate-p2c-a-contextual-color-envelope.md)
  (P2C-A — Contextual-Color Envelope). This resolves the *normalization thresholds*
  question only (see §12);
- the contextual-color **aura strength**: **compositing alpha 0.14**, applied only to the
  strict envelope on a single focal-film surface — the reference strength independently
  cleared the pre-registered ≥5-point bar over off, while alpha 0.07 did not and alpha
  0.21 scored below off; no tie-break was needed and no strengths were blended — per
  [ADR 018](../decisions/018-thoughtful-seatmate-p2c-b-aura-strength.md) (P2C-B — Aura
  Strength). The **complete accepted contextual-color treatment** is now hue preserved,
  L = 0.62, C = 0.04, alpha 0.14, focal-film scope; contextual-color **extraction** remains
  open above, and **no production aura is authorized**.

The long-form Film File serif exception above remains open.

Do not convert any of these into doctrine without the validation in §20.

---

## 20. Prototype and validation requirements

Before any provisional decision (§19) becomes an accepted principle:

1. Prototype it on **representative surfaces**: landing hero, primary
   recommendation (Tonight), Film File explanation, a dense authenticated
   interface, and the mobile recommendation flow.
2. **Compare alternatives directly** (e.g. contextual-color strength candidates; a
   narrowly-bounded long-form Film File serif test). The core sans-serif voice was
   decided this way in P1 (ADR 014); the foundation in P2A (ADR 015); and the
   decision signal in P2B (ADR 016 — ivory-only vs three warm hues, ivory won).
3. Use **realistic fixtures**: short and long titles, missing/bright/dark posters,
   multiple languages, long explanations, sparse and mature histories, and
   loading/error states.
4. Capture **rendered desktop and mobile** comparisons; run at least one critique
   and refinement pass; subject the result to adversarial review.
5. Record the outcome in a **decision record** before promoting it from prototype
   question to accepted principle.

The isolated Design Lab (`src/features/design-lab/`) is the home for these
comparisons. Keep it isolated; it is not production UI.

---

## 21. Migration gates

Migration proceeds through these gates, in order:

1. **Doctrine accepted** — this document (principle level). ✅ done.
2. **Isolated prototypes resolve the provisional questions** (§19) with rendered
   desktop/mobile evidence. *Open.*
3. **A decision record approves** the chosen prototype direction.
4. **Pilot** the accepted direction on **two representative production surfaces**
   using **scoped/local values** rather than prematurely globalizing tokens.
   Tonight (`/home`) and Film File (`/movie/:id`) are the recommended pilots unless
   a later decision record chooses equivalent surfaces.
5. **After both pilot surfaces validate** the values and the interaction pattern,
   **promote** the values into shared tokens and primitives.
6. **Migrate the remaining surfaces** systematically, with deliberate
   visual-regression re-baselining.

Constraints across all gates:

- **Pilot production work is allowed** once the relevant prototype question (gate 2)
  and the decision record (gate 3) are complete; it uses scoped/local values, not
  globalized tokens.
- **Shared tokens and broad shared-component changes must not precede pilot
  validation** (gate 5) — they depend on the pilots, never the reverse, so they
  cannot block pilot production work in gate 4.
- Do **not** migrate a surface to the Thoughtful Seatmate direction before its
  prototype question is resolved; pilots come first, then systematic migration.
- The current F3/F4 implementation stays **untouched** until a surface enters its
  deliberate pilot or migration scope.
- Do **not** change the recommendation engine, scoring, or data contracts as part
  of a visual migration.
- Honor the deferred scope already noted in F3/F4 (AppShell header, global
  `:focus-visible` ring) — those need dedicated global passes.

---

## 22. Non-goals

This document is **not**:

- a claim that the Thoughtful Seatmate direction is implemented — it is not
- a license to remove or rewrite the shipped F3/F4 implementation in this phase
- a place to finalize provisional font, token, navigation, or couple-mode decisions
- a product-strategy rewrite — product authority is
  [`product-doctrine.md`](../product-doctrine.md) and
  [`.claude/rules/product.md`](../../.claude/rules/product.md)

The direction explicitly rejects:

- a Netflix-style grid/rail as the primary surface
- a Letterboxd/TMDB database or social-feed feel as the front door
- visible backup recommendations as the default Tonight recovery
- completionist/engagement-maximizing mechanics
- fabricated personalization, reasons, mood claims, or social proof

---

## Related documents

- [`CLAUDE.md`](../../CLAUDE.md) — root operating guide (routes here for design authority)
- [`.claude/rules/design-system.md`](../../.claude/rules/design-system.md) — durable visual implementation rules
- [`.claude/rules/ui-implementation.md`](../../.claude/rules/ui-implementation.md) — interaction, accessibility, and state behavior
- [`product-doctrine.md`](../product-doctrine.md) — canonical product doctrine
- [`design-authority-f3.md`](design-authority-f3.md) — **historical**: the shipped F3/F4 baseline this direction supersedes
- [`design-system-hardening-f3.md`](../design-system-hardening-f3.md) — **historical**: F3 token-hardening + semantic-accent rationale
