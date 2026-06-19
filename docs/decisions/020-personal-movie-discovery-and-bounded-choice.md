# ADR 020 — Personal Movie Discovery and Bounded-Choice Doctrine

**Status:** Accepted
**Date:** 2026-06-19
**Decided by:** Aditya Kumar (product owner). Supersedes the universal single-pick product framing of the former doctrine; this ADR changes **documentation and product authority only — no runtime behavior, UI, engine, analytics, schema, or test changes.**

> Decision statement:
>
> **FeelFlick is a personal movie discovery platform — "Movies, made personal." It
> helps people discover movies through their taste, their mood, and their curiosity,
> across three complementary discovery modes: Made for you (Home), Tuned to the
> moment (Discover), and Yours to explore (Browse). The product offers the right
> amount of choice — small, relevant, personal, finite selections that make choosing
> easier while leaving the final choice with the user. A prominent singular hero
> recommendation remains permitted, but exactly one visible recommendation is no
> longer a universal product requirement. Anti-scroll remains, redefined around
> bounded, intentional choice rather than a mandatory cardinality of one. Cinematic
> DNA remains a flagship concept and is explicitly living, evolving, evidence-based,
> and correctable — never fixed, deterministic, or infallible.**

Authority: [`product-doctrine.md`](../product-doctrine.md) is the canonical
human-readable doctrine; [`../../.claude/rules/product.md`](../../.claude/rules/product.md)
operationalizes it for repository work and must stay aligned with it.

---

## 1. Status

Accepted. This is a **product-strategy / documentation-authority** decision. It
rewrites the canonical doctrine and aligns the operational rule, the root guide,
the README, the product overview, the docs index, and the persona-feedback skill;
it adds supersession banners to the affected phase records; and it carefully
truth-ups the derived architecture/user-journey docs. It changes **no** runtime
code, UI, recommendation logic, analytics, schema, migration, fixture, test, or
visual baseline.

## 2. Context — the former doctrine

The previous doctrine defined FeelFlick around a single load-bearing wedge:

> *Mood-first, taste-deep — a single justified nightly pick that makes its case.
> Anti-scroll.*

It framed the product as delivering **one** considered film for tonight (the Home
"Briefing"), treated Discover as a *supporting* surface that must never be a
"competing second recommender," treated Browse and lists as deliberately
*secondary* utility, and read a "wall of carousels" as betraying the single pick.
A "Not tonight" yielded one sequential replacement, never visible backups. The
information architecture (F2) encoded this hierarchy into navigation ("Tonight" as
the centered hero; Browse/Discover demoted).

## 3. Evidence that challenged the universal single-pick assumption

- **The data and engine layers already produce collections.** The hero entry point
  (`getTopPickForUser`) already selects multiple candidates and returns
  `{ primary, alternates, reasons }`; Discover already computes a ranked, diversified
  list; the impression schema is row/placement-scoped (`hero`, `quick_picks`,
  `because_you_loved`, `trending`, …). The single-pick constraint lived mainly in
  *presentation, doctrine, copy, and tests* — not in the data contract.
- **The operational rule had already softened.** `.claude/rules/product.md` already
  stated that "one pick" is a powerful default but "not a universal requirement,"
  and that useful features should not be subordinated merely for not being the
  primary recommendation. The canonical doctrine lagged behind this.
- **Surface sprawl vs. a single pick was an unresolved tension** flagged in the F0
  foundation audit: ~13 route families against a doctrine that recognized only one.
- **Synthetic persona and usability work** repeatedly evaluated only "one good film
  tonight," which under-described how taste, mood, and curiosity surfaces actually
  serve different jobs.
- **Product judgment:** a personal discovery platform is better served by the right
  amount of choice across complementary modes than by a single mandatory pick, so
  long as anti-overwhelm discipline is preserved.

## 4. Decision — the newly approved product definition

1. FeelFlick is a **personal movie discovery platform**.
2. The brand promise is **"Movies, made personal."**
3. **Taste, mood, and curiosity** are the three complementary discovery dimensions.
4. **Home, Discover, and Browse** are complementary discovery modes — Home
   understands the person, Discover understands the moment, Browse follows explicit
   curiosity. None is structurally subordinate by doctrine.
5. A **prominent singular hero recommendation remains allowed** (and is often a
   strong default).
6. **Exactly one visible recommendation is no longer a universal requirement.**
7. **Small, finite selections are allowed and encouraged** where they improve
   discovery.
8. **Anti-scroll remains**, redefined around **bounded, intentional choice** — not a
   mandatory cardinality of one. Infinite feeds, unbounded walls, generic
   carousels, and low-quality dumping are still rejected.
9. **Cinematic DNA remains** and is explicitly **living, evolving, evidence-based,
   and correctable** — never fixed, deterministic, infallible, a universal match
   score, or a complete definition of the person.
10. **The exact number of recommendations remains a product hypothesis** (the
    ~10–15 Discover working number is testable, not doctrine).
11. **Runtime Home and Discover behavior is not changed by this decision.**

## 5. What remains valid from the former doctrine

- Personalization that combines taste and present context.
- Explainable recommendations grounded in real signals; honesty over the appearance
  of certainty; no fabricated reasons/counts/social proof.
- Quality gating that protects trust without collapsing the catalog to popular /
  recent / English-language / consensus-safe films.
- Reducing choice fatigue; feedback (skips, corrections, ratings) that meaningfully
  improves future recommendations.
- Compounding taste memory as a long-term advantage.
- The do-not-become guardrails: not an endless Netflix wall, not a Letterboxd clone,
  not a TMDB wrapper, not a JustWatch replacement, not a generic tracker.
- A prominent, well-explained pick as a legitimate and often-preferred presentation.

## 6. What is superseded

- The framing that the product **is** a single nightly pick and that everything else
  is subordinate depth.
- The claim that **Discover must never be a second recommender** and that
  **Browse/lists are deliberately secondary**.
- The reading that **any** multiple-film interface is drift (now: only *unbounded* or
  *purpose-free* surfaces are drift).
- The wedge phrasing ("a single justified nightly pick") as the canonical product
  definition.

The IA v2 record (F2) and the F4/F5/F3 phase notes are preserved as accurate
historical records of what was decided and shipped; their single-pick product
framing no longer governs and now carries supersession banners.

## 7. Why recommendation count remains a hypothesis

The right amount of choice depends on surface, context, cold/warm state, and
measured outcomes. Encoding "~10–15" (or "exactly one") as doctrine would convert an
unvalidated preference into a principle. The count, the number of Home sections, and
the visual hierarchy are surface hypotheses owned by their design/implementation
records and validated against real outcomes — not fixed here.

## 8. Implementation consequences (not done in this PR)

These follow from the doctrine but are **explicitly out of scope** for the
documentation change that introduces it, and remain pending implementation
decisions:

- exact number of Home sections and which groups ship;
- exact Discover result count and final Discover layout;
- final Home visual hierarchy and whether the hero stays singular;
- skip / remove / refill behavior inside a multi-film result;
- impression-grouping and placement-aware outcome-attribution implementation;
- card-level match-score presentation;
- daily-briefing email contents;
- final navigation wording, and whether "The Briefing" remains an internal module
  name.

## 9. Migration sequencing

1. **This PR — doctrine + documentation truth-up (documentation only).**
2. Home product contract + analytics correctness (log surfaced alternates;
   placement-aware attribution) — behavior change, separately scoped.
3. Home interface implementation (hero + finite groups) + tests + baselines.
4. Discover collection contract + engine surfacing of the finite selection.
5. Discover interface implementation + tests + baselines.
6. Landing/SEO/share copy + a new IA decision record re-leveling navigation.

Later steps each require their own scope, validation, and (where relevant) a new or
updated decision record. Nothing downstream is authorized by this ADR beyond the
documentation changes it lands.

## 10. What this does NOT decide

- It does **not** change any runtime behavior, UI, recommendation logic, analytics
  events, recommendation outcomes, schema, migration, Supabase function, fixture,
  test, or visual baseline.
- It does **not** decide the implementation questions listed in §8.
- It does **not** change the design system / composition-system authority (see
  [ADR 019](019-thoughtful-seatmate-website-wide-theme.md) and
  `docs/ui/composition-system-ownership.md`), which remain the authorities for
  visual and composition ownership.
- It does **not** claim the runtime already implements the three-mode, bounded-choice
  experience.
