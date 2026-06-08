---
name: design-system-guard
description: >
  Review FeelFlick UI work for intentional visual coherence. Trigger on redesign,
  styling, new sections, landing pages, shared components, or significant JSX/CSS changes.
---

# Design Review

Read `.claude/rules/design-system.md` and `.claude/rules/ui-implementation.md` first. Those maintained rules take precedence over this skill. Existing production styling is a baseline, not permanent law.

## Establish the mode

Classify the task before evaluating it:

- **Maintenance:** preserve the accepted current direction unless the task requires change.
- **Exploration:** compare alternatives and permit intentional departures from current patterns.
- **Migration:** apply an accepted new direction consistently and identify remaining legacy usage.

Do not report an intentional, task-authorized design change as a violation merely because it differs from production.

## Review dimensions

Evaluate:

- hierarchy and information priority
- typography roles and readable measure
- color purpose, contrast, and restraint
- spacing rhythm and alignment
- poster and film imagery treatment
- responsive composition
- interaction states and keyboard behavior
- motion purpose and reduced-motion behavior
- loading, empty, error, and fallback states
- consistency with accepted tokens and primitives
- unnecessary decorative effects
- migration completeness when a direction has changed

Prefer rendered desktop and mobile output over source-only assumptions. Use screenshots or Playwright when practical.

## Findings

For each material issue, report:

```text
[severity] file:line — observed problem
Why it matters: user or system impact
Suggested direction: concrete correction
```

Use **error** for accessibility failures, broken interaction, severe inconsistency, or an incomplete accepted migration; **warning** for visible quality problems; and **info** for optional refinement.

Do not invent violations to fill a checklist.

End with one verdict:

- `✅ coherent for the stated task`
- `⚠️ coherent direction, with N material issues`
- `❌ direction or implementation needs revision`
