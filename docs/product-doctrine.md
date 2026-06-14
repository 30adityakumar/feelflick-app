# FeelFlick — Product Doctrine

> The canonical concise doctrine for *what FeelFlick is for*. Read this before any
> product, design, IA, or recommendation work. When a decision is ambiguous, this
> document — not feature momentum — settles it.
>
> [`.claude/rules/product.md`](../.claude/rules/product.md) operationalizes this
> doctrine for day-to-day product work; update both together when the durable
> strategy changes.
>
> Companion docs: [CLAUDE.md](../CLAUDE.md) (how to work in the repo),
> [feelflick-foundation-readiness-audit.md](feelflick-foundation-readiness-audit.md)
> (F0 ground truth + roadmap), [product-research-patterns.md](product-research-patterns.md)
> (what to borrow / refuse from competitors).

---

## North Star

**Turn how you feel into one considered film for tonight — and make the case for
why it's the one.** A recommendation you can trust, not a feed to scroll.

Success is not engagement-time. Success is: *the user opens FeelFlick, feels
understood, gets one pick they believe in, and watches it.* The best session is
short.

FeelFlick is a **Compounding Decision Companion**: immediate decision value tonight,
compounding into taste memory that makes every future pick better. The long-term
moat is that taste memory — not any single surface.

---

## The wedge

> **Mood-first, taste-deep — a single justified nightly pick that makes its case. Anti-scroll.**

Four load-bearing clauses, each defended separately:

1. **Mood-first** — mood is the front door. The user starts from *how they feel
   tonight*, not from a search box or a grid.
2. **Taste-deep** — under the mood sits the user's full taste history (their
   "Cinematic DNA"). The pick fits *this* person, not a generic popular set.
3. **A single justified nightly pick** — *one* film, chosen for the user, shipped
   **with its reasoning**. Not a ranked list to evaluate; a decision, made.
4. **Anti-scroll** — the product actively resists becoming a feed. Less scrolling,
   less choice fatigue, more trust.

Nobody else does this one thing. TMDB has the data but doesn't recommend. Netflix
recommends but buries you in a grid. Letterboxd logs the past beautifully but
doesn't pick *tonight*. JustWatch tells you *where*, not *what for you*. That gap
**is** the strategy: become undeniably the best in the world at the one thing none
of them do, and borrow their disciplines (craft from Apple, measurement from
Netflix, trust from Stripe, community-compounding from Letterboxd) to support it.

---

## Primary user problem

> "It's tonight, I have ~2 hours, I feel a certain way, and I cannot decide what
> to watch — so I scroll, get fatigued, and either settle or give up."

FeelFlick removes the deciding. It reads the mood, knows the taste, and hands over
*one* film with a reason to trust it.

---

## Primary user loop

The loop we are optimizing (everything else is in service of it):

1. **Arrive** (ideally a nightly ritual) → `/home`.
2. **Signal mood** (tap a session mood, or describe it in words).
3. **Receive the Briefing** — one pick, with the case for it ("Because you loved
   X" / "More from {director}" / the Film File's why-for-you).
4. **Decide** — Watch (commit), Save (defer), or Skip (teach the engine).
5. **Watch**, then optionally **log/rate** — which deepens the taste model for
   tomorrow's pick.

A “Not tonight” / skip yields **one sequential replacement** — the next single pick —
not a shelf of visible backup cards. Visible backups are not the default Tonight
behavior.

The loop compounds: every watch, rating, and skip sharpens the next night's pick.
A 5-watch user gets a decent pick; a 50-watch user gets one that feels made for
them.

---

## What must feel *magical*

- The pick feels like it *gets you* — mood and taste, not popularity.
- The reason is specific and true ("Because you loved *Parasite*"), not generic
  ("Recommended for you").
- Onboarding delivers a believable pick fast — value before commitment.
- The Cinematic DNA reflects the user back to themselves accurately.

## What must feel *trustworthy*

- The pick is never mediocre — quality gating is visible in the result.
- The case is honest — no fabricated reasons, counts, or social proof.
- The same number means the same thing everywhere (e.g. DNA confidence, match %).
- Skipping visibly teaches the engine; the user feels heard, not ignored.
- Nothing dark-patterns the user into scrolling or "just one more."

---

## Surface hierarchy

Every surface is ranked by its relationship to the wedge. **The IA must make this
ranking legible** — the Briefing is visibly primary; everything else is visibly in
service of it. (This is the central question F2 resolves.)

### Core — *the wedge itself*
- **Home / The Briefing** (`/home`, surfaced as **"Tonight"** in nav) — tonight's single justified pick.
- **Film File** (`/movie/:id`) — the case-making and trust layer (evidence and deeper trust).
- **Onboarding** (`/onboarding`) — seeds the first night's pick.

### Supporting — *make the pick land faster / fit better / earn more trust*
- **Discover** (`/discover`) — mood-driven discovery. Must stay *complementary*
  to the Briefing, never a competing second recommender.
- **Cinematic DNA / Profile** (`/profile`) — the visible payoff of accumulated learning; taste made visible; trust-builder.
- **Preferences** (`/preferences`) — engine dials; control without curation work.

### Utility — *low-friction substrate; never the primary destination*
- **Watchlist / The Queue** (`/watchlist`) — defer a pick.
- **History / The Diary** (`/history`) — the strategic taste-memory substrate; logging that feeds the model and compounds into better picks.
- **Browse / mood-tone-fit pages / collections** — catalog access for intent-driven
  spelunking, deliberately secondary.
- **Lists** (`/lists`) — editorial seasoning, not a Letterboxd-style home base.

### Parked / later — *not now*
- **People / taste twins** (`/people`) — a real future moat, but it compounds only
  *after* there are users. Keep minimal pre-scale.
- **Feed, Challenges** — built but unrouted; redirect to `/home` until they earn a slot.
- **Couple / group decision mode** — a future bounded shortlist or negotiation flow for shared decisions; mechanics remain **provisional**.

> Rule of thumb: if a "utility" or "supporting" surface starts competing with the
> Briefing for the user's primary "what do I watch tonight" intent, that's drift —
> re-subordinate it.

---

## Do-not-become list

Reject anything that turns FeelFlick into a *worse* version of someone else's product:

- ❌ **Not a Letterboxd clone** — the diary/social feed is substrate, not the front door.
- ❌ **Not a TMDB wrapper** — TMDB is metadata, not the product.
- ❌ **Not a Netflix grid** — a wall of carousels betrays the single pick.
- ❌ **Not a JustWatch replacement** — where-to-watch is convenience, not the loop.
- ❌ **Not a generic tracker** — the ledger is not the value; the justified pick is.

Concrete anti-drift tells (from CLAUDE.md):
- An infinite / endless feed → betrays *anti-scroll*.
- A wall of carousels as the *primary* surface → betrays *the single pick*.
- Making the user do the curation work → betrays *it picks for you*.
- A pick shown without its case → betrays *makes its case*.
- Recs that ignore mood, or ignore taste → betray *mood-first* / *taste-deep*.

---

## The feature decision test

Before building **anything**, it must pass this test. If a proposed feature
doesn't clearly win on at least one axis — and harms none — it is not the priority,
no matter how buildable or impressive it is.

A feature earns its place only if it does one or more of these:

1. **Lands the pick faster** — fewer steps / less friction to tonight's film.
2. **Fits better** — a more accurate match to mood + taste.
3. **Earns more trust** — a clearer, truer, more credible recommendation.
4. **Strengthens the case-making layer** — a richer, more specific "why this one."
5. **Reduces scrolling / choice fatigue** — less to evaluate, not more.

And it must not violate the do-not-become list or the anti-drift tells above.

> First question on any request is **not** "can we build it?" — it's "does this
> *sharpen the wedge*, or blunt it toward someone else's product?"

---

## How to use this doctrine

- **Planning a phase / feature:** run it through the decision test; check it against
  the surface hierarchy and the do-not-become list.
- **Reviewing a change:** if it adds a scroll surface, a competing recommender, or
  a case-less pick, flag it as drift.
- **Resolving ambiguity:** prefer the option that makes tonight's one pick land
  faster, fit better, or earn more trust — in that spirit, even when the specifics
  aren't spelled out here.
</content>
