---
paths:
  - "src/**/*.jsx"
  - "src/**/*.css"
  - "src/styles/**"
  - "src/shared/lib/tokens.js"
  - "tailwind.config.*"
  - "index.html"
  - "public/**/*.{svg,png,jpg,jpeg,webp,avif}"
---

# FeelFlick design-system direction

## Purpose

This file guides visual design, branding, interaction, typography, color, layout, motion, and shared-component decisions.

Its purpose is to create a coherent and distinctive product while allowing the system to improve.

The design system should prevent accidental inconsistency.

It should not prevent intentional evolution.

## Product expression

FeelFlick should feel like:

> A thoughtful seatmate with serious film taste — calm at first glance, intelligent on closer inspection, deep only when invited.

Design for someone **smart but tired**: do the reasoning, hand over one decision worth trusting, and let depth arrive only when asked. The product is a **Compounding Decision Companion**; the full direction, surface roles, and rationale live in [`docs/ui/design-authority-thoughtful-seatmate.md`](../../docs/ui/design-authority-thoughtful-seatmate.md).

The visual experience should support:

* emotional intelligence
* editorial confidence
* recommendation trust
* cinematic atmosphere
* clarity and usability
* meaningful personalisation
* respect for film imagery

FeelFlick should not feel like:

* a generic AI product built around violet glow
* a productivity tool with movie posters added
* a streaming catalog dominated by grids
* a component-library showcase
* a luxury editorial concept that sacrifices usability
* a social feed designed primarily for engagement

These descriptions are directional criteria, not instructions to imitate a particular reference website.

## Design influences

Use references for design principles rather than direct imitation.

Relevant disciplines include:

* **Linear** — precision, hierarchy, controlled density, subtle interaction
* **Stripe** — trust, structure, atmospheric depth, clear evidence
* **Framer** — composition, whitespace, visual proof, confident typography
* **Pitch** — presentation, sequencing, storytelling through motion
* **Superlist** — warmth, tactility, approachable consumer interaction
* **MUBI** — curation, film-first restraint, editorial context
* **Criterion** — cinema as culture, authority, thoughtful framing
* **Letterboxd** — personal film identity, history, community language

Do not combine every visible signature from every reference.

Choose principles that serve the specific user problem and surface.

## System status

Read every statement in this rule as one of four states:

* **accepted principle** — settled; build toward it
* **current production baseline** — what ships today (may be transitional, not the target)
* **active prototype question** — unresolved; validate with rendered prototypes before it becomes doctrine
* **historical decision** — superseded record, kept for context

### Current production baseline (transitional)

The shipped app is **mixed and transitional**:

* The F3/F4 direction was introduced on `/home` (F1–F2): warm dark neutrals, ivory/bone text, hairline rules, Newsreader editorial voice, rose (`#DD4E83`) accent, numbered I/II recommendation case, and a neutral `/home` primary.
* F4 then expanded the Newsreader/Inter/rose typography and palette treatment across **many feature surfaces**.
* Residual **global, shared, and legacy** areas still contain Outfit, purple/pink styling, gradient treatments, and other pre-target styling.

Neither F3/F4 nor the Thoughtful Seatmate direction is uniformly implemented everywhere. This is a **transitional baseline**, valid for maintenance work. It is **not** the target. Do not claim either direction is fully implemented, and do not remove the shipped F3/F4 work outside a deliberate, gated re-migration.

### Accepted target direction (principle level)

The target is the **Thoughtful Seatmate** direction — design for someone smart but tired:

* warm graphite / warm-neutral foundation — frames film artwork rather than competing with it
* projection-ivory (or equivalent high-contrast warm neutral) text
* **one coherent human sans-serif voice** across the core product (no permanent serif-versus-system split)
* normalized contextual film color for emotional specificity
* a **neutral, high-contrast primary action**, with an **ivory-only confirmation marker** for meaningful selection or commitment (projection ivory `#f3ecdf` + redundant non-color signals; no separate warm cue — ADR 016)
* progressive recommendation depth; explanation present and truthful; no required numbered case
* poster as a cinematic/editorial object, not a flat grid thumbnail
* brief, purposeful, nonblocking motion; reduced decorative chrome (hairline rules over glow/glass)
* the legacy purple–pink gradient barred from default actions, selected states, chrome, AI/premium signaling, and permanent atmosphere (any narrow reveal/memory/celebration role remains an unresolved prototype question)
* no default visible backup recommendations on Tonight

These foundation principles are **accepted**. The replacement *specifics* are **active prototype questions** (below). The full direction, surface roles, and rationale live in the active authority document: [`docs/ui/design-authority-thoughtful-seatmate.md`](../../docs/ui/design-authority-thoughtful-seatmate.md). The prior [`docs/ui/design-authority-f3.md`](../../docs/ui/design-authority-f3.md) is **historical** — it records the shipped F3/F4 baseline, not the target.

### Accepted principles versus prototype questions

Do **not** finalize any of these — they remain prototype questions until validated by rendered prototypes and a decision record:

* contextual-film-color strength and normalization thresholds
* whether the legacy gradient ultimately survives
* whether a serif has any role in genuinely long-form Film File reading
* exact bottom-navigation structure
* exact couple-mode interaction

**Resolved (moved to accepted):**

* the single core sans-serif voice is **Inter** ([ADR 014](../../docs/decisions/014-thoughtful-seatmate-p1-core-voice.md))
* the exact **warm graphite foundation values** and **projection-ivory hierarchy** — the twelve foundation roles ([ADR 015](../../docs/decisions/015-thoughtful-seatmate-p2a-foundation.md)) — accepted as prototype / pilot-scoped values (see "Foundation neutrals"), **not** yet global production tokens
* the **decision signal**: meaningful selected/committed states are **ivory-only** (projection ivory `#f3ecdf` supplementary marker + redundant non-color signals); **no separate warm decision-signal hue and no new color token** ([ADR 016](../../docs/decisions/016-thoughtful-seatmate-p2b-decision-signal.md)). This resolves the warm-cue-hue and ivory-only-vs-ivory-plus-warm-cue questions (see "Primary action and decision signal")

## Design modes

Use one of three modes explicitly.

### Maintenance mode

Use when making an ordinary feature change, bug fix, accessibility fix, or local improvement.

In maintenance mode:

* follow the current implemented system
* reuse current tokens and primitives
* avoid introducing a new visual language in one isolated component
* preserve unrelated visual behavior

### Exploration mode

Use when testing a visual, brand, typography, interaction, or layout idea.

In exploration mode:

* prototypes may use temporary values and local styling
* compare alternatives directly
* label assumptions
* prioritize speed of learning
* do not prematurely convert experiments into shared tokens
* keep exploration isolated from production surfaces when practical

### Migration mode

Use after a new direction has been accepted.

In migration mode:

* define the target token and component system
* identify affected routes and consumers
* migrate representative surfaces first
* avoid maintaining two competing systems indefinitely
* remove obsolete rules and compatibility layers deliberately
* update visual baselines and documentation
* preserve a rollback path until the direction is stable

Do not mix exploration and migration without clearly stating which decisions have been accepted.

## Typography

### One coherent sans-serif voice

The accepted target is **one coherent human sans-serif voice** across the core product, and that voice is **Inter** — the single core Latin sans-serif. Hierarchy comes from scale, weight, measure, tracking, style, and placement — not from a separate serif "editorial" personality. There is **no permanent serif-versus-system split**.

**Accepted (P1 — Core Voice, 2026-06-14):** Inter was retained after a controlled blind comparison against Instrument Sans, which did not show sufficient whole-system benefit to justify migration (a near-tie favours the already-integrated font). See [ADR 014](../../docs/decisions/014-thoughtful-seatmate-p1-core-voice.md) and the [evidence packet](../../docs/ui/thoughtful-seatmate-p1-core-voice-evaluation.md). "Latin" is intentional — non-Latin fallback coverage was not tested.

**Current production baseline (transitional):** Newsreader, Inter, and Outfit are all loaded across surfaces (F4 rolled Newsreader/Inter broadly; residual global/shared/legacy areas still use Outfit). The "Inter is the system; Newsreader is the curator" split is the prior F3/F4 model and is **retired as the target** — do not extend it to new surfaces. Inter-only consolidation happens only through the migration gates.

**Possible long-form exception (still an open prototype question, not a default):** whether a serif earns a narrowly-bounded role in genuinely long-form Film File reading is open to test. It must not reinstate a system-versus-editorial personality split.

### Interface typography

Use Inter for:

* navigation
* buttons
* inputs
* filters
* chips
* labels
* metadata
* settings
* preference controls
* recommendation evidence
* tables and dense information
* compact explanatory text
* system feedback

Interface typography should prioritize:

* legibility
* consistent metrics
* clear hierarchy
* good rendering at small sizes
* predictable control dimensions

### Editorial emphasis

Recommendation titles, Film File headings, the "why this pick" reason, and reflective or emotionally important language carry **editorial weight** — but in the target direction that weight comes from the single sans-serif voice (size, weight, measure, italic, spacing), not from a separate serif family.

Editorial moments should feel:

* considered
* human
* readable
* film-literate
* contemporary rather than antique
* expressive without becoming theatrical

**Current production baseline (transitional):** these moments currently render in Newsreader on `/home`. Treat that as the shipped baseline, not the target; do not extend Newsreader to new surfaces. Whether a serif earns a narrow long-form Film File role is an open prototype question (see "One coherent sans-serif voice").

### Existing Outfit usage

Outfit remains part of the current baseline during validation.

It may be retained if testing shows that it has a clear unique role, such as:

* wordmark
* compact brand labels
* selected uppercase identity treatments
* a specific display system not served by Newsreader

Do not preserve Outfit as a third permanent family merely because it is already installed.

A three-family system must justify:

* its distinct roles
* loading cost
* visual coherence
* language coverage
* maintenance burden

### Type-system evaluation

When evaluating a font or type treatment, consider:

* readability
* true italic availability
* weight range
* optical sizes
* variable-font support
* language coverage
* loading cost
* cumulative layout shift
* licensing
* screen rendering
* distinction between interface and editorial roles
* behavior at mobile sizes
* behavior with long and unexpected content

Do not approve a typeface solely from a specimen page.

Test it in real FeelFlick surfaces.

### Hierarchy

Use size, weight, line height, measure, tracking, style, and placement together.

Avoid relying only on very light or very heavy weights to establish hierarchy.

Do not impose one exact weight or tracking value on every future headline.

Large type should remain readable and robust across:

* narrow screens
* long titles
* localization
* browser zoom
* low-contrast imagery
* missing imagery

Use balanced or intentional wrapping where supported, but do not depend on it to rescue weak layout constraints.

## Color architecture

Color should support four separate roles.

### Foundation neutrals

Warm cinematic neutrals should carry most:

* page backgrounds
* surfaces
* text
* borders
* navigation chrome
* structural separation

The foundation should frame film artwork rather than compete with it.

Preferred qualities:

* near-black rather than blue-black
* off-white rather than harsh pure white where appropriate
* subtle warmth
* restrained surface separation
* clear contrast
* sufficient distinction between layered panels

**Accepted (P2A — Foundation Neutrals, 2026-06-14):** the warm graphite foundation
and projection-ivory hierarchy below are the **accepted** values, per
[ADR 015](../../docs/decisions/015-thoughtful-seatmate-p2a-foundation.md). The
P1-control warm graphite system won a controlled blind comparison against a warmer
and a more neutral graphite. These are **accepted prototype / pilot-scoped values**:
they are fixed and used **unchanged** in P2B and as scoped/local values in the
Tonight and Film File pilots. They are **not** global production tokens yet —
shared-token promotion remains gated by pilot validation (see "Migration gates").

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

Do not edit production CSS to match these yet — they are the accepted prototype/pilot
foundation, not a production-token migration.

### Primary action and decision signal

The target identity is carried by the **warm-neutral foundation and ivory text**, not by a brand hue.

* On dark core surfaces the **default primary commitment action uses a solid light-neutral fill with dark warm text** — calm and legible. It must not depend on contextual film color, the legacy gradient, or a permanent rose accent. The exact ivory and graphite foundation token values are now **accepted** (warm graphite / projection-ivory, [ADR 015](../../docs/decisions/015-thoughtful-seatmate-p2a-foundation.md), prototype / pilot-scoped — see "Foundation neutrals"); alternate polarity is permitted only when the surrounding surface or accessibility requirements justify it.
* **Decision signal — ivory-only (accepted, P2B / [ADR 016](../../docs/decisions/016-thoughtful-seatmate-p2b-decision-signal.md)).** Meaningful selected and committed states use a small supplementary confirmation marker in **projection ivory `#f3ecdf`** (the existing ADR 015 value) — **never** a separate warm hue. P2B's controlled blind comparison rejected all three warm candidates (each trailed the ivory control by ≥15 weighted points and sat perceptually near red/amber).
  * **Marker architecture:** 7px circular marker in a permanently reserved 14px slot; no glow/blur/gradient/shadow/pulse/ambient animation; zero layout shift; reduced-motion safe. It is supplementary and **never the sole state indicator** — every selected/committed state also carries ≥2 non-color signals (semantic state, changed label, check/bookmark icon, neutral fill/border, status text, stable position).
  * **Permitted scope:** explicitly selected session intent; recommendation explicitly chosen for tonight; confirmed watchlist save; one current/present-tense active pick in memory. No more than one marker in the primary decision area; two only when two legitimate commitments coexist (chosen + saved).
  * **Forbidden scope:** default CTA, hover, focus, navigation, tabs, routine filters, every chip, loading, disabled, errors, destructive actions, ratings, caution, success/watched, availability, confidence, headings, wordmark/logo, AI/premium signaling, page atmosphere, poster aura, decorative separators. It is **not** a brand accent.
  * **Token discipline:** do **not** create a new global `--decision-signal` color token aliasing `#f3ecdf`. Scoped pilots may use a **local semantic alias** to the ADR 015 projection-ivory role; the source of color truth remains ADR 015. No global token migration is authorized.

**Current production baseline (transitional):** migrated surfaces ship rose (`#DD4E83`) as the accent, with the legacy purple/pink tokens on the rest. Rose as a *permanent* brand signature or default primary-CTA color is **retired as the target** — it is a transitional accent, not the core identity. Do not extend rose as the brand signature to new surfaces, and do not make every button, heading, icon, border, and glow rose.

Semantic colors are separate and load-bearing (see "Semantic colors"); never fold amber/red/green into the brand palette.

### Supporting atmosphere

The target foundation is warm-neutral; **plum is not the standard supporting atmosphere**. Muted plum (and the legacy purple) appear only on unmigrated surfaces as part of the transitional baseline, and a plum-beside-rose system is **retired as the target**. Supporting depth in the new direction comes from warm-neutral surface separation and normalized contextual film color, not from a fixed secondary brand hue.

Do not introduce plum or purple as a new supporting atmosphere on surfaces adopting the target direction.

### Contextual color

Mood- or poster-derived color may be used to make recommendation and Film File surfaces emotionally specific.

Contextual color can influence:

* atmospheric glow
* selected mood treatment
* subtle border tint
* progress or confidence visualization
* section accent
* poster fallback
* recommendation transition
* editorial highlight

It must not reduce readability or make the product feel visually random.

Contextual color should use normalized system roles such as:

```css
--context-accent;
--context-accent-soft;
--context-accent-muted;
--context-accent-contrast;
--context-glow;
```

Do not insert raw extracted poster colors directly into UI text or controls.

Normalize contextual colors by:

* luminance
* saturation
* minimum contrast
* maximum chroma
* surface role
* light and dark compatibility
* fallback behavior

Limit the number of simultaneously active contextual colors.

### Semantic colors

Success, warning, destructive, informational, rating, availability, and status colors should be selected by function.

Do not force semantic states into the rose or plum brand palette.

Semantic meaning should not rely on color alone.

## Gradients

The legacy purple-to-pink gradient is **retired as a primary action and as default atmosphere**. On `/home` it has been replaced with the neutral primary (a solid light-neutral fill with dark warm text). **Accepted restriction:** it must not function as the default primary action, a routine selected state, application chrome, a generic AI/premium signal, or permanent atmosphere. **Active prototype question:** whether it retains any narrow role — a rare reveal, memory, campaign, sharing, or celebration moment — or survives at all is unresolved; do not create new production uses until that role is validated, and do not treat a possible future use as an approved production treatment.

Gradients are appropriate when they communicate:

* atmosphere
* emotional transition
* visual depth
* selection
* contextual film color
* a focused brand moment

Avoid using gradients as automatic shorthand for:

* premium
* AI
* modern
* primary action
* brand identity

Prefer one strong gradient moment over many repeated gradient elements.

Do not apply the same saturated gradient simultaneously to:

* logo
* buttons
* headings
* borders
* icons
* glows
* backgrounds

A gradient should have a specific role in the composition.

## Film imagery

Film posters, backdrops, and stills are primary visual material.

The surrounding interface should usually support their emotional specificity rather than overpower it.

When composing around film imagery:

* preserve recognizable poster crops
* avoid covering important faces or titles unnecessarily
* ensure text remains readable
* use image focal points where data is available
* support missing and low-quality images
* prevent layout shift
* provide useful fallbacks
* avoid excessive overlays that flatten every film into the same mood
* evaluate dark and light artwork
* test extreme aspect ratios and long titles

Poster-derived atmosphere should feel connected to the source image without reproducing muddy or inaccessible colors.

## Layout and composition

FeelFlick should not default every surface to the same visual formula.

Avoid automatic repetition of:

* centered headline
* subtitle
* three-card row
* bento grid
* carousel wall
* glass panel
* oversized gradient CTA
* decorative marquee

Choose composition according to the user’s task.

### Editorial surfaces

Editorial and recommendation surfaces may use:

* asymmetry
* strong image hierarchy
* deliberate whitespace
* narrower reading measures
* controlled overlap
* cinematic sequencing
* large typographic moments
* gradual disclosure

### Functional surfaces

Settings, lists, search, history, and account interfaces should prioritize:

* scanability
* density appropriate to the task
* clear interaction states
* stable layout
* efficient navigation
* predictable controls
* responsive behavior

Do not make functional interfaces artificially sparse merely to appear premium.

### Responsive design

Mobile should be designed as a primary experience, not a compressed desktop layout.

Validate:

* headline wrapping
* recommendation hierarchy
* touch targets
* control density
* poster crops
* sticky or fixed navigation
* safe-area behavior
* long content
* keyboard appearance
* modal and sheet behavior

Do not hide essential explanation or controls solely to simplify mobile screenshots.

## Surfaces and elevation

Prefer hierarchy created through:

* spacing
* contrast
* border
* tone
* typography
* composition

Use shadows, blur, glow, and glass effects intentionally.

Avoid stacking several elevation techniques on the same element without purpose.

A surface should not become “premium” merely by adding:

* blur
* transparency
* gradient border
* glow
* shadow
* noise
* animated shimmer

Use these effects only when they improve depth, context, or focus.

## Components

Shared components should provide consistency without forcing every experience into the same presentation.

Before changing or replacing a shared component:

* inspect its consumers
* identify which behavior is contractually important
* distinguish visual assumptions from interaction requirements
* test representative usages
* define the migration strategy

A component may be redesigned when:

* its visual language is outdated
* it cannot support the desired hierarchy
* its API encodes obsolete assumptions
* accessibility would improve
* responsive behavior would improve
* consumers have diverged beyond a useful abstraction

Do not preserve a shared component solely because migration is inconvenient.

Do not fork a component repeatedly to avoid improving its underlying design.

## Movie-card interaction

The current pure poster-scale hover behavior is the maintenance baseline.

Preserve it during unrelated work.

It may be reconsidered during an explicit movie-card or carousel redesign.

A proposed replacement should evaluate:

* pointer and touch behavior
* title readability
* metadata discoverability
* layout stability
* sibling movement
* accidental activation
* accessibility
* performance
* reduced motion
* consistency across card sizes
* impact on scanning

Do not introduce expanding overlays or floating portals casually.

Do not forbid them without testing if a future redesign identifies a clear user benefit.

## Motion

Motion philosophy: **house lights down** — brief, purposeful, and nonblocking; it sets attention, it does not perform.

Motion should communicate:

* response
* selection
* continuity
* hierarchy
* progression
* loading or completion
* meaningful emotional transition

Use motion to help users understand what changed.

Avoid motion whose only purpose is to display technical capability.

Possible motion includes:

* state transitions
* recommendation reveal
* contextual color transition
* poster emphasis
* sheet and dialog movement
* route continuity
* subtle atmospheric animation
* scroll-linked narrative sequences

Ambient motion, parallax, or richer animation is allowed when it:

* strengthens the product experience
* does not compete with film imagery
* remains performant
* respects reduced motion
* does not delay action
* does not create nausea or disorientation

Repeated infinite movement should have a clear reason.

Always provide a stable reduced-motion experience.

## Copy and voice

The current landing copy is a baseline, not permanent approved language.

FeelFlick’s voice should be:

* concise
* emotionally perceptive
* confident without false certainty
* specific
* film-literate
* human
* free of unnecessary AI language
* free of inflated marketing claims

Avoid:

* generic “unlock your journey” language
* claims that the product understands more than the evidence supports
* algorithmic jargon in primary user-facing copy
* fake urgency
* fake scarcity
* fake social proof
* over-explaining simple actions

Copy may evolve during explicit positioning, conversion, onboarding, or product-language work.

Preserve the underlying promise unless that promise itself is under review.

## Recommendation explanation

The explanation is the emotional center of a recommendation, not a small tinted panel. It should read as **natural progressive depth** — a true, plain-language reason at the glance, with fuller evidence available in the Film File when invited.

**A numbered roman-numeral case is not a universal requirement.** Numbering is at most one legitimate presentation when multiple truthful rungs genuinely exist; it is not the identity of the recommendation and must not be forced onto every surface.

Rules (these hold regardless of presentation):

* Never fabricate user-specific recommendation evidence. When the user-specific engine reason is unavailable, do not invent one — but the recommendation may still use a clearly non-personal rationale grounded in the film's qualities, an explicit session constraint, a documented quality signal, or honest cold-start language. Do not present broad or editorial reasoning as though it came from user history, and do not let the pick read as unexplained certainty just because mature personalization evidence is unavailable.
* Do not infer or claim the user's current mood unless they explicitly selected or described it this session ("For your tender night" is fabrication when the mood was auto-selected). An auto-selected baseline mood is an internal ranking signal and must not be presented as a fact about the user. When the user explicitly provided a mood or viewing intent, the interface may reflect it accurately, concisely, and non-clinically.
* "Not tonight" and skip actions should feel dignified, not destructive.
* Tonight shows one visible recommendation; a rejection produces one sequential replacement, not visible backup cards.
* The Emotional Mood Instrument exploration (from F0) is appropriate for Discover and mood-specific surfaces, not the primary briefing.

**Current production baseline (transitional):** `/home` ships a numbered `I · Why this pick` / `II · What you're in for` case in Newsreader italic + Inter, with tests asserting the `I ·`/`II ·` markers. That is the shipped baseline; reversing it toward unnumbered natural explanation is later, gated code work — do not change the shipped tests or components in a documentation pass.

## Accessibility

Design quality includes accessibility.

Visual work should account for:

* text and non-text contrast
* focus visibility
* non-color state communication
* readable line length
* text zoom and reflow
* touch-target size
* motion sensitivity
* keyboard navigation
* screen-reader structure
* image alternatives
* disabled and error states
* loading-state clarity

Thin typography and translucent colors require particular contrast scrutiny.

Do not rely solely on nominal contrast calculations when a very light font weight, glow, blur, image background, or gradient reduces practical readability.

## Performance

Visual ambition must remain compatible with a media-heavy application.

Evaluate:

* font requests
* variable-font size
* image loading
* responsive image sources
* poster and backdrop decoding
* animation cost
* blur and filter cost
* route bundle growth
* layout shift
* client-side color extraction
* repeated canvas or WebGL work
* low-end mobile behavior

Prefer CSS and existing browser capabilities when they provide sufficient quality.

Do not add a heavy animation or rendering library for one small effect.

## Design validation

Do not approve a major direction from isolated components.

Prototype representative surfaces:

1. landing hero
2. primary recommendation
3. Film File explanation
4. dense authenticated interface
5. mobile recommendation flow

For the target typography and color direction, compare:

* the shipped F3/F4 baseline (Newsreader + Inter + rose on warm dark neutrals)
* the target: **Inter** as the single core Latin sans-serif (ADR 014) on a warm-graphite / projection-ivory foundation (ADR 015), with a neutral high-contrast primary and an ivory-only decision-signal marker (ADR 016; no separate warm cue)
* contextual film color behavior, strength, and normalization with representative posters and moods

Evaluate:

* emotional fit
* recommendation trust
* distinctiveness
* poster integration
* readability
* control clarity
* mobile behavior
* accessibility
* performance
* coherence between editorial and functional surfaces

Use realistic content, including:

* short and long movie titles
* missing posters
* bright posters
* dark posters
* multiple languages
* long explanations
* sparse user history
* mature user history
* loading and error states

Capture desktop and mobile comparisons.

Perform at least one critique and refinement pass.

## Migration gates

The Thoughtful Seatmate direction is **accepted at the principle level**, not yet implemented. Migration proceeds through these gates, in order — do not skip ahead:

1. **Doctrine accepted** — the active authority is [`docs/ui/design-authority-thoughtful-seatmate.md`](../../docs/ui/design-authority-thoughtful-seatmate.md). ✅
2. **Isolated prototypes resolve the open questions** — contextual-color thresholds, gradient survival, and the serif exception — answered with rendered desktop + mobile evidence. (The core voice (Inter, [ADR 014](../../docs/decisions/014-thoughtful-seatmate-p1-core-voice.md)), the warm graphite / projection-ivory foundation values (prototype/pilot-scoped, [ADR 015](../../docs/decisions/015-thoughtful-seatmate-p2a-foundation.md)), and the ivory-only decision signal (no warm-cue token, [ADR 016](../../docs/decisions/016-thoughtful-seatmate-p2b-decision-signal.md)) are now resolved.) *Remaining questions open.*
3. **A decision record approves** the chosen prototype direction.
4. **Pilot** the accepted direction on **two representative production surfaces** using **scoped/local values** rather than prematurely globalizing tokens. Tonight (`/home`) and Film File (`/movie/:id`) are the recommended pilots unless a later decision record chooses equivalent surfaces.
5. **After both pilot surfaces validate** the values and the interaction pattern, **promote** the values into shared tokens and primitives.
6. **Migrate the remaining surfaces** systematically, with deliberate visual-regression re-baselining.

Pilot production work is allowed once gates 2–3 are complete; it uses scoped/local values. Shared tokens and broad shared-component changes must not precede pilot validation (gate 5) — they depend on the pilots, not the reverse, and never block pilot production work.

**Current production baseline (mixed and transitional, do not remove in unrelated work):**
* `/home` carries the original F3/F4 migration (F1–F2); F4 then expanded Newsreader/Inter/rose typography and palette across **many feature surfaces**
* residual **global, shared, and legacy** areas still contain Outfit, purple/pink styling, and gradient treatments
* neither F3/F4 nor the Thoughtful Seatmate direction is uniformly implemented everywhere

**Do not change as part of a design pass:**
* recommendation engine, scoring, or data contracts
* shared tokens or broad shared-component changes before the two pilot surfaces validate the values (gate 5)
* the shipped F3/F4 implementation, except as a deliberate, gated pilot or re-migration
* Design Lab directions (`src/features/design-lab/`) — keep isolated; they are prototype comparisons, not production
* AppShell header (gradient wordmark, "Tonight" tab, avatar ring) and the global `:focus-visible` ring — these need dedicated global passes

For the prior decision record and the shipped baseline it describes, see the historical [`docs/ui/design-authority-f3.md`](../../docs/ui/design-authority-f3.md).

## Updating this rule

Update this file when a design direction has been accepted, rejected, or materially revised.

Clearly distinguish:

* current production baseline
* active experiment
* accepted target
* completed migration

Remove superseded prohibitions and stale implementation details.

Keep historical rationale in design decision records or research documentation rather than leaving conflicting directions active here.

The active design authority is [`docs/ui/design-authority-thoughtful-seatmate.md`](../../docs/ui/design-authority-thoughtful-seatmate.md); update both together when the direction changes.
