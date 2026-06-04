# FeelFlick — Landing + Onboarding vNext (F4 Decision Note)

> Phase F4 of the rebuild. Sharpens the **first impression** (landing) and the
> **first-session journey** (onboarding) — without touching the recommendation
> engine, routes/IA, or auth. Read alongside [product-doctrine.md](product-doctrine.md)
> and [product-research-patterns.md](product-research-patterns.md).
>
> **Date:** 2026-06-03 · **Status:** implemented in F4.

---

## Going in: both surfaces were already strong

F4 inspection found the landing and onboarding in good shape — so this phase is
**surgical**, not a redesign:
- **Landing** already maps to the wedge (Problem → Ritual → Film File → Briefing →
  DNA → Community → Letter → Pricing → CTA), Pricing is honest ("Free. Forever. ·
  $0 · no ads/upsells"), and the Hero uses the approved copy. Illustrative mockups
  (Briefing, TheProblem) are already labeled "An example issue · What yours might
  look like."
- **Onboarding** is a polished 4-step flow (Mood → Genres → Films → Rate) with
  draft persistence, a mood-reactive celebration, reduced-motion + dyslexia-aware
  copy, safe per-card skips, and a thoughtful cold-start coaching beat.

So F4 (a) lands the long-parked landing-reusability work, and (b) tightens trust
copy + adds "why we ask" framing — nothing more.

---

## 1. Landing — what changed

### Primitive adoption (from the parked stash — see §4)
The landing sections now reuse three shared primitives instead of hand-rolling
them inline (DRY; completes the Eyebrow rollout on the landing):
- **`Eyebrow`** — the canonical kicker (landing flavor: Outfit 600), replacing
  ~dozens of `<div className="ff-eyebrow">`.
- **`AuthCTA`** — the brand-gradient sign-in pill (Header, Hero, Pricing, FinalCTA),
  one source for the gradient/radius/weight + loading treatment.
- **`Wordmark`** — the `FEELFLICK` lockup (Header + Footer).
- **`useInView`** — the shared IntersectionObserver behind `Reveal` (replaces the
  hand-rolled observer).

**Intentional visual deltas** (documented; require visual re-baselining — §5):
- The wordmark moves to **Outfit 600 + positive 0.04em tracking** (was Inter,
  −0.012em) — a small-caps logo reads better with air between glyphs.
- The header "Sign in" becomes a **ghost/outline pill** paired with the filled
  "Start free" CTA (primary + secondary set), and the scrolled header background
  opacity eases from 0.92 → 0.8.
- A subtle arrow-slide on CTA hover (`.ff-cta-arrow`).
These are render-faithful elsewhere (same shapes/labels) — the approved copy
("Films that know you.", "Start free →", "The right film. Right now.") is unchanged.

### Trust / honesty
- **Community (taste twins):** the example cards (named people + activity) were
  labeled "Example taste twins · What yours might look like." Tightened to
  **"Illustrative · Taste twins grow richer as FeelFlick does"** so they can't read
  as real members/activity, and so the framing matches the doctrine's *parked,
  compounds-with-scale* status of the People feature. **No fabricated counts or
  testimonials anywhere.**

What was deliberately **left honest/unchanged:** Pricing (already truthful), Hero
(approved copy), Briefing/TheProblem (already labeled illustrative). No streaming-
availability claims; no "perfect recommendation" claims.

---

## 2. Onboarding — what changed (copy only; flow/schema untouched)

"Why we ask" / value-before-commitment microcopy, to reduce the interrogation
feeling and frame each step as building toward a better first pick:
- **Genres step:** "Pick at least 1. You can always add more later." →
  "Pick at least 1 — **this steers what we reach for first.** Nothing's locked in;
  you can always add more later."
- **Films step:** "Pick 5 films that shaped your taste." → "…**These anchor your
  first picks — so go honest, not impressive.**" (frames the heaviest ask as the
  payoff lever; relieves "perform good taste" pressure).
- **Rate step (all-rated state):** "Tap the button below to lock it in and head
  home." → "**That's all of them. Building your first picks…**" — fixes a copy bug
  (the referenced button is hidden in that state and the flow auto-advances) and
  frames the transition as intentional.

**Not changed (deliberately):** step structure, the enforced minimums (1 mood /
1 genre / 5 films — they feed cold-start scoring), the celebration reveal, and the
completion → `/discover` handoff (a documented cold-start choice: `/home` needs
history to feel personal). Auth gate, onboarding-completion schema, and DB
contracts are untouched.

---

## 3. Tests

- **`src/features/landing/__tests__/primitives.test.jsx`** (new) — AuthCTA fires
  onClick / disables + swaps label when loading; Wordmark renders `FEELFLICK`;
  Eyebrow renders its label. (`Reveal` not rendered — jsdom lacks IntersectionObserver;
  it's covered by the visual baseline.)
- **`e2e/public/landing.e2e.js`** (added) — asserts the taste-twins section carries
  an **"Illustrative"** label (guards "no fake social proof"). Existing landing e2e
  ("Films that know" + "Start free") still passes (copy preserved).
- Existing onboarding tests use isolated footer stubs → unaffected by the copy edits.

---

## 4. Parked stash `stash@{0}` — APPLIED (landing portion), left intact

- **Applied** on the F4 branch via `git stash apply` (not `pop`, so it's preserved
  until the F4 commit is safely created). **Adopted:** the landing files
  (`landing.css`, `primitives.jsx`, all 12 landing sections) + the new
  `src/shared/hooks/useInView.js`.
- **Excluded:** `src/features/movie/sections-top.jsx` and
  `src/features/profile/sections-top.jsx` (the stash's Eyebrow rollout to
  movie/profile) — out of F4 scope; reverted to HEAD after apply. They belong to a
  future movie/profile phase (F6/F7).
- **`useInView.js` adopted:** yes (drives the landing `Reveal`).
- The stash remains in the stash list (not dropped) until the commit lands.

---

## 5. Visual / e2e status & remaining gaps

- **Playwright runs locally here** (Chromium installed). The landing **darwin**
  visual baseline was regenerated deliberately (`npm run test:visual:update`) after
  verifying the rendered page (the only changes are the documented wordmark /
  ghost-pill / Community-label deltas — no layout breakage).
- **Public landing e2e** (`e2e/public/landing.e2e.js`) was run locally and passes.

### Linux baseline — status (updated in F4.1, "Visual Baseline Parity")

The **Linux** landing baseline
(`e2e/visual/landing.visual.js-snapshots/landing-fullpage-visual-linux.png`) is
still pre-F4 and **must be regenerated before the F4 PR's visual gate passes on
`ubuntu-latest`**. F4.1 confirmed it **cannot be produced in this local dev env**
(Docker is not installed, and baselines are platform-specific), so it goes through
the repo's CI flow — see the **exact 3-step `git push … visual-baselines/f4-landing`
+ fetch + commit recipe in `PLANNING.md` → Blocked**. The darwin baseline is correct
and the local `npm run test:visual` gate is green; the Linux PNG is the only gap.
(F9 owns the full visual/a11y gate.)
