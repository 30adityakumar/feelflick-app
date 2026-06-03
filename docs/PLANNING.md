# FeelFlick — Active Sprint

> **Update this file yourself at the end of every work session.**
> Claude Code reads this at session start — keep it honest and current.
> Do NOT ask Claude to auto-update this file.

> **Now driven by the phased rebuild.** The full F0–F10 roadmap (objectives, scope,
> non-scope, validation, risk) lives in
> [feelflick-foundation-readiness-audit.md §8](feelflick-foundation-readiness-audit.md).
> This file tracks only the *active* slice — don't duplicate the roadmap here.

## Currently In Progress
- [ ] **F1 — Product Doctrine + README/Docs Alignment** (docs-only): README,
      `product-doctrine.md`, `architecture.md`, `FeelFlick_Overview.md`,
      `product-research-patterns.md`, docs index.

## Up Next (prioritized)
- [ ] **F2 — Information Architecture v2** — make the IA subordinate browse/lists/
      discover to the Briefing (the single pick). Next phase after F1.
- [ ] F3 — Design System Hardening (retire amber/orange drift; fold inline `HP`
      holdouts; finish the Eyebrow rollout currently parked in `stash@{0}`).
- [ ] (later) F4–F10 per the F0 roadmap.

## Blocked / Waiting
- [ ] <!-- e.g. Feature X — waiting on design decision -->

## Done This Week
- [x] F0 — Foundation Readiness Audit (`docs/feelflick-foundation-readiness-audit.md`).
- [x] chore: npm audit clean — `npm audit` reports **0 vulnerabilities** (resolved).
- [x] fix: ESLint clean — `npm run lint` passes with 0 warnings (the prior
      rules-of-hooks ×8 + no-unescaped-entities ×47 backlog is resolved).
- [x] fix: `recommendations.helpers.test.js` now passes in the standard suite
      (full unit suite green: 417 tests / 33 files).

---

## How to Use

**Start of session:** Tell Claude Code — *"Read CLAUDE.md, PLANNING.md, and CLAUDE-REFERENCE.md before we start."*

**End of session:** Move in-progress items to Done, add new items to Up Next.

**Session handoff note (optional):** Add a one-liner below about where you stopped:

> _Last stopped: ..._
