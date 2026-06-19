# FeelFlick — Product Doctrine

> The canonical concise doctrine for *what FeelFlick is for*. Read this before any
> product, design, IA, or recommendation work. When a decision is ambiguous, this
> document — not feature momentum — settles it.
>
> [`.claude/rules/product.md`](../.claude/rules/product.md) operationalizes this
> doctrine for day-to-day repository work; it must stay aligned with this file and
> must not become a second, competing doctrine. Update both together when the
> durable strategy changes.
>
> Companion docs: [CLAUDE.md](../CLAUDE.md) (how to work in the repo),
> [feelflick-foundation-readiness-audit.md](feelflick-foundation-readiness-audit.md)
> (F0 ground truth + roadmap), [product-research-patterns.md](product-research-patterns.md)
> (what to borrow / refuse from competitors). The doctrine-change rationale is
> [ADR 020](decisions/020-personal-movie-discovery-and-bounded-choice.md).

---

## Category

FeelFlick is a **personal movie discovery platform**.

## Brand promise

> Movies, made personal.

## Core definition

> FeelFlick helps people discover movies through their taste, their mood, and their
> curiosity.

Taste, mood, and curiosity are the three complementary dimensions of discovery.
Each has a home in the product: taste drives **Made for you** (Home), mood and
situation drive **Tuned to the moment** (Discover), and curiosity drives **Yours to
explore** (Browse).

## Core user outcome

FeelFlick makes it easier to find movies that feel personally relevant — *without*
either extreme:

- it does not force the user to accept exactly one recommendation; and
- it does not overwhelm the user with hundreds of undifferentiated options.

Success is the user finding a movie they're glad they chose, and trusting why it
was offered. Engagement time is not the goal; a short, satisfying session is a good
outcome, and so is a longer session of genuine exploration. Interpret session
length in context, never as a target.

---

## Primary user problem

> "I want something to watch, and I have a sense of who I am, how I feel, and
> roughly what I'm in the mood for — but the catalog is enormous, generic
> recommendations don't fit me, and scrolling endlessly is exhausting."

The problem is not a shortage of movies. It is the difficulty of making a
satisfying choice from too many plausible options while accounting for present
mood, available time, attention and energy, company, familiarity versus novelty,
personal taste, quality, and what the user has already seen or rejected.

FeelFlick should perform more of that reasoning than the user has to perform
manually — and then leave the final choice with the user.

---

## The three complementary discovery modes

Home, Discover, and Browse are **complementary ways of finding a movie**, not a
ranked hierarchy in which one is the product and the others are leftovers:

- **Home understands the person.**
- **Discover understands the moment.**
- **Browse follows explicit curiosity.**

Do not state that Browse or Discover must always be subordinate to Home.

### 1. Made for you — Home

Home presents personalized recommendations based on what FeelFlick knows about the
user, including viewing history, ratings, saves, skips, favorite genres,
filmmakers, actors, previously loved films, emerging interests, and the user's
[Cinematic DNA](#cinematic-dna).

Home **may** contain a prominent hero recommendation. That hero is allowed to be
singular and visually dominant — but Home is **not restricted to one visible
movie**.

Home may eventually include small, personalized groups such as:

- Because you loved…
- Genres for you
- Trending for you
- Hidden gems
- Essential watches
- More from filmmakers you love
- Emerging interests
- Something outside your usual choices

These are product *possibilities*, not a requirement that every section ship, and
not a requirement that Home become a wall of carousels. Which groups exist, how
many, and in what order are surface hypotheses (see
[Doctrine versus implementation hypotheses](#doctrine-versus-implementation-hypotheses)).

### 2. Tuned to the moment — Discover

Discover is a mood- and situation-based recommendation experience. It can consider
mood, company, available time, occasion, energy, emotional boundaries, subtitles,
familiarity versus surprise, and other situational preferences.

Discover should create a **small, focused, finite selection** — enough to give the
user a real choice without overwhelming them. The working hypothesis is roughly
10–15 movies, but the exact number is a product hypothesis to validate by surface
and context; it is **not** doctrine.

### 3. Yours to explore — Browse

Browse gives users transparent control to explore films through explicit filters
and navigation: genre, language, year, runtime, rating, people, availability,
collections, and other intentional filters.

Browse is **not** a lesser or accidental fallback. It is the mode for users acting
on explicit curiosity or known intent, and it deserves first-class quality.

---

## Cinematic DNA

Cinematic DNA remains a flagship FeelFlick concept.

> Cinematic DNA is a living picture of the stories, moods, filmmakers, genres, and
> styles a person responds to.

It evolves through watches, ratings, saves, skips, re-watches, changing interests,
explicit corrections, and other reliable behavioral evidence. Describe it as
**living, evolving, evidence-based, correctable, and still developing**.

Cinematic DNA must **not** be described as biologically fixed, permanently
complete, deterministic, infallible, a universal match score, or a complete
definition of the person. Where a number is shown (for example a confidence or
overlap value), present it as evidence with honest uncertainty, never as certainty
about the person or a guarantee of enjoyment.

---

## Choice philosophy

FeelFlick provides:

> Small, relevant, personal, finite selections that make choosing easier while
> leaving the final choice with the user.

The **"right amount of choice"** is the principle — not exactly one mandatory
recommendation, and not an endless feed. A prominent singular pick is permitted and
often a strong default; bounded, finite selections are allowed and encouraged where
they improve discovery.

### Anti-overwhelm (anti-scroll, redefined)

Anti-scroll remains valid. It means **bounded and intentional choice** — not a
mandatory cardinality of one. FeelFlick must still resist:

- infinite feeds;
- endless scrolling;
- unbounded recommendation walls;
- repetitive or generic carousels;
- low-quality catalog dumping;
- making users perform all of the curation work themselves.

Evaluate any choice surface by asking: does the user have a clear goal? is the
collection bounded with a visible stopping point? is the ordering meaningful? does
each additional option improve the decision? can the user understand why the
content is present? A grid, row, or finite selection is acceptable when it serves a
defined job better than a single recommendation would. A multi-film interface is
**not** automatically drift — an *unbounded* or *purpose-free* one is.

---

## Trust and explainability

- **Personalization combines taste and context.** Neither alone is enough.
- **Recommendations should be explainable**, and explanations must be grounded in
  real signals — specific to the user, film, or moment; concise; honest about
  uncertainty; never fabricated. Prefer a specific true reason ("Because you loved
  *Past Lives*") over generic language ("Recommended for you"). Do not imply one
  visible reason fully caused a multi-signal ranking.
- **Quality gating matters.** Recommend films worth the user's time, but do not
  collapse the catalog into only popular, recent, English-language, or
  consensus-safe films. Protect space for older, international, emerging,
  culturally specific, and lower-popularity work with credible evidence.
- **Feedback should improve future recommendations**, and that improvement should
  be understandable to the user. Skips and corrections are meaningful signals, not
  silent permanent bans.
- **Honesty over the appearance of certainty.** Never fabricate reasons, ratings,
  counts, testimonials, social proof, availability, or algorithmic confidence.
- **Taste memory compounds.** As reliable evidence accumulates, recommendations
  and explanations should become more specific and personally credible. The exact
  signal thresholds and the size of the quality gain are hypotheses, not doctrine.

---

## Surface relationships

The three discovery modes (Home, Discover, Browse) are complementary primaries.
Other surfaces have distinct, supporting jobs and should not be flattened into the
discovery modes or dismissed as filler:

- **Film File** (`/movie/:id`) — the case-making and trust layer: the evidence and
  context that help a user decide on any single film, wherever they found it.
- **Cinematic DNA / Profile** (`/profile`) — makes accumulated learning visible and
  builds trust.
- **Onboarding** (`/onboarding`) — seeds enough taste signal to be useful early.
- **Preferences** (`/preferences`) — control over stable boundaries and recurring
  needs, without forcing the user to configure the engine before getting value.
- **Watchlist** (`/watchlist`) — preserves intent for another moment.
- **History / Diary** (`/history`) — taste-memory substrate that feeds the model
  and compounds into better recommendations; not merely recordkeeping.
- **Lists / collections** — editorial context and trusted discovery.
- **People / taste twins** (`/people`) — consent-led taste discovery; a future
  compounding lever, kept minimal pre-scale.

Each supporting surface earns its place by contributing distinct value, not by
duplicating generic movie-database functionality. **Do not subordinate a useful
feature merely because it is not the primary recommendation.**

---

## Do-not-become list

Reject anything that turns FeelFlick into a *worse* version of someone else's
product:

- ❌ **Not an endless Netflix-style catalog wall** — discovery is bounded,
  intentional, and explained; not an infinite grid of generic carousels.
- ❌ **Not a Letterboxd clone** — the diary/social feed is a signal substrate, not
  the front door.
- ❌ **Not a TMDB wrapper** — TMDB metadata is a substrate, not the product.
- ❌ **Not a JustWatch replacement** — where-to-watch is useful convenience, not the
  central value.
- ❌ **Not a generic tracker** — the ledger is not the value; personally relevant,
  explained discovery is.

Concrete anti-drift tells:

- An infinite / endless feed → betrays *anti-scroll*.
- An unbounded or purpose-free recommendation wall → betrays *bounded, intentional
  choice*.
- Making the user do all the curation work → betrays *personalization*.
- A recommendation shown without an accessible, honest reason → betrays
  *explainability*.
- Recommendations that ignore mood, or ignore taste → betray *personal discovery*.
- Cinematic DNA framed as fixed, complete, or infallible → betrays *living,
  evolving taste*.

---

## The product decision test

Before building or substantially changing a feature, assess:

1. **User value** — what problem does this solve, for whom, in what situation, and
   what becomes easier or better?
2. **Strategic fit** — does it strengthen personal discovery (taste, mood, or
   curiosity), trust, learning, agency, or retention — without duplicating a
   generic movie product?
3. **Decision cost** — does it reduce uncertainty or add more to evaluate? Is any
   additional choice justified and bounded? Does the user understand what to do
   next?
4. **Evidence** — what supports the change, what is still an assumption, and how
   will success or failure be recognized?
5. **System impact** — does it improve the wider recommendation and learning loop
   without creating conflicting concepts or unclear ownership?

A feature does not need to reinforce a single pick to earn its place. It must
create meaningful user or strategic value without undermining trust, clarity, or
the anti-overwhelm principles above.

---

## Doctrine versus implementation hypotheses

This document fixes **doctrine** — the durable product definition. It deliberately
does **not** fix the following, which remain **implementation hypotheses** to be
validated per surface and context, owned by their respective design/implementation
records, and changed without amending doctrine:

- the exact number of Home sections, and which groups ship;
- the exact Discover result count (the ~10–15 working hypothesis is not doctrine);
- the final Home visual hierarchy and whether a hero stays singular;
- the final Discover layout;
- skip / remove / refill behavior inside a multi-film result;
- impression-grouping and placement-aware outcome-attribution implementation;
- card-level match-score presentation;
- daily-briefing email contents;
- final navigation wording;
- whether "The Briefing" remains as an internal module name.

Do not label an unmeasured preference as a proven product principle. When evidence
overturns a principle here, revise the principle rather than preserving conflicting
guidance.

---

## Migration note — doctrine versus current runtime

This doctrine describes the **approved target direction**. It is documentation
only; it does **not** change runtime behavior, and adopting it is not a claim that
the runtime already matches it.

As of this writing, parts of the shipped product still reflect the **former
single-pick model**: Home (the "Briefing") leads with one visible pick over an
invisible sequential queue, and Discover resolves to one visible film with an
internal ranked fallback. That behavior is the current baseline, not the target,
and it is being migrated deliberately in later, separately-scoped changes — not in
the documentation change that introduced this doctrine.

When reading current surface-contract or implementation docs, treat single-pick
framing as a description of current runtime or as a superseded historical decision,
not as current product authority. The history of the former doctrine is preserved
in the phase records under `docs/` (now carrying supersession banners) and in
[ADR 020](decisions/020-personal-movie-discovery-and-bounded-choice.md).
