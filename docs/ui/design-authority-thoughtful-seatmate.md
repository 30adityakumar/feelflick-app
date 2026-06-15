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
surface. It does not encode final font choices, exact color tokens, navigation
structure, or couple-mode mechanics — those are prototype questions (§19).

This document deliberately does **not** use "approved and fully migrating"
language. The foundation principles below are accepted; the exact typeface, token
values, warm-cue hue, gradient survival, and serif exception remain open and must
be validated before they become doctrine.

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
- one rare warm signal for meaningful selection or commitment
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
- **Active prototype question:** exact warm-neutral / graphite token values; exact
  ivory value. Treat any specific hex as illustrative, not locked.
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
- **Active prototype question:** contextual-film-color **strength** and the exact
  **normalization thresholds**. These are unresolved and must be tuned with
  representative posters and moods.

---

## 13. Primary-action and decision-signal philosophy

- **Accepted principle:** on dark core surfaces the **default primary commitment
  action uses a solid light-neutral fill with dark warm text** — calm and legible.
  It must not depend on contextual film color, the legacy gradient, or a permanent
  rose accent. Exact ivory and graphite token values remain provisional. Alternate
  polarity is permitted only when the surrounding surface or accessibility
  requirements justify it.
- **Accepted principle:** **one rare warm signal** may mark a meaningful selection
  or commitment. It is an accent of emphasis, used sparingly — not the dominant
  surface color and not on every control.
- **Active prototype question:** the exact **warm decision-signal hue**, and
  whether selected states are **ivory-only** or **ivory-plus-a-warm-cue**.
- **Retired as target:** rose as the default primary CTA color.

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
| Foundation | warm near-black canvas + ivory/bone text | warm graphite / warm-neutral + projection-ivory | exact values are an active prototype question |
| Type voice | Newsreader + Inter + Outfit, mixed across surfaces | **Inter** — single core Latin sans-serif (one coherent voice) | accepted (ADR 014); Newsreader/Outfit consolidation is later, gated surface work |
| Brand color | rose `#DD4E83` accent + legacy purple/pink tokens | warm-neutral identity; one rare warm signal | warm-signal hue is an active prototype question |
| Primary action | neutral solid fill on `/home`; gradient/rose elsewhere | solid light-neutral fill + dark warm text on dark surfaces | accepted principle; not yet migrated |
| Recommendation case | numbered I/II case shipped on `/home` | natural progressive explanation; no required numbering | accepted principle; reversal is later code work |
| Gradient | retired as CTA on `/home`; legacy elsewhere | barred from default action/selected-state/chrome/atmosphere; any narrow role unresolved | active prototype question |
| Identity framing | "Midnight Film Journal / trusted curator" | Compounding Decision Companion / Thoughtful Seatmate | accepted |

**Do not claim the Thoughtful Seatmate direction is implemented.** It is not. The
table's left column is what ships today.

---

## 19. Explicitly provisional decisions

These are **active prototype questions**. None is finalized here:

- exact warm-neutral or graphite token values
- exact ivory value
- exact warm decision-signal hue
- ivory-only versus ivory-plus-warm-cue selected states
- contextual-film-color strength
- contextual-color normalization thresholds
- whether the legacy gradient ultimately survives
- whether a serif has any role in genuinely long-form Film File reading
- exact bottom-navigation structure
- exact couple-mode interaction

**Resolved (moved to accepted):** the single core sans-serif voice is **Inter**,
per [ADR 014](../decisions/014-thoughtful-seatmate-p1-core-voice.md) (P1 — Core
Voice). The long-form Film File serif exception above remains open.

Do not convert any of these into doctrine without the validation in §20.

---

## 20. Prototype and validation requirements

Before any provisional decision (§19) becomes an accepted principle:

1. Prototype it on **representative surfaces**: landing hero, primary
   recommendation (Tonight), Film File explanation, a dense authenticated
   interface, and the mobile recommendation flow.
2. **Compare alternatives directly** (e.g. warm-neutral value candidates;
   ivory-only vs ivory-plus-warm-cue; a narrowly-bounded long-form Film File serif
   test). The core sans-serif voice was decided this way in P1 (see ADR 014).
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
