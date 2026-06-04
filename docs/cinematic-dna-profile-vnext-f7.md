# FeelFlick — Cinematic DNA / Profile vNext (F7 Decision Note)

> Phase F7 of the rebuild. Makes `/profile` (Cinematic DNA) feel like a meaningful,
> *honest* taste identity that builds trust in the Tonight pick — **UX + copy only,
> existing data only**. No engine/scoring, no `dnaConfidence` formula change, no
> schema/Edge/auth/route changes. Read alongside
> [product-doctrine.md](product-doctrine.md).
>
> **Date:** 2026-06-03 · **Status:** implemented in F7.

---

## 1. Current Profile problem

The Profile was rich and live (history/ratings/fingerprint/editorial-summary/
similarity), and the `derive.js` layer was already honest (real values or `[]`/
`null`). But the **cold-state fabricated taste** via static `data.js` fallbacks, and
the **DNA-confidence number was unexplained**:

1. **Masthead** showed `USER_DEFAULT.summary` ("Patient, class-coded thrillers… slow
   burns and one-night two-handers") + `signature` ("Films that earn their
   silences.") for users with no history — a **specific fabricated taste** for
   someone who hasn't earned one.
2. **Skew** ("How you skew · Vs everyone else") fell back to invented bars
   ("Darker — you 73 vs them 50") labeled only "sample values" — a fabricated
   **"people like you"** comparison.
3. **YIR banner** fell back to "You binged 18 films in December… You leaned in after
   Past Lives" for users with no such history — a **fabricated year-in-review**.
4. **DNA confidence** rendered as a bare 4th big number ("78% · high") next to film
   counts — readable as an accuracy score or a grade on the user, with no
   explanation of what it means or how to improve it.

These violate the doctrine's "no fake taste insights / no fake social proof / no
unsupported people-like-you claims."

## 2. Product-doctrine constraint

The wedge: *one justified nightly pick that makes its case.* The Profile is the
"house" behind the mood-first door — it must make taste **visible and trusted**, be
**honest** when evidence is thin, and **support** (not compete with) Tonight. F2
keeps it a *supporting* surface.

## 3. What F7 changes

1. **Removed the three cold-state fabrications:**
   - `data.js` `USER_DEFAULT.summary`/`signature` → **honest "still forming"** copy
     ("Your Cinematic DNA is still forming. Log and rate a few films…" / "Your taste,
     taking shape."). This also fixes the `ShareCard` cold-state (it shared the
     fallback).
   - **Skew** now self-hides when there's neither a real per-user comparison nor a
     real community-mood signal; the fake `SKEWS` sample is removed. When only the
     real `communityMood` exists, it shows that + an honest "comparison lands here"
     line — never invented bars.
   - **YIR banner** self-hides when there's no live year-in-review *and* no real
     this-month watch count; the fake `YIR` sample is removed.
   - The fabricated `SKEWS`/`YIR` exports are deleted from `data.js`.
2. **New `DnaConfidence` section ([src/features/profile/DnaConfidence.jsx](../src/features/profile/DnaConfidence.jsx))** —
   the honest framing of the confidence number, **self-only** (a viewer can't improve
   someone else's profile). It explains the number as **taste evidence** (not a score
   of you, not accuracy), shows what it's built from (logged · rated · mood signals),
   adapts cold/warm ("Still learning" with a Tonight CTA / "Getting sharper" /
   "Reading you well"), and connects to the ritual ("what FeelFlick weighs when it
   chooses your one film each night"). The bare confidence stat was **removed from
   `QuickStats`** (now 3 plain counts) so the number lives in one explained place.

## 4. What F7 intentionally does NOT change

- **No `dnaConfidence` formula change** — `computeDnaConfidence` (shared by `/profile`
  + `/account`) is untouched; the value stays identical across surfaces. F7 only
  *frames* it.
- No engine/scoring/`ENGINE_VERSION`, schema/RLS/migration, Edge Function
  (`generate-taste-summary` flow unchanged), OpenAI prompt, auth, route/IA, or package
  changes. No data generated.
- `/account`'s DNA stat is left as-is (same shared value); a richer framing there is a
  possible follow-up, not F7.
- Real, honest sections kept: `FriendsRanked` (real `user_similarity` twins + honest
  empty state — no fabricated names), `ShareCard` (user-owned), MoodRadar, directors,
  motifs, trajectory, etc. — all already self-hide on empty.

## 5. Cold-state vs warm-state strategy

- **Cold-state:** never fabricate. Show honest "still forming" identity copy, the
  `DnaConfidence` "Still learning · low is normal" guidance + a **"See tonight's pick"**
  CTA (→ `/home`), and let invented Skew/YIR sections self-hide. The page explains
  what's missing and how to improve it (watch / rate / react to Tonight picks).
- **Warm-state:** the real editorial summary/signature/archetype, live mood radar,
  directors/motifs/trajectory, real twins + skew, and "Getting sharper / Reading you
  well" confidence framing — earned, specific, not generic.

## 6. DNA confidence framing

The number is presented as **how much taste evidence FeelFlick has** — explicitly
*not* a score of the user and *not* a measure of accuracy; it grows with watched
films, ratings, preferences, and reactions; low is normal for new users; more
evidence → a more *personal* (never "more correct") nightly pick. No "accuracy",
"guarantee", or "%-accurate" language. Uncertainty is shown, not hidden.

## 7. Data contracts preserved

- `/profile` + `/profile/:userId` routes, public/other-user vs self behavior, the
  `useProfileData` fetch flow, the `generate-taste-summary` regen, follow behavior,
  share-card behavior, and the shared `dnaConfidence` value (consistent across
  `/profile` + `/account`) — all unchanged.
- `DnaConfidence` reads existing derived values (`stats.dnaConfidence`,
  `stats.filmsLogged/filmsRated`, `moods.length`) — computes nothing new.

## 8. Validation checklist

- [x] No fabricated taste/summary/skew/YIR shown for cold-start users.
- [x] DNA confidence explained as evidence (not accuracy/guarantee); cold + warm copy.
- [x] Confidence value identical across `/profile` + `/account` (formula untouched).
- [x] Real sections still render; honest empties preserved; no fake social proof.
- [x] `/profile` a11y clean (0 non-contrast serious/critical); reduced-motion intact.
- [x] `lint → test → build` green.

## 9. Known follow-ups (F8 / future)

- **F8 (recommendation trust/eval):** if/when FeelFlick measures recommendation
  *accuracy*, the confidence framing could add an accuracy signal — but only once it's
  real (engine work, gated).
- A `/account` DNA-stat framing pass (mirror the `/profile` explanation).
- People/social depth (taste-twin surfaces) is a post-scale moat — out of F7.
</content>
