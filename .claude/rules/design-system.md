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

> A contemporary film journal with the precision of a great product and the sensitivity of a trusted curator.

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

The project currently uses:

* Outfit for much of its display typography
* Inter for body and interface text
* dark surfaces
* purple and pink brand colors
* a purple-to-pink gradient
* poster-forward presentation
* restrained motion
* shared tokens and UI primitives

This is the existing implementation baseline.

The preferred direction to validate is:

* warm cinematic neutrals
* rose as the stable brand signature
* muted plum as a supporting hue
* contextual color derived from mood or film imagery
* Inter as the interface voice
* Newsreader as the editorial and curator voice
* poster-first composition
* deliberate, content-supporting motion
* reduced decorative chrome
* clearer separation between interface and editorial storytelling

Do not describe the proposed direction as fully adopted until representative prototypes and rendered comparisons support it.

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

### Role distinction

Typography should distinguish the functional product interface from the editorial recommendation voice.

The preferred role model is:

> Inter is the system. Newsreader is the curator.

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

### Editorial typography

Use Newsreader for:

* landing-page statements
* primary recommendation titles
* Film File headings
* curator explanations
* recommendation rationale
* editorial introductions
* meaningful quotations
* reflective or emotionally important language

Editorial typography should feel:

* considered
* human
* readable
* film-literate
* contemporary rather than antique
* expressive without becoming theatrical

Do not use Newsreader for every label, button, card title, or metadata value.

Its role should remain distinct enough to signal when the product is speaking editorially rather than functionally.

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

Illustrative exploration values may include:

```css
--canvas: #09090b;
--canvas-warm: #0e0c0d;
--surface-1: #151315;
--surface-2: #1c191c;

--text-primary: #f4f0ea;
--text-secondary: #c9c1ba;
--text-muted: #8f8883;
--border-subtle: rgba(244, 240, 234, 0.10);
```

These are starting points for evaluation, not final locked values.

### Brand signature

Rose is the preferred stable brand signature to test.

Use it selectively for:

* primary selection
* meaningful active states
* focus treatment
* progress or confidence
* primary calls to action
* brand recognition
* selected editorial emphasis

Illustrative exploration values may include:

```css
--brand-rose: #dd4e83;
--brand-rose-soft: #f08aaa;
--brand-rose-deep: #9f2f5d;
```

Do not make every button, heading, icon, border, and glow rose.

Brand recognition should come from consistent choices, not maximum repetition.

### Supporting brand color

Muted plum may support the rose system through:

* dark atmospheric depth
* subdued surface tinting
* secondary illustration or data accents
* restrained transition states

Purple should not automatically appear beside rose in every expression.

Illustrative exploration values may include:

```css
--brand-plum: #6c4a78;
--brand-plum-deep: #2b1d30;
```

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

The existing purple-to-pink gradient is part of the current baseline, not the required future identity.

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

For the proposed typography and color direction, compare:

* current Outfit + purple/pink system
* Newsreader + Inter with warm neutrals and rose
* contextual color behavior with representative posters and moods

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

## Adoption criteria

The proposed direction should become the default system only when rendered evidence shows that it:

* improves FeelFlick’s distinct identity
* strengthens editorial authority
* improves or preserves usability
* supports film imagery better
* remains coherent in dense interfaces
* meets accessibility requirements
* has acceptable loading and rendering cost
* can be migrated without indefinite dual-system complexity

If testing does not support the full direction, adopt only the parts that prove stronger.

Possible outcomes include:

* Newsreader adopted, current color retained temporarily
* rose system adopted, Outfit retained for wordmark
* contextual color adopted only on Film File and recommendation surfaces
* warm neutrals adopted before broader component redesign
* proposed system rejected or revised

Do not force the entire package through as one irreversible decision.

## Updating this rule

Update this file when a design direction has been accepted, rejected, or materially revised.

Clearly distinguish:

* current production baseline
* active experiment
* accepted target
* completed migration

Remove superseded prohibitions and stale implementation details.

Keep historical rationale in design decision records or research documentation rather than leaving conflicting directions active here.
