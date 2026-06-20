---
paths:
  - "src/features/**"
  - "src/app/router.jsx"
  - "src/app/AppShell.jsx"
  - "docs/product/**"
  - "docs/decisions/**"
---

# FeelFlick product principles

## Purpose

This file defines FeelFlick’s durable product intent.

> This rule operationalizes [`docs/product-doctrine.md`](../../docs/product-doctrine.md) — the canonical concise doctrine, which it must not override or contradict. Update both together when the durable product strategy changes.

FeelFlick is a **personal movie discovery platform**. Its brand promise is **“Movies, made personal.”** — it helps people discover movies through their **taste** (Made for you / Home), their **mood** (Tuned to the moment / Discover), and their **curiosity** (Yours to explore / Browse). Immediate decision value is supported by compounding taste memory that makes future recommendations more specific over time.

It should guide product strategy, feature design, information architecture, recommendation presentation, onboarding, retention work, and significant UX decisions.

It is not a fixed roadmap or permanent feature hierarchy. Current routes, labels, and implementations may evolve.

## Product promise

FeelFlick helps people discover movies that fit who they are, how they feel, and what they're curious about.

The brand promise is:

> Movies, made personal.

The supporting promise is a trusted recommendation for the moment — personalized by taste, mood, and context, with a clear reason it fits.

Taste makes it personal.

Mood makes the experience approachable and timely.

Curiosity gives the user direct control to explore.

Explanation makes it trustworthy.

The product should reduce decision fatigue without removing meaningful agency — the **right amount of choice**, with the final choice left to the user.

## The three discovery modes

Discovery happens across three complementary modes, none structurally subordinate to the others:

* **Made for you (Home)** understands the person — personalized recommendations from taste, history, ratings, saves, skips, favorite genres, filmmakers, actors, loved films, emerging interests, and Cinematic DNA. Home may lead with a prominent hero recommendation, but is not restricted to one visible movie; it may include small personalized groups.
* **Tuned to the moment (Discover)** understands the moment — mood- and situation-based discovery (mood, company, time, occasion, energy, emotional boundaries, subtitles, familiarity vs. surprise) returning a small, focused, finite selection.
* **Yours to explore (Browse)** follows explicit curiosity — transparent filter-and-navigation control (genre, language, year, runtime, rating, people, availability, collections). Browse is first-class, not a fallback.

Do not state or assume that Browse or Discover must always be subordinate to Home.

## Primary user problem

The primary problem is not a lack of available films.

It is the difficulty of making a satisfying choice from too many plausible options while accounting for:

* current mood
* available time
* attention and energy
* company
* familiarity or novelty
* personal taste
* quality
* what the user has already watched or rejected

FeelFlick should perform more of this reasoning than the user must perform manually.

## Value model

A strong FeelFlick experience should improve one or more of these outcomes.

### Relevance

The recommendation fits the person and the present situation.

### Confidence

The user understands why the film was selected and believes the reasoning.

### Momentum

The user can move from uncertainty to a decision without unnecessary work.

### Agency

The user can correct, refine, reject, save, or explore without feeling trapped by the system.

### Learning

Meaningful feedback improves future recommendations and makes that improvement understandable.

### Discovery

The product can introduce the user to something unexpected without becoming random, generic, or disconnected from their taste.

A feature may be valuable even when it does not directly shorten the path to the primary recommendation, provided it strengthens trust, learning, retention, identity, or future recommendation quality.

## Primary recommendation experience

A focused recommendation is the clearest expression of FeelFlick’s product idea.

A strong primary flow generally:

1. understands the user’s immediate context
2. combines that context with long-term taste
3. selects one or a small number of strong options
4. explains why each option fits
5. offers clear next actions
6. learns from the user’s response

The recommendation should feel selected, not merely ranked.

Its presentation should communicate confidence without pretending certainty.

A prominent, singular hero recommendation is permitted and is often a strong default — especially where a confident, well-explained pick lowers decision cost. But **exactly one visible recommendation is not a universal requirement.** Small, finite, personalized selections are allowed and encouraged where they improve discovery. The principle is the **right amount of choice**, not a fixed cardinality of one.

Do **not** treat a finite, bounded, personalized multi-film selection as product drift. Drift is an *unbounded* or *purpose-free* surface — see [Choice and anti-scroll](#choice-and-anti-scroll). A finite selection with a clear job, meaningful ordering, and a visible stopping point is in-doctrine.

Bounded choice is appropriate for explicit jobs, including:

* personalized groups on Home (for example "Because you loved…", "Genres for you", "Hidden gems") alongside an optional hero
* a small, focused finite selection in Discover, tuned to the moment
* intentional exploration in Browse for users with strong pre-existing intent
* a bounded shortlist or negotiation flow for an explicit couple/group decision (mechanics provisional)
* a comparison between meaningfully different directions, where evidence shows it improves the decision
* editorial collections that teach or inspire rather than merely add volume
* controlled experiments that measure whether limited alternatives help or harm confidence

**Current runtime note (not the target).** The shipped Tonight (Home) experience still defaults to one visible pick over an invisible sequential queue — a "Not tonight" yields one sequential replacement — and Discover still resolves to one visible film with an internal ranked fallback. That is the **current baseline**, being migrated separately; describe it as current runtime, not as the product rule, and do not flag the planned move to bounded, finite selections as drift.

## Choice and anti-scroll

FeelFlick should resist unnecessary choice overload.

“Anti-scroll” means the product should not confuse content volume with usefulness.

It does not mean scrolling, lists, grids, feeds, or carousels are inherently wrong.

Evaluate a choice surface by asking:

* Does the user have a clear goal?
* Is the collection bounded or does it continue indefinitely?
* Is the ordering meaningful?
* Does each additional option improve the decision?
* Is there a visible stopping point?
* Can the user understand why the content is present?
* Does the surface support action, learning, or exploration?
* Does it compete with or support the primary experience?

FeelFlick must still resist infinite feeds, endless scrolling, unbounded recommendation walls, repetitive or generic carousels, low-quality catalog dumping, and surfaces that push all curation work back onto the user. Avoid endless or engagement-maximizing surfaces whose main purpose is to keep the user consuming options.

A grid, row, or finite selection is acceptable when it serves a defined task better than a single recommendation would. Anti-scroll means **bounded and intentional choice — not a mandatory cardinality of one.** A finite, bounded, personalized selection is not drift; an unbounded or purpose-free one is.

## Supporting experiences

FeelFlick may include search, browse, watchlists, history, lists, profiles, social discovery, editorial content, and recommendation controls.

These experiences should have clear user jobs.

Examples:

* **Search** helps someone act on known intent.
* **Browse** supports exploration when the user wants more control.
* **Watchlist** preserves intent for another moment.
* **History and Diary** are strategic learning infrastructure — taste memory that sharpens future recommendations, not merely recordkeeping.
* **Cinematic DNA / taste profiles** make the accumulated learning visible and understandable.
* **Lists and editorial collections** create context and trusted discovery.
* **Social features** can introduce recommendations through meaningful taste relationships.
* **Preferences** give control over stable boundaries and recurring needs.

Do not subordinate a useful feature merely because it is not the primary recommendation.

Do ensure that each feature contributes a distinct value rather than duplicating generic movie-database functionality.

## Cinematic DNA

Cinematic DNA is a flagship concept: a living picture of the stories, moods, filmmakers, genres, and styles a person responds to. It evolves through watches, ratings, saves, skips, re-watches, changing interests, and explicit corrections.

Frame it as **living, evolving, evidence-based, correctable, and still developing.**

Never describe or present Cinematic DNA as biologically fixed, permanently complete, deterministic, infallible, a universal match score, or a complete definition of the person. Where a confidence or overlap number is shown, present it as evidence with honest uncertainty — never as certainty about the person or a guarantee of enjoyment.

## Explanations and trust

Recommendation explanations are a core product capability.

An explanation should be:

* specific to the user, film, or present context
* supported by real signals
* concise enough to understand
* clear about uncertainty
* free of fabricated reasoning
* useful for deciding whether to watch

Avoid generic language such as “recommended for you” when a more specific and truthful reason is available.

Do not imply that an explanation is causal when it is only a plausible summary of several ranking signals.

The level of explanation may vary by surface. Not every poster requires a paragraph, but important recommendations should provide an accessible path to their reasoning.

## Personalization and user control

Personalization should feel helpful rather than opaque or controlling.

Users should be able to:

* express what they want now
* communicate stable preferences and boundaries
* reject a recommendation
* understand whether feedback was recorded
* correct inaccurate taste assumptions
* distinguish temporary context from long-term preference where relevant
* recover when the system becomes repetitive or overly narrow

Do not force users to configure the recommendation engine before receiving value.

Use progressive learning: begin with enough signal to help, then improve through normal product use.

Avoid filter controls that merely transfer the recommendation work back to the user.

Controls are valuable when they express meaningful intent the system cannot infer reliably.

## Quality and discovery balance

FeelFlick should recommend films worth the user’s time.

Quality gating can protect trust, but it must not collapse the catalog into only popular, highly voted, English-language, recent, or consensus-safe films.

Evaluate quality using multiple signals where practical.

Protect space for:

* older films
* international cinema
* emerging filmmakers
* culturally specific work
* divisive but meaningful films
* lower-popularity films with credible evidence
* user-specific discoveries that broad averages undervalue

Do not equate popularity with quality.

Do not equate obscurity with discovery value.

Recommendation thresholds and filters should be treated as tuneable hypotheses, measured against actual outcomes and catalog effects.

## Emotional range

FeelFlick should support the full emotional range of cinema.

Do not make every recommendation feel:

* comforting
* romantic
* dreamy
* upbeat
* prestigious
* dark
* intense

The interface, explanation, and contextual presentation may adapt to the emotional character of the film and moment.

The product should be capable of recommending discomfort, challenge, ambiguity, silliness, stillness, grief, joy, horror, or wonder when those experiences fit the user’s request.

## Product identity

FeelFlick should be recognizably more than:

* a movie database
* a streaming catalog
* a generic AI assistant
* a social activity feed
* a logging tool
* a collection of recommendation carousels

Its distinct identity should emerge from the combination of:

* present-moment context
* evolving taste understanding
* editorial selection
* honest explanation
* emotional sensitivity
* film-native presentation

Competitor references should be used to improve craft, not to determine FeelFlick’s product shape automatically.

## Current media scope

FeelFlick currently focuses on films.

Do not add television, series, books, music, games, or other media opportunistically during unrelated work.

Expansion into another medium requires an explicit product decision covering:

* user need
* data model
* metadata quality
* recommendation signals
* explanation quality
* information architecture
* brand implications
* migration and maintenance cost

Current scope may change when there is sufficient evidence and a deliberate plan.

## Product experiments

Existing product assumptions are testable.

Experiments may challenge:

* whether one pick should always be shown first
* how many alternatives improve or harm confidence
* how mood should be captured
* whether mood is always the best entry point
* how much explanation is needed
* which signals users trust
* how browsing and recommendation should interact
* how social or editorial discovery should work
* whether the current navigation and route hierarchy are optimal
* how often a recommendation should change
* what creates a healthy return habit

For a meaningful experiment:

1. state the user problem
2. state the hypothesis
3. identify the changed experience
4. define success and failure signals
5. identify important user segments
6. preserve a rollback or comparison path
7. avoid changing several unrelated variables at once
8. document the result before converting it into doctrine

Do not label an unmeasured preference as a proven product principle.

## Doctrine versus surface hypotheses

Distinguish durable doctrine from surface-level hypotheses. Doctrine (in [`docs/product-doctrine.md`](../../docs/product-doctrine.md)): FeelFlick is personal movie discovery across three complementary modes; bounded, finite choice; one prominent pick allowed but not required; Cinematic DNA is living and evolving; anti-overwhelm holds.

The following are **hypotheses**, owned by their design/implementation records and changeable without amending doctrine — do not encode them as rules here:

* the exact number of Home sections and which groups ship
* the exact Discover result count (the ~10–15 working number is **not** doctrine)
* final Home visual hierarchy and whether a hero stays singular
* final Discover layout
* skip / remove / refill behavior inside a multi-film result
* impression-grouping and placement-aware outcome-attribution implementation
* card-level match-score presentation
* daily-briefing email contents
* final navigation wording, and whether "The Briefing" remains an internal module name

## Product decision test

Before building or substantially changing a feature, assess:

### User value

* What problem does this solve?
* For whom?
* In what situation?
* What becomes easier or better?

### Strategic fit

* Does it strengthen FeelFlick’s distinctive value?
* Does it deepen recommendation quality, trust, agency, learning, discovery, or retention?
* Does it duplicate a generic movie product without adding a FeelFlick-specific advantage?

### Decision cost

* Does it reduce uncertainty or add more to evaluate?
* Is additional choice justified?
* Does the user understand what to do next?

### Evidence

* What evidence supports the change?
* What is still an assumption?
* How will success or failure be recognized?

### System impact

* Does it improve the wider recommendation and learning loop?
* Does it create conflicting concepts, duplicate workflows, or unclear ownership?
* Is the long-term maintenance cost justified?

A feature does not need to pass by reinforcing only the nightly pick. It should create meaningful user or strategic value without undermining trust or clarity.

## Metrics and success

Do not optimize for time spent, page views, scrolling depth, or notification clicks in isolation.

Useful measures may include:

* recommendation acceptance
* watch-intent actions
* successful recovery after skips
* save-to-watch conversion
* explanation engagement
* user-reported fit
* repeat use
* rating or feedback completion
* recommendation diversity
* novelty without regret
* reduction in abandoned decision sessions
* long-term trust and retention

Interpret metrics in context.

A shorter session may indicate that FeelFlick solved the decision quickly.

A longer session may indicate meaningful exploration—or unresolved uncertainty.

Do not assume either is inherently good.

Avoid dark patterns designed only to increase engagement metrics.

## Claims and honesty

Never fabricate:

* recommendation reasons
* social activity
* user counts
* ratings
* testimonials
* availability
* personalization confidence
* algorithmic certainty
* editorial endorsement

Distinguish clearly between:

* user-specific signals
* community signals
* editorial judgments
* algorithmic estimates
* external metadata

Trust is more important than appearing certain.

## Updating this rule

Change this file when the durable product strategy changes.

Do not add:

* temporary roadmap priorities
* exact route names
* current UI labels
* implementation details
* individual experiment results
* short-lived feature status

Those belong in plans, decisions, experiment reports, or implementation documentation.

When evidence overturns a principle here, revise the principle rather than preserving conflicting guidance.
