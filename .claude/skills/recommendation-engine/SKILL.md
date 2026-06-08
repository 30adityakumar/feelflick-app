---
name: recommendation-engine
description: >
  Evaluate or change FeelFlick recommendation behavior. Trigger on candidates,
  filters, scoring, ranking, mood fit, embeddings, similarity, explanations,
  skips, diversity, fallbacks, caches, or recommendation analytics.
---

# Recommendation Engine Workflow

Read `.claude/rules/recommendation-engine.md` and `CLAUDE-REFERENCE.md` first. Those maintained documents take precedence over this skill.

## Classify the task

- **Behavior-preserving refactor:** characterize current outputs and verify equivalence.
- **Behavior change:** define the intended user-visible improvement and evaluate before and after.
- **Data or pipeline change:** inspect coverage, freshness, cost, and cache implications.
- **Investigation:** map the active path and gather evidence before proposing a policy change.

Do not assume that an existing threshold, anti-recency rule, skip treatment, or hard filter is permanently correct. Treat inferred-preference policies as hypotheses unless they protect an explicit boundary, safety, privacy, or data integrity.

## Required workflow

1. Identify the target surface and active call path.
2. Locate candidate retrieval, hard filters, scoring, diversity, thresholding, fallback, explanation, logging, and cache behavior.
3. Separate explicit user constraints from inferred preferences and ranking heuristics.
4. Measure or inspect candidate loss at affected stages when behavior changes.
5. Compare representative profiles and session contexts.
6. Inspect correlated penalties and duplicate signals.
7. Evaluate catalog-health effects such as language, decade, genre, popularity, and repetition.
8. Define validation, rollout, cache invalidation, and rollback.

Use real data when the decision depends on catalog or user distributions. A pure refactor does not require a remote query when tests and equivalence checks are sufficient.

## Evaluation output

For behavior changes, report:

- hypothesis
- active pipeline
- current failure or limitation
- affected candidate stages
- representative before-and-after results
- user-outcome metrics
- catalog-health guardrails
- cache or version implications
- rollout and rollback plan

Recommendation explanations must remain grounded in actual signals. Do not invent a plausible reason merely because it sounds personalized.

If evidence is incomplete, state what is known, what remains uncertain, and the safest next experiment rather than preserving current behavior by default.
