# F10C — Persona Pilot Findings

> **SYNTHETIC PERSONA PILOT — NOT real-user validation.** Two archetype walkthroughs
> (P3 Netflix casual scroller, P1 Letterboxd power user) run against the live landing +
> the actual authenticated-surface code. Every finding is a **hypothesis to validate with
> real testers** (Wave 1+). **No app code changed. F8C stays blocked** — rec-quality
> observations are logged as Insight, never acted on as tuning.

**Status:** ✅ 2-persona pilot complete. **Date:** 2026-06-04. **Engine:** frozen `2.17`.

## Methodology (honest about what was observed)

| Surface | How observed |
|---|---|
| `/` landing (T1, T2) | **LIVE BROWSER** (localhost dev build = main code) — copy quoted is real, captured from the DOM |
| Onboarding, Briefing/WhyThisPick, Film File/PrimaryCaseCard/ViewerNotes, Profile/DnaConfidence (T3–T8) | **CODE-GROUNDED** — reactions cite the *actual component copy* read from source (`src/features/...`). The authenticated UI was **not** live-walked under a real session in this pilot (real testers use Google OAuth — the live authenticated walk is deferred to Wave 1's per-tester smoke). |
| T9–T10 | persona judgment over the above |

> Tasks relying on a *real recommendation for a real account* (does the actual pick fit?) are
> marked **NOT OBSERVED** — they need a live session + real history, i.e. real testers.

---

## Pilot A — P3 "Scroller" (Netflix casual scroller)

*Success criteria: opened FeelFlick, got a pick, watched it — no scrolling. Tolerances: foreign/subtitles/slow ★. Patience: low.*

| Task | Persona reaction (in character) | Product note |
|---|---|---|
| **T1 clarity** | "Landing says **'Films that know you.'** then **'You spent 23 minutes picking. You watched thirty.'** — ok, that's literally me. **'Not three options. One pick…'** — yes, I want that." | ✅ Strong wedge read; the anti-scroll hook is this persona's exact pain. |
| **T2 sign-in** | "It wants me to **'Start free →'** with Google before I see a pick. Pricing says **'$0 · One price. No tiers.'** Fine, free + Google is one tap — but I'm mildly annoyed I can't see *a* pick first." | ⚠️ Value-gated behind sign-in+onboarding. Low-friction (Google, $0) but a real drop-off risk for impatient users — **validate the funnel**. |
| **T3 onboarding** | "**'Three short questions. One film.'** — ok, short, I can do three." *(code-grounded: onboarding seeds a few loved films.)* | ✅ The "three questions" promise fits low patience. (Live flow NOT live-walked.) |
| **T4 pick fit** | "I want the pick to feel right immediately and **not** be some subtitled art film." | **NOT OBSERVED** — needs a real session/history. Insight: this persona's ★ foreign/slow tolerance means the quality-gated engine could surface something too niche for night 1. |
| **T5 why → decide** | "On a brand-new account the pick shows its slot + synopsis but **no 'Why this pick'** line." *(WhyThisPick is null-safe — renders nothing when there's no grounded reason.)* | ⚠️ **Insight:** honest-by-design, but a cold scroller gets a pick with no visible justification on night 1 — less persuasive exactly when trust is lowest. |
| **T6 Film File** | "If I bother opening it, the match shows **'NN% · match · how it fits your taste so far'** — that hedge is reassuring, not hypey." | ✅ Honest match gloss lands well even for a casual user. (Low patience may mean they never open it.) |
| **T7 DNA** | "Profile says **'Still learning'** and **'taste evidence… not a score of you.'** I don't really care about DNA, but it's not lying to me." | ✅ Honest; not a draw for this persona but not a turn-off. |
| **T8 anti-scroll** | "After the pick, is there a wall of rows tempting me back into scrolling?" | ⚠️ **Insight/anti-drift watch:** the `/home` supporting tail (carousels) must stay visibly secondary to the Briefing or it re-creates the Netflix grid for this exact persona. Verify live. |
| **T9 return** | "If tonight's one pick is good and I skip the 23-minute scroll, yeah I'd come back." | ✅ Return hinges on pick quality (real-user dependent). |
| **T10 abandon** | "If the pick is a slow foreign film I've never heard of, or setup takes too long, I'm out." | Insight (F8C-relevant) + the sign-in/onboarding funnel. |

**P3 scorecard** *(methodology: live landing + code-grounded auth)*

```
D1  First-10s clarity        5/5  "You spent 23 minutes picking. You watched thirty." = exact pain
D2  Onboarding friction      3/5  "Three short questions" good; but value gated behind sign-in (not live-walked)
D3  Trust in Tonight pick    NOT OBSERVED (needs real session)
D4  "Why this pick" quality  2/5  cold-start shows NO why (null-safe) — unjustified pick when trust lowest
D5  Film File case-making    4/5  honest match gloss "how it fits your taste so far"; may not be opened
D6  DNA honesty              4/5  "taste evidence… not a score of you" — honest, low interest for this persona
D7  Anti-scroll strength     3/5  single-pick framing strong; supporting-tail carousels are a re-scroll risk (verify)
D8  Perceived personalization NOT OBSERVED (needs real pick)
D9  Emotional resonance      4/5  the "23 minutes" line creates real recognition/relief
D10 Task completion          3/5  core path plausible; gated on onboarding completing (not live-walked)
D11 Confusion points         4/5  copy is clear; only the no-why cold pick is a soft confusion
D12 Switching likelihood     3/5  "I'd try it instead of scrolling — if the first pick lands"
D13 Return likelihood        3/5  conditional on real pick quality
```

---

## Pilot B — P1 "Diarist" (Letterboxd power user)

*Success criteria: a pick that earns "huh, good call" + a deep cut he hasn't seen. Tolerances: all ★★★★★. Distrusts popularity-driven recs; respects honesty.*

| Task | Persona reaction (in character) | Product note |
|---|---|---|
| **T1 clarity** | "**'Films that know you'** — bold claim, I'm skeptical. But **'Not three options. One pick, with the article that makes its case'** — *that* I respect. And **'The engine has a voice. M. reads your taste…'** is a nice touch." | ✅ The case-making framing speaks directly to a cinephile; the "knows you" claim invites scrutiny (good — he'll test it). |
| **T2 sign-in** | "Sign in with Google, fine. But **can I bring my Letterboxd history?** I have thousands of logged films — I don't want to rebuild my taste from three questions." | ⚠️ **Insight (cross-persona):** no diary/Trakt/Letterboxd import → a deep cinephile starts *cold*, which underrepresents him. The wedge's "taste-deep" promise is hardest to feel for imported-taste users on night 1. |
| **T3 onboarding** | "**'Three short questions. One film.'** — three questions cannot represent my taste. I'll do it, but my night-1 DNA will be a caricature." | ⚠️ Insight: cold-start seeding is thin for power users (mirror image of P3's "three is fine"). |
| **T4 pick fit** | "Show me a pick that names a *real* seed I love and isn't just Letterboxd-popular." | **NOT OBSERVED** — needs his real history. This is the make-or-break for P1/P14. |
| **T5 why → decide** | "The 'why' format is **'Because you loved {X}'** — if {X} is genuinely one of mine, I'm sold; if it's generic **'Picked for you'**, I bounce. Good that it shows **nothing** rather than faking a reason." | ✅ The null-safe WhyThisPick (no fabricated reason) earns cinephile trust — *honesty over persuasion* is the right call for this persona. |
| **T6 Film File** | "**'FeelFlick's read'** as an editorial hook, and Viewer notes say **'Illustrative impressions FeelFlick generated… not real reviews or quotes from real critics.'** — I *respect* that they don't fake critic quotes. That's rare." | ✅ **Standout win.** The honest reframe directly disarms the anti-slop distrust; no fabricated authority. |
| **T7 DNA** | "**'taste evidence… not a score of you, and not a measure of accuracy'** — correct framing. But on a fresh account it says **'Still learning'**, which, again, underrates me because it has no import." | ✅ Honest framing respected; ⚠️ undercut by the cold-start import gap. |
| **T8 anti-scroll / diary** | "Where's my **diary / lists**? I live in Letterboxd's log." *(Lists exist but as editorial seasoning, not a logging home base — by doctrine.)* | ✅ **Working as intended** (not-a-Letterboxd-clone). Insight: set expectations in copy so power users aren't confused that logging is substrate, not the front door. |
| **T9 return** | "If it surfaces deep cuts that fit my taste and never repeats, I'd keep a nightly habit alongside Letterboxd." | ✅ Return hinges on specificity + non-repetition (real-user dependent; P16 territory). |
| **T10 abandon** | "One mainstream/popularity-driven pick, one fabricated claim, or making me rebuild my whole taste here — and I'm gone." | Insight (F8C honesty/quality) + the import gap. |

**P1 scorecard** *(methodology: live landing + code-grounded auth)*

```
D1  First-10s clarity        4/5  "the article that makes its case" resonates; "knows you" invites (healthy) skepticism
D2  Onboarding friction      2/5  no Letterboxd/Trakt import → deep taste starts cold; "three questions" underrepresents
D3  Trust in Tonight pick    NOT OBSERVED (needs his real history)
D4  "Why this pick" quality  4/5  "Because you loved {seed}" is the right shape; null-safe (no fake why) earns trust
D5  Film File case-making    5/5  "FeelFlick's read" + "…not real reviews or quotes from real critics" = honest, rare, respected
D6  DNA honesty              5/5  "taste evidence… not a score of you, and not a measure of accuracy" — exactly right
D7  Anti-scroll strength     4/5  single justified pick is the anti-grid he wants; diary-as-substrate may confuse at first
D8  Perceived personalization NOT OBSERVED (needs real seeds)
D9  Emotional resonance      3/5  intrigued + skeptical; resonance depends on the first real pick
D10 Task completion          3/5  completes, but starts cold without import
D11 Confusion points         4/5  main confusion: "where's my diary/lists" (expectation, not a bug)
D12 Switching likelihood     3/5  "alongside Letterboxd, not instead — until it proves taste"
D13 Return likelihood        4/5  high IF picks are specific + non-repeating + honest
```

---

## Cross-persona patterns (the signal)

1. **🔶 Cold-start re-seeding is the shared pinch point — from both ends.** The scroller has *low patience* for onboarding; the cinephile finds *three questions too thin* and wants to import an existing diary. Both start cold, and the "taste-deep" promise is weakest on night 1. **Highest-value Insight** (also hits P5 Trakt, P14 anti-slop, P15 cold-start). → a real-user question: how much taste can we earn *fast* (or import) before the first pick?
2. **🔶 Cold-start Briefing shows no "why" (by honest design).** WhyThisPick is null-safe — correct for honesty, but a brand-new user's first pick can look unjustified exactly when trust is lowest. Worth a *future* copy decision (an honest "still learning your taste — here's a starting pick" line vs. nothing) — **not** an engine change.
3. **✅ The honesty layer is a genuine, differentiating strength.** WhyThisPick never fabricates; ViewerNotes says "not real reviews"; DnaConfidence says "not a score of you." This directly disarms the distrust of the most skeptical archetypes (P1, P10, P14). Protect it.
4. **🔶 Anti-drift watch: the `/home` supporting tail.** For the scroller, carousels below the Briefing risk re-creating the grid. Verify the Briefing stays visibly primary in a live session.
5. **🔶 Scope-honesty gaps** (no where-to-watch P4, no library P8, no diary-import P1) are *by doctrine* — the question is whether the app says "not yet" gracefully in copy. Verify.

## Issue backlog (synthetic — validate with real users; none are F8C tuning)

| ID | Severity | Issue | Personas | Note |
|---|---|---|---|---|
| F10C-1 | **Insight (high)** | Cold-start re-seeding underrepresents users with deep external taste; no import path → warm users start cold | P1, P5, P14, P15 | Product/strategy, not engine. Validate the night-1 value gap with real testers. |
| F10C-2 | **Insight / P2** | Cold-start Briefing renders no "Why this pick" (null-safe) → first pick can feel unjustified | P3, P15 | Honest by design; consider an honest cold-state line (future UI phase, not F10C). |
| F10C-3 | **P2** | Value (the pick) is gated behind Google sign-in + onboarding; impatient archetypes may drop | P3, P7, P9 | Mitigated by $0 + "three questions"; measure real funnel drop-off. |
| F10C-4 | **Insight (anti-drift)** | `/home` supporting-tail carousels risk re-introducing scroll | P3, P7 | Verify Briefing-primacy live; keep tail subordinate (doctrine). |
| F10C-5 | **Insight** | Scope gaps (where-to-watch, library, diary import) need graceful "not yet" copy | P4, P8, P1 | By doctrine out-of-scope; it's a copy/expectation issue. |
| — | **Win** | Honesty layer (no fabricated why/reviews/score) is a real trust differentiator | P1, P10, P14 | Protect in all future changes. |

## What should be validated with real users (Wave 1+)

- Does a **real** night-1 pick (real history) actually fit — for both a casual and a cinephile? (D3/D8 — NOT OBSERVED here.)
- The **sign-in → onboarding → first-pick funnel** drop-off for impatient users (F10C-3).
- Whether the **cold-start no-why** pick reads as honest or as unjustified to a real new user (F10C-2).
- Whether the **`/home` tail** keeps the Briefing primary in real use, or invites scrolling (F10C-4).
- Whether power users feel the **import gap** as a deal-breaker (F10C-1).

> Reminder: these are **synthetic-persona hypotheses**, not validation. They prioritize what to
> watch for when real testers arrive — and they do **not** unblock F8C.
