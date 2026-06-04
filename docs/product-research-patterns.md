# FeelFlick — Competitive & Product Research Patterns

> **What to *borrow* and what to *refuse* from the products around us — every item
> mapped back to the wedge.** This is a decision aid, not a feature wishlist. The
> rule: borrow a *discipline*, never a *shape*. If a pattern would turn FeelFlick
> into a worse version of someone else's product, it's in the "refuse" column.
>
> Read alongside [product-doctrine.md](product-doctrine.md). The wedge:
> *Mood-first, taste-deep — one justified nightly pick that makes its case. Anti-scroll.*
>
> **Web-verification status:** the competitor facts below were spot-checked against
> public sources in **June 2026** (see Sources). Product behaviors change — re-verify
> specifics before quoting them in user-facing copy.

---

## How to read each entry

- **What it is** — the product's actual job (grounded).
- **Borrow** — the discipline worth stealing for the single justified pick.
- **Refuse** — the shape that would blunt our wedge.
- **Wedge application** — how it changes tonight's pick landing faster / fitting
  better / earning more trust.

---

## Letterboxd

- **What it is:** social film discovery + a beautiful film *diary*. Logging,
  reviews, lists, and a following graph are the core. It does **not** do strong
  personalized "what should I watch tonight" recommendation — third-party tools
  exist precisely because the first-party product doesn't.
- **Borrow:** the *craft of the diary* and identity — logging feels rewarding;
  taste becomes an identity you're proud of. The review/rating tone is warm and
  human. Community can compound trust *once there are users*.
- **Refuse:** the **feed as the front door**. Letterboxd's home is activity to
  scroll; ours must be one pick. Don't let History/Lists/People become the product.
- **Wedge application:** make logging (History/Diary) a low-friction *signal
  substrate* that sharpens tomorrow's pick — and make Cinematic DNA the "identity"
  payoff — without ever promoting the feed above the Briefing.

## Netflix

- **What it is:** the benchmark personalization engine + the endless grid. Its
  per-title **% match** is a personalized prediction from your viewing history,
  similar-taste members, and title metadata, continuously updated from feedback
  (starts, completions, thumbs). Notably, Netflix has been **de-emphasizing the
  visible % number** (it tested as confusing) in favor of descriptive tags.
- **Borrow:** (1) **measurement culture** — instrument and continuously learn from
  feedback; (2) the *insight* that a bare confidence number underperforms a
  human-readable **reason** — which is exactly FeelFlick's case-making bet.
- **Refuse:** the **grid of endless rows** as the primary surface; autoplay
  pressure; "more to scroll" as the success metric.
- **Wedge application:** prefer a *reason* ("Because you loved *Parasite*") over a
  raw match %. If we show a number (match/DNA confidence), pair it with the reason
  and keep it honest. Borrow Netflix's feedback loop, refuse its surface.

## Apple TV+ / Apple

- **What it is:** editorial, craft-forward curation; a single hero spotlight;
  restraint in motion and typography; poster-forward layouts.
- **Borrow:** the **single editorial spotlight** ritual, typographic discipline,
  and motion restraint. Apple makes *one* thing feel important — the model for the
  Briefing.
- **Refuse:** opacity ("trust us, it's good" with no *why*). FeelFlick's edge is
  showing the case, not just asserting prestige.
- **Wedge application:** the Briefing should feel like an Apple-grade single hero —
  but *justified*. Craft + the case together.

## JustWatch

- **What it is:** a **where-to-watch availability engine** — "which of my services
  has this?" across thousands of services and many countries, personalized to the
  services you subscribe to.
- **Borrow:** clean, honest **streaming-availability surfacing** (provider chips
  done well) as a *convenience at the moment of commit*.
- **Refuse:** making availability *the loop*. A filter-maze of "what's on what" is
  not the job; it's a detail once the pick is made.
- **Wedge application:** put a tasteful "where to watch" affordance on the Film
  File / after the pick — never let it become the entry point or a filter the user
  has to operate first.

## Trakt

- **What it is:** a power tracker/scrobbler — auto-logs what you watch, calendars,
  completionist list tools.
- **Borrow:** **low-friction logging** (the less the user has to do to record a
  watch, the more signal we get) and the calendar/ritual cue.
- **Refuse:** power-user complexity and the "track everything" ethos as the
  product. FeelFlick is for the patient chooser, not the completionist.
- **Wedge application:** make "I watched this" one tap (Quick-Rate already gestures
  at this); every frictionless log improves the next pick.

## TMDB

- **What it is:** the open metadata + image layer (our catalog source).
- **Borrow:** metadata discipline and **compliant attribution** ("uses the TMDB
  API but is not endorsed or certified by TMDB" — already on `/terms`).
- **Refuse:** "data dump as product." A catalog browser is not a recommender.
- **Wedge application:** TMDB is plumbing. Our value is the *judgment* on top of it.

---

## Cross-cutting patterns

### Spotify-style "Made for You" (Discover Weekly)

- **What it is:** an *automated personal expert* that removes the friction of
  hunting — a curated package delivered on a **weekly ritual** (Monday), blending
  collaborative + content signals, deliberately balancing **similarity with
  diversity** so it's neither monotonous nor random. "Made for You" surfaces drive
  a large share of new discovery, and Spotify Design publishes explicit principles
  for ML-powered products (set expectations, build trust, stay in the user's
  control).
- **Borrow:** the **ritual + package** model (FeelFlick's nightly Briefing is the
  *daily* analog of Discover Weekly's weekly drop), and the similarity↔diversity
  balance (don't only serve safe picks; protect a discovery slot — we already do
  via the language anti-bubble and diversity de-clustering).
- **Refuse:** an infinite playlist of "more." Our drop is *one* film, not 30 tracks
  to shuffle endlessly.
- **Wedge application:** frame the Briefing as a *nightly ritual you can trust* —
  delivered, not browsed; tuned, not random.

### Habit / ritual products (Duolingo, Headspace, Oura, BeReal)

- **Borrow:** the **one-thing-a-day** framing, a gentle daily prompt ("open it
  tonight"), and **streaks-without-anxiety**. The best of these make showing up
  feel good without dark-patterning.
- **Refuse:** manipulative streak loss, notification spam, guilt mechanics —
  anything that trades trust for engagement.
- **Wedge application:** the Briefing is the daily ritual. Encourage the return
  ("one film, for the way you feel — open it anytime") without punishing absence.

### Emotional design (Headspace, Calm, Finch)

- **Borrow:** **mood-as-input** UI (tapping a feeling, not filling a form),
  color-as-emotion, copy warmth, and `prefers-reduced-motion` empathy. These make
  an app feel like a *companion*.
- **Refuse:** twee-ness or fake empathy ("we know exactly how you feel!") that
  isn't backed by a real, accurate pick.
- **Wedge application:** mood is our front door — make selecting it feel
  expressive and calming, then *earn* the emotional promise with a pick that fits.

### Recommendation-explanation patterns ("why am I seeing this")

- **Borrow:** the industry direction is toward **transparent, specific reasons**
  ("Because you watched…", "Based on your taste in…") over opaque scores — and
  toward giving users *control* over the signal. This is the heart of FeelFlick's
  case-making moat.
- **Refuse:** generic, templated, or untrue reasons ("Recommended for you"); a
  pick with **no** case at all.
- **Wedge application:** invest in `heroReason` / the editorial overlay so the
  reason is specific and true for *every* pick — not just the one seeded film
  (Parasite). This is the single most differentiating place to spend effort (F6/F8).

---

## Synthesis — what this means for the Briefing

1. **Reason > number.** Even Netflix is walking back the bare % match. Our wedge is
   the *justified* pick — double down on the case, not the score.
2. **Ritual + package, not feed.** Borrow Spotify's "delivered to you" drop and
   habit products' daily cadence; refuse everyone's scroll.
3. **One hero, Apple-grade — but justified.** Craft *and* the case, together.
4. **Logging/availability/social are utilities,** not the loop — borrow their
   friction-reduction, refuse their centrality.
5. **Balance fit with discovery.** Protect a discovery slot so the pick fits *and*
   occasionally surprises (we already have the mechanisms — keep them honest).

> Anti-pattern guardrail: any time a borrow starts to look like the *shape* of a
> competitor (a feed, a grid, a filter-maze, a completionist tracker), stop — that's
> drift, not inspiration.

---

## Sources (verified June 2026)

- Letterboxd — [letterboxd.com](https://letterboxd.com/); third-party rec tools illustrate the first-party gap, e.g. [sdl60660/letterboxd_recommendations](https://github.com/sdl60660/letterboxd_recommendations)
- Netflix — [How Netflix's Recommendations System Works](https://help.netflix.com/en/node/100639); [Netflix No Longer Wants to Tell Us How Well We 'Match' (IndieWire)](https://www.indiewire.com/news/business/match-percentages-netflix-going-away-1234944402/); ["Why Am I Seeing This?" case study (New America)](https://www.newamerica.org/oti/reports/why-am-i-seeing-this/case-study-netflix/)
- Spotify — [Five Ways to Make Discover Weekly More Personalized (Spotify Newsroom)](https://newsroom.spotify.com/2019-05-02/five-ways-to-make-your-discover-weekly-playlists-even-more-personalized/); [Three Principles for Designing ML-Powered Products (Spotify Design)](https://spotify.design/article/three-principles-for-designing-ml-powered-products)
- JustWatch vs Trakt — [JustWatch, Letterboxd, Trakt: which app? (TWiT.TV)](https://twit.tv/posts/tech/justwatch-letterboxd-trakt-which-app-should-you-use-manage-your-watchlist); [Trakt vs JustWatch (SaaSHub)](https://www.saashub.com/compare-trakt-tv-vs-justwatch)
</content>
