---
name: code-review
description: >
  Perform a structured FeelFlick code review. Trigger on review, audit, check this
  code, look for issues, safety review, or pre-merge assessment.
---

# Code Review Skill

Read the maintained rule files relevant to the changed paths before reviewing. Those rules take precedence over this checklist.

Review the actual diff and surrounding call paths. Prioritize correctness, user impact, security, data integrity, accessibility, and regressions over stylistic preference.

## Review method

1. Identify the intended behavior and changed surface.
2. Read the affected implementation, callers, tests, and configuration.
3. Look for concrete failure modes, not hypothetical perfection.
4. Distinguish bugs from optional improvements.
5. Verify claims against runtime behavior or tests when practical.
6. Report only findings the author can act on.

## Review areas

### Correctness and state

- null, loading, empty, error, and stale states
- race conditions, cleanup, and asynchronous ownership
- identifier and data-shape mismatches
- unexpected behavior across routes or profile states
- compatibility with current callers and exports

Async work does not require local `try/catch` when errors are correctly handled by a caller, query library, returned result, or error boundary.

### Security and data

- secret exposure and unsafe logging
- client-side authorization mistaken for server enforcement
- RLS, ownership, and role behavior for data changes
- unsafe SQL, shell, HTML, URL, or model-generated output handling
- privacy implications of analytics, replay, free text, or external processors

A policy or RLS flag being present is not enough; review whether the permitted operations and row conditions are correct.

### UI and accessibility

- semantic controls and accessible names
- keyboard, focus, dialog, and responsive behavior
- visible error and recovery states
- contrast, reduced motion, and touch behavior
- actual rendered hierarchy and interaction

### Performance

- request waterfalls, N+1 queries, oversized payloads, and repeated computation
- image sizing, LCP priority, layout stability, and unnecessary work
- bundle or dependency impact

Do not require every image to lazy-load. Hero and likely-LCP images may need eager loading and priority.

### Maintainability

- ownership and dependency direction
- duplicated policy that can drift
- dead compatibility paths
- misleading comments or docs
- tests that cover the important behavior

Do not report arbitrary line limits, future-TypeScript preferences, handler naming, or personal formatting choices as defects.

## Severity

- **error:** likely bug, security/data issue, broken interaction, or release blocker
- **warning:** meaningful regression risk or maintainability problem
- **info:** optional improvement with clear value

## Output

For each finding:

```text
[severity] file:line — concise title
Evidence: what in the code or runtime supports the finding
Impact: what can fail or degrade
Fix: concrete correction
```

Finish with:

- errors, warnings, and infos count
- validation reviewed or run
- overall merge assessment

If no material findings exist, say so plainly.
