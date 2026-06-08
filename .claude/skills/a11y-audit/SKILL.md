---
name: a11y-audit
description: >
  Audit FeelFlick UI accessibility. Trigger on interactive UI, forms, dialogs,
  navigation, keyboard behavior, screen readers, motion, contrast, or explicit a11y review.
---

# Accessibility Audit

Read `.claude/rules/ui-implementation.md` first. Use actual runtime behavior as evidence; do not assume a shared primitive is accessible without verifying it.

## Review areas

### Semantics and names

- Use native interactive elements when practical.
- Every control needs an accessible name.
- Decorative images use empty alt text; meaningful images use concise meaningful alternatives.
- Form controls need associated labels, instructions, and errors.
- Heading structure should reflect the page hierarchy.

### Keyboard and focus

- All functionality must be keyboard operable.
- Focus must remain visible.
- Dialogs and overlays need verified initial focus, containment where appropriate, Escape behavior, and focus restoration.
- Avoid positive `tabIndex`.
- Verify skip links and landmark targets.

### Dynamic behavior

- Announce important async status and errors when needed.
- Avoid focus loss during loading, navigation, or conditional rendering.
- Controls must expose disabled, expanded, selected, pressed, and busy state correctly.

### Visual and motion

- Check contrast in rendered states, not from class names alone.
- Do not rely on color alone to convey meaning.
- Respect reduced-motion preferences.
- Ensure zoom, text scaling, and responsive layouts do not hide content or controls.

### Pointer and touch

- Provide adequate target size and spacing.
- Do not require hover for essential information or actions.
- Ensure gestures have accessible alternatives where relevant.

## Validation

Use the checks appropriate to the change:

- lint and static accessibility rules
- keyboard walkthrough
- browser accessibility tree
- axe or equivalent automated scan
- screen-reader spot check for complex widgets
- contrast measurement
- mobile viewport and zoom review

Automated tools do not replace manual keyboard and focus testing.

## Findings

Report each material issue as:

```text
[severity] file:line — issue
Observed behavior: what happens
Expected behavior: accessible outcome
Suggested fix: concrete correction
```

Do not include unrelated naming or code-style preferences.

End with the checks performed and either `✅ no material accessibility issues found` or `⚠️ N material issues found`.
