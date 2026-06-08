# `/discover` — Private-Beta Readiness (F3.12)

**Status:** READY FOR PRIVATE/BETA TESTING — no P0, no functional P1 blocker.
**Not yet:** public-production readiness (pending a real intercepted-backend e2e — see Deferred).
**Date:** 2026-06 · supersedes nothing; closes the F3.2–F3.12 `/discover` redesign arc.

This note records the final state of the redesigned `/discover` journey after F3.2–F3.12, the F3.11 production-readiness verdict, and the trust + accessibility posture for inviting private-beta testers.

## Final journey

1. **MoodStage** — the front door. Direct visits start with **no mood selected**; arriving from onboarding seeds the mapped baseline moods only (deduped, order-preserved, **max 3**). `Continue` is gated on ≥1 mood. No hero, no "Surprise Me".
2. **StageNightContext** — a **summary-first** view of the predicted context (intention / time / who / energy). The primary CTA `Find my film →` is available immediately; all editing is behind one optional **Adjust details** disclosure. The Discover preference is written **only** when the user explicitly accepts via `Find my film` (`commitDiscoverPreferences`, `onConflict: 'user_id'`).
3. **StageResolve** — one short, honest transition: **900ms** normal motion, **0ms** under `prefers-reduced-motion` (immediate result). No progress bar, no "analyzing", no fake AI theatre.
4. **StagePick** — **one** evidence-backed recommendation. No visible alternates, no queue count, no mood/taste percentages, no parallax or infinite poster motion. The ranked list stays internal (`MAX_PICKS = 15`, `hiddenTopIds`) as a controlled **Not tonight** / **Already watched** fallback. An honest **"Why this one"** case (a real `becauseLine` and/or an in-band runtime-fit line) renders only when supportable. Reason-aware fallback labels distinguish `live_ok` / `live_empty` / `filtered_empty` / `live_error`.

## F3.11 verdict

A read-only, multi-dimension audit (journey, trust/data-truth, a11y, mobile, motion/audio, writes, loading/error, testing, architecture), cross-checked against source:

- **Journey:** 16/16 checkpoints PASS.
- **No P0.** No crash, data-loss, secret/raw-error exposure, double-write, lost-data, or broken-primary-action path.
- **No functional P1 blocker** for private beta. The remaining findings are test-coverage breadth and a11y/polish, addressed here (F3.12) or deferred.
- **Public-production is NOT claimed:** the audit and all 203 Discover tests are code-level with mocked Supabase/TMDB/YouTube; there is no live-backend evidence and (until F3.13) no Playwright e2e on `/discover`.

## Data-truth posture

Every user-facing claim is real-source-backed or derived-but-honest:

- Mood labels / context summary — the user's own selections.
- "Because…" line — derived from real mood/affinity signals; **returns null (section omitted) when unsupported**, including in fallback mode. No fabrication.
- Runtime-fit line — shown **only** when the film's runtime is genuinely inside the chosen band (no tolerance).
- Synopsis — real TMDB overview; hidden when absent (never templated).
- Provider — found chip, or quiet honest "Availability not found" / "Availability unavailable"; **never implies the film is unavailable everywhere**.
- Save / Already-watched / Not-tonight — confirmations reflect the real write; **Mark Watched awaits the write before confirming** and surfaces a retryable error on failure (no false "Watched").
- Fallback static films — now **labelled** by reason; the static set is never presented as a fresh live personalization.

## Accessibility posture (after F3.12)

- One polite, atomic `role="status"` live region on the result; reason-aware fallback note carries `role="note"`.
- Actions expose `aria-busy` / `aria-pressed` / disabled with text-named states; trailer dialog has a focus trap + restore + `aria-modal`.
- Decorative grain/vignette/glow + button icons are `aria-hidden`; poster alt is `"{title} poster"`, provider logo alt `"{name} logo"`.
- Touch targets: all result actions ≥44px via `.ff-pick-actions__*`; the **AudioToggle is now 44×44px with an accessible name** (F3.12).
- Heading hierarchy: every stage-3 state now has a single top-level `<h1>` (the exhausted state was promoted from `<h2>` in F3.12).
- Reduced motion is fully respected: the global `@media (prefers-reduced-motion: reduce)` reset neutralizes the ambient starfield / mood-orb / ceremony animations, and StageResolve resolves to 0ms.

## Deferred (not blocking private beta)

- **F3.13 — real e2e + visual coverage for `/discover`** (intercepted backend, **no live writes**): happy path + reduced-motion + a fallback state, plus a visual-regression baseline for the four stages (mobile + desktop). **Required before public-production sign-off.**
- **Reducer / state-machine extraction** of `Discover.jsx` — deferred; the numeric-stage + refs are readable and well-tested. Revisit only when a new stage or branch appears.
- **`FILMS_FALLBACK` cleanup** — the static fallback films carry latent `criticLine` / `twin` / `arc` fields that are **never rendered** by the current StagePick; harmless, but worth removing/commenting.
- Minor polish: mood-button `aria-label` combining label + hint; `overflow-wrap` hardening for long labels at 360px; lock-tests for `MOOD_BRIDGE` + `FILMS_FALLBACK`.

## Beta safety rules

- **Mocked-data testing only** for automated checks — do not exercise the live authenticated `/discover` route in CI.
- **No destructive resets** — do not reset the dev/test user, do not use `/account` reset, do not run service-role mutations.
- Save / Mark-watched / Not-tonight / Open-Film-File log impressions and write to user tables — **only** trigger them against intercepted/mocked backends in tests, never against a live account during verification.
- No secrets in logs, screenshots, or commits.
