---
name: a11y-audit
description: >
  Enforce accessibility on any UI work for FeelFlick. Trigger on: "build a
  component", "modal", "button", "form", "interactive", "is this accessible",
  "a11y", "keyboard", "screen reader", or after creating/editing any JSX with
  interactive elements. CLAUDE.md mandates "no a11y regressions" — this is the
  runtime/semantic check that eslint-plugin-jsx-a11y can't fully cover.
---

# Accessibility Audit

FeelFlick's bar: Netflix/Apple TV+ polish — which includes accessibility.
`eslint-plugin-jsx-a11y` catches static issues (run `lint` first); this skill
covers the semantic + interaction checks it can't.

When invoked, audit changed UI against this checklist. Report each as
`severity (error/warning) — file:line — fix`.

## Checklist
### Interactive elements
- [ ] Every clickable is a real `<button>`/`<a>` — OR has `role`, `tabIndex={0}`,
      AND key handlers (Enter + Space). ❌ No bare `<div onClick>`.
- [ ] Icon-only controls have `aria-label` (the play/add/info buttons on cards).
- [ ] Event-handler naming: `handleX`, never an internal `onClick`.

### Focus
- [ ] Visible focus ring on every focusable (`focus-visible:` — match the shared
      primitives' ring). Never `outline: none` without a replacement.
- [ ] `<Modal>` traps focus, restores it on close, closes on Escape (the shared
      Modal already does this — use it, don't hand-roll).
- [ ] Logical tab order; no positive `tabindex`.

### Content & media
- [ ] Posters/images have meaningful `alt` (e.g. `alt={movie.title}`), or `alt=""`
      if purely decorative.
- [ ] Headings nest correctly (one h1 per view; no skipped levels).
- [ ] Form inputs have associated labels (the `<Input>` primitive has no built-in
      label — add one or `aria-label`).

### Color & motion
- [ ] Text contrast ≥ WCAG AA (4.5:1). ⚠️ Watch low-opacity text on dark
      (`text-white/40` on `#06060a` can fail) for body text.
- [ ] Respect reduced motion — use `motion-safe:`/`motion-reduce:`; Framer Motion
      should honor `prefers-reduced-motion` for non-essential animation.

### Structure
- [ ] Skip-to-content target `#main` stays intact (it's in the route shells).
- [ ] Live regions (`aria-live`) for toasts / async status (e.g. ToastNotification).

## Output
End with: ✅ no a11y issues, or ⚠️ N issues (listed). Run `lint` to confirm the
static jsx-a11y rules also pass.
