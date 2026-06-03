# FeelFlick — Film File Case-Making UI (F6B Implementation Note)

> Phase F6B of the rebuild. Ships the **UI-only, existing-data-only** Film File
> case-making improvement designed in
> [film-file-case-making-f6a.md](film-file-case-making-f6a.md) §8–9 (Option A).
> No schema / Edge Function / engine / generation changes.
>
> **Date:** 2026-06-03 · **Status:** implemented in F6B.

---

## What shipped

1. **`PrimaryCaseCard` (new, [src/features/movie/PrimaryCaseCard.jsx](../src/features/movie/PrimaryCaseCard.jsx))** —
   a single, consolidated, tier-aware "the case" card placed **right after the hero,
   before the Why-for-you signal cards**, so the case is clear before the user
   scrolls. It degrades gracefully on **existing data only, never fabricating**:
   - **Tier 1** — `overlay.ff_take` present → leads with that editorial hook
     (with its byline as the label). This pulls the FF Take *up* from where it was
     buried below the rating.
   - **Tier 2/3** — no `ff_take` → leads with the adaptive `deriveWhyHeader`
     rationale (warm "pulled from what you've watched" / cold-start "rate 5+" /
     anon "sign in"). No invented prose.
   - Shows the engine **match %** *only* when one exists, always with a plain gloss
     ("how it fits your taste so far"); descriptive mood/fit chips when present; an
     anon "sign in and rate" nudge. **Self-hides only when there is genuinely no case.**
   - Caveats (daypart / content boundaries) intentionally stay in the hero (already
     rendered there) — not duplicated in the card.

2. **`TheTake` removed / folded** — the standalone FF-Take section is gone; `ff_take`
   now leads the `PrimaryCaseCard`. This consolidates the previously-distributed case.

3. **`critic_quotes` reframed → `ViewerNotes` ([src/features/movie/ViewerNotes.jsx](../src/features/movie/ViewerNotes.jsx))** —
   the generated quotes are *invented friend-voice personas* (the edge-function
   prompt: "friend-voice not critic-voice… invent a persona… No real critic names").
   The old section was named `CriticQuotes` and styled like review pull-quotes. It is
   now **"Viewer notes"** with an explicit disclaimer: *"Illustrative impressions
   FeelFlick generated to capture how the film feels — not real reviews or quotes
   from real critics."* Content is kept; only the misleading framing is removed.
   A unit test pins the honest framing so the old label can't return.

4. **Parasite-only placeholders made explicit** — `data.js`'s `TIMELINE` /
   `DNA_DELTA` (rendered **only** for Parasite behind the `PARASITE_TMDB_ID` gate)
   were renamed to **`PARASITE_TIMELINE_SAMPLE` / `PARASITE_DNA_DELTA_SAMPLE`** with
   comments that forbid broadening them to other films. Gating verified; the curated
   Parasite experience is unchanged.

New Film File order: `Hero → PrimaryCaseCard → WhyForYou → YourTake → ViewerNotes →
MoodRadar → Synopsis → …`.

---

## Data / engine / schema contracts preserved

- **Route `/movie/:id`**, the `useMovieData` fetch flow, and the lazy
  `generate-movie-overlay` read/write behavior — **unchanged**. `PrimaryCaseCard`
  reads existing resolved values (`ff_take`, `whyHeader`, `mv.ffMatch`,
  `filmDbRow.mood_tags/fit_profile`); it computes nothing new.
- **Watchlist / Mark Watched / rating / trailer / share** handlers + analytics
  (`trackTrailerPlay`, `trackShare`, `useUserMovieStatus`, `YourTake`) — untouched.
- **The `critic_quotes` DB column is unchanged** (still read by Discover too). Only
  the Film File's *presentation* (component name + label + disclaimer) changed.
- **TMDB attribution**, providers, reduced-motion, and a11y expectations preserved.
- No recommendation scoring / `ENGINE_VERSION` / schema / RLS / Edge Function /
  OpenAI-prompt / package changes; no data generated.

---

## Verification

- `lint` clean · `test` green (447) incl. new `PrimaryCaseCard` (tiered) +
  `ViewerNotes` (honest-framing) contract tests; existing `whyForYou` contract still
  passes.
- Authenticated `/movie` e2e (recommendations poster → `/movie`, watchlist Save,
  `/home` + `/movie` a11y) run locally. Film File is **not** visual-baseline tested
  (only `/` + `/about` are).

---

## Intentionally not touched / follow-ups

- **Discover** also surfaces a generated `critic_quotes[0]` — out of F6B scope; it
  could get the same honest reframe in a later Discover pass.
- **F6C (gated, later):** extend `generate-movie-overlay` to produce a richer
  `why_for_you` for non-curated films (Edge Function + prompt + honesty guards) — via
  the `supabase-change` skill, after F8's recommendation-trust/eval work.
- A per-film `release_timeline` overlay column could retire the Parasite timeline
  sample — later, not F6B.
</content>
