# Discover — "Tuned to the moment" redesign

Status: implemented on `feat/discover-locked-redesign` (PR open, unmerged).
Design system: Adaptive Editorial Cinema (ADR 021) — Inter only, flat near-black
Ink canvas, neutral ivory primary actions, coral signature sparingly. Mood colour
is a **local accent only** (constellation, atmosphere, explanation rule, active
direction border) — never a theme.

## Product role
Shape the moment → receive **one confident film, with two meaningful directions
held quietly in reserve.** Distinct from Home (Made for you — long-term taste) and
Browse (Yours to explore — an explicitly chosen territory). Discover starts from
mood, intention, time, company and present energy. Bounded, finite, never a feed.

## Stage model
`Mood (1) → Context (2) → Resolve (2.3) → Result (3)` (kill-switch → Paused).
Onboarding hand-off preserved: a first visit from onboarding seeds up to three
moods from the baseline (the cosmetic fade overlay was dropped — intentional
deviation; the functional seeding is intact).

## Role vs Focus (kept strictly separate)
- **Role** = the semantic slot a film occupies: `closest` / `gentler` / `bolder`.
  Roles recompute ONLY when the visible set genuinely changes (Not tonight,
  Already watched, a reserve refill, or changed inputs).
- **Focus** = which exposed film is on the cinematic stage now. Selecting an
  alternate changes focus, not role; it logs no new impression.

## Direction-builder semantics + named thresholds
`buildDiscoverDirections` (pure, deterministic) assigns roles over the canonical
ranked pool. All deltas are on **normalized 0–1 axes** (raw `llm_*` /
`discovery_potential` / `polarization_score` are 0–100 ÷ 100; `_rankScore` is used
only for ordering/tie-breaks, never as a delta magnitude).

- **Closest** = highest `_rankScore` clearing `TOP_MOOD_FIT_FLOOR = 0.35`.
- **Gentler** = an eligible alternate whose composite *pressure* index
  (mean of `llm_intensity`, `llm_attention_demand`, `llm_emotional_depth`,
  `llm_pacing`) is **≥ `MIN_GENTLER_DELTA = 0.12`** below the lead, and does not
  spike any single pressure axis beyond `PRESSURE_AXIS_SLACK = 0.08`.
- **Bolder** = an eligible alternate whose composite *novelty* index
  (mean of `discovery_potential`, `polarization_score`, language-unfamiliarity)
  is **≥ `MIN_BOLDER_DELTA = 0.12`** above the lead.
- **Eligibility (every alternate):** preserves a selected mood at
  `PRIMARY_MOOD_PRESERVE = 0.30`; overall moment fit ≥ `MIN_MOMENT_FIT = 0.25`;
  moment fit within `MAX_FIT_DROP = 0.20` of the lead; unique film.
- **Tie-break:** larger honest delta → closer moment fit → engine rank → stable id.
- `DELTA_EPS = 1e-6` makes an exactly-on-threshold delta inclusive (boundary-stable).
- **No valid role → render fewer.** Thresholds are never weakened to fill a slot.

## Canonical ranking pipeline (single source of truth)
1. score the candidate pool (`scoreMovieForUser` + the moment's mood/intention/
   energy/time modifiers) → `_rankScore` + `moodFitRaw`;
2. demote films already shown earlier this visit (`diversifyTop3` session penalty);
3. → stable ranked pool;
4. `buildDiscoverDirections` derives Closest/Gentler/Bolder from that pool;
5. the same unseen pool feeds bounded reserve introduction.
`diversifyTop3` orders + demotes; it never independently assigns the visible roles.

## Finite-session contract
- `MAX_SESSION_FILMS = 7` unique films exposed per session (lead + 2 directions +
  ≤4 reserves). Never surfaced as queue depth.
- **Skip/watch the Closest** → promote the strongest remaining qualified film
  (placement `discover_promoted_lead`), recompute Gentler/Bolder relative to the
  new lead.
- **Skip/watch an alternate** → keep the Closest, refill ONLY the vacated role
  from the unseen pool, return focus to the Closest. No unrelated promotion.
- A dismissed/watched film never returns in the same session.
- **Two honest terminations:** `pool` ("Nothing left in this shortlist.") vs `cap`
  ("That's enough directions for one decision."). Tracked + tested.
- Changed inputs start a fresh session; **Start over** clears it (moods +
  context reset); **Adjust tonight** returns to context preserving moods + values.

## Analytics + attribution (no DB migration)
Source-of-truth split:
- **`recommendation_impressions`** (via `logSurfaceImpressions`) — DAILY impression
  rows, deduped on `(user, movie, placement, shown_date)`. Distinct placement per
  role: `discover_lead` / `discover_gentler` / `discover_bolder` /
  `discover_promoted_lead`. NOT per-session.
- **`user_interactions`** (via `trackInteraction`, carries `session_id`) —
  PER-SESSION exposure + outcomes, with `direction` + `placement` in metadata.
- **PostHog funnel** (via `trackEvent`) — additive `direction` / `exhaustion_reason`
  / `promotion_reason` keys (added to the betaEvents allow-list; reuses existing
  event names; no PII).
- **Genuine exposure:** `useDiscoverImpressions` logs each `(film, placement)` once
  per session; switching focus logs nothing; promotions/reserves log on first
  appearance; dock cards log via IntersectionObserver (offscreen mobile cards log
  only when scrolled to); **fallback mode logs nothing**.
- **Outcome attribution:** `updateImpression(user, movie, action, { placement })`
  constrains the flag update to the focused film's placement row — an action can
  never mis-credit another direction/session/surface. Existing callers (no
  placement) keep the legacy most-recent behaviour.

## Honesty
- No match %, no "perfect for you", no fabricated reasons. The displayed
  explanation = an always-present **moment-fit** line + a **personal** line only
  when a real filmmaker-affinity signal exists (`buildPersonalSignal` → null
  otherwise; ALWAYS null in fallback). Mobile keeps the moment-fit line visible;
  the personal line sits behind a "Why this film for you?" disclosure.
- Inferred metadata uses relative-delta language ("asks for less attention").
- **Fallback** (`live_error`/`live_empty`/`filtered_empty`): labelled "Example
  pick…"; no personal Because-line, no twin/diary/critic notes, no live
  impression/outcome writes, lead-only (example data lacks `llm_*` so no honest
  directions). Save/Watched/Not-tonight hidden (example ids aren't real rows).
- **Streaming**: found / no-data / could-not-check states; missing ≠ unavailable;
  never a Closest/Gentler/Bolder criterion.

## Context defaults
Reuse `predictDiscoverDefaults` only (validated heuristic from primary mood +
avg runtime + hour, blended with learned `user_discover_preferences` ≥3 commits).
Neutral defaults when no signal. Presented as an editable starting point — no
confidence %, no "you are tired/alone/wired" claims. Per-row accordion editor
(one group open at a time).

## Result hierarchy / dock
Lead dominates (full cinematic split). The dock shows the roles; the focused card
is a quiet "Now showing" marker while the two alternates are the prominent choices.
Desktop: dock below the lead, never covering title/reason/actions; short-height
(1366×650) flows normally. Mobile: title/reason/actions reachable before the dock;
dock horizontally scrolls (the page never does), clears BottomNav via safe-area;
operable at 320px.

## Visuals
Flat Ink canvas; neutral ivory primary actions (replacing the old `ROSE_DEEP`);
deep-purple `HP.bgDeep` retired. Deterministic, reduced-motion-aware starfield
(seeded PRNG → stable baselines) + deterministic mood bursts. Audio stays opt-in,
default muted, persisted, never autoplays.

## Component architecture
`DiscoverMoodStage` (`MoodConstellation`, `SelectedMoodSummary`, `DiscoverProgress`)
· `DiscoverContextStage` (`ContextEditor`) · `DiscoverResolveStage` ·
`DiscoverResultStage` (`DiscoverLeadFilm`, `DiscoverReason`, `DiscoverContextChips`,
`DiscoverDirectionDock`, `DiscoverDirectionCard`, `DiscoverExhaustedState`) ·
hooks `useDiscoverSession`, `useDiscoverImpressions`, evolved
`useDiscoverResultActions` · pure `discoverDirections`, `discoverSession`,
`resultPresentation`. Reuses `TrailerModal` (focus hardened — synchronous close
focus removes the prior timing flake), `StreamingChip`, `useStreamingProvider`,
`useDiscoverData`, `derive`. AppShell/Header/SearchBar/AvatarMenu/BottomNav reused
(Discover renders none of its own chrome). Old `StageMood/StageNightContext/
StageResolve/StagePick` removed.

## Preserved contracts
Onboarding mood seeding; `useDiscoverData` candidate fetch + exclusions +
`classifyDiscoverDataSource`; `predictDiscoverDefaults`; real save/watched/skip/
Film File writes; trailer; default-muted audio; bounded internal reserve; honest
loading/error/empty; one `<h1>` per stage; single polite live region (no queue
depth announced).

## Intentional deviations from the prototype
Honest direction semantics via real fields (not ordinal labels); the cosmetic
onboarding fade overlay removed (functional seeding kept); no match %; no fake
provider/diary/critic data; fallback is lead-only example; foundation visual
migration (no purple theme).

## Known limitations / follow-ups
- "Underexplored era" and richer personal evidence (recurring genre/language,
  embedding similarity) are not yet surfaced as explanation layers.
- Fallback example data cannot produce Gentler/Bolder (no `llm_*`) — lead-only by
  design.
- Per-session direction exposure lives in `user_interactions` + the Discover
  session id in metadata; the daily `recommendation_impressions` table remains
  daily-deduped (no schema change in this PR).
- Authenticated e2e + visual baselines are CI-generated (the route is auth-gated;
  no anonymous local path).
