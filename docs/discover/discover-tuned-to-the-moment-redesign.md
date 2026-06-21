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

---

## Visual-fidelity correction (post-merge corrective PR)

PR #331 (squash `9d82bb3e`) was **functionally correct** — the flow, direction
builder, finite session, genuine-exposure impressions, placement attribution and
fallback honesty all shipped — but it **materially diverged from the locked
prototype** `feelflick-discover-refined-cinematic-result`. This corrective pass
restores the approved cinematic composition **while preserving all of that
behaviour** (the behavioural files are unchanged).

The attached prototype is the **binding composition authority**. Visual baselines
for this work were **approved only after external, same-viewport side-by-side
screenshot inspection** — locked-reference work must not treat self-generated
baselines as the sole fidelity evidence.

### Corrected visual differences
- **Mood**: open borderless field (the bordered 16:9 canvas removed), centred
  constellation identity, full-page starfield removed, no visible selected-mood
  card grid (descriptions are screen-reader-accessible), cinematic heading scale.
- **Context**: one integrated card with a tinted constellation hero + live sentence
  (was four standalone accordion cards).
- **Result**: full-bleed blurred backdrop + masked poster artwork + restrained
  scrims/grain; oversized lower-left title; visible moment-fit reason; compact
  rounded-rectangle controls (pills only for chips/options).
- **Dock**: translucent dock attached to the result bottom; active card quieter;
  horizontal scroll on mobile. The result copy is **bottom-anchored** above the
  dock; the full dock fits the header-aware content viewport at normal desktop
  heights; the floating mid-stage footer was removed (Adjust → chip row, Start over
  → dock tool / a bottom-anchored control on lead-only).
- **Mobile**: artwork-first hierarchy; primary Find precedes Back with the helper
  above; BottomNav-safe context actions; stage-aware audio toggle (top-right on the
  result) so it never collides with the dock at 320/390.
- **Short-height (1366×650)**: dock moves into safe normal flow (intentionally
  different from the raw prototype) so it never overlaps title/reason/actions.

### Dock reachability (approved as below-fold content)
On the first mobile viewport the dock may begin below the main actions; the COMPLETE
dock is scrollable clear of the fixed BottomNav, horizontally to the last direction,
with no page horizontal overflow and no audio/dock collision. Covered by new
authenticated visual states (`result-mobile-dock-visible-390/320`,
`result-mobile-last-direction-390/320`, `result-short-dock-visible`) and E2E
reachability assertions. The new scrolled states do **not** create duplicate
impression writes — genuine-visibility dedup (per film+placement) remains
authoritative.

### Accepted intentional deviations
1. Production uses the canonical AppShell/Header/Search/BottomNav, not prototype-local chrome.
2. Selected-mood descriptions are screen-reader-accessible rather than shown as cards.
3. Production shows honest provider state + real action (saving/saved/error) states.
4. Short-height places the dock into normal flow rather than overlapping.
5. Real production film content + artwork differ from prototype fixtures.
6. The first mobile viewport may show the start of the dock below the actions (full dock reachable by scroll).
7. The context accordion begins closed rather than auto-opening the first row.
8. The prototype's unsupported "i" information control is omitted.
9. Start over uses the real production dock-tool treatment.
10. Context option labels + real metadata may differ from the static prototype copy
    (e.g. descriptor chips derive from the catalogue film's mood/tone tags, so the
    same-film comparison shows "Thriller / Tender / Gentle" rather than the
    prototype's "Thriller / Satirical / Tense").

### Rollback boundary
This corrective PR is presentation-only: `discover.css`, the Discover section
components, the container's render structure, and the gradient-guard allow-list,
plus visual/E2E coverage. The protected behavioural files
(`discoverDirections.js`, `discoverSession.js`, `useDiscoverSession.js`,
`useDiscoverImpressions.js`, `useDiscoverResultActions.js`, `useDiscoverData.jsx`,
`recommendations.js`, `betaEvents.js`) are unchanged, so reverting this PR restores
the prior composition without affecting recommendation behaviour, attribution, or data.
