---
paths:
  - "**/*.{test,spec}.{js,jsx}"
  - "e2e/**"
  - "src/test/**"
  - "playwright.config.*"
  - "vitest.config.*"
---

# Testing and quality assurance

Use testing to verify behavior and reduce risk, not as a ritual or a way to preserve obsolete implementation details.

Choose validation based on what changed, what could break, and how visible the failure would be.

## General principles

* Test user-visible behavior and important contracts.
* Prefer deterministic tests.
* Keep tests proportionate to risk.
* Add regression coverage for bugs when practical.
* Update tests when intentional behavior changes.
* Do not weaken or delete meaningful assertions merely to make a change pass.
* Do not treat snapshot updates as proof that a change is correct.
* Do not claim validation that was not actually run.

A failing test may reveal:

* a real regression
* an intentional behavior change requiring a test update
* a stale test
* an environment problem
* an unrelated existing failure

Determine which before changing code or tests.

## Validation levels

### Static validation

Use for nearly all source changes:

```bash
npm run lint
```

Linting verifies syntax, project conventions, React rules, hooks usage, and the configured accessibility checks.

Run targeted linting during iteration when useful. Run the project lint command before completing substantial code work.

### Unit and component tests

Use when changing:

* pure functions
* recommendation calculations
* data transformations
* hooks
* component state
* conditional rendering
* formatting
* validation
* shared primitives
* utilities

Run targeted tests during development, then the relevant broader suite before completion:

```bash
npm run test
```

Good unit and component tests should cover meaningful input and state boundaries rather than mirror internal implementation line by line.

### Build validation

Run after changes that can affect compilation, imports, routes, assets, environment usage, code splitting, or production behavior:

```bash
npm run build
```

A successful development render does not replace a production build.

Treat build warnings as findings to assess, not automatically as harmless output.

### End-to-end tests

Use Playwright when changing:

* routing
* authentication
* onboarding
* navigation
* forms
* modals and overlays
* recommendation flows
* save, rate, watchlist, history, or list actions
* interactions involving multiple components or services
* user journeys that are difficult to validate with isolated component tests

Available project commands currently include:

```bash
npm run test:e2e
npm run test:e2e:ui
npm run test:e2e:report
```

Confirm current scripts in `package.json` rather than assuming this document is permanently accurate.

End-to-end tests should exercise representative user journeys and observable outcomes. Avoid depending unnecessarily on fragile implementation details.

### Visual regression

Use visual validation when changing:

* layout
* typography
* color
* spacing
* responsive behavior
* shared components
* major route composition
* animation end states
* loading, empty, error, or authenticated presentation

Available commands currently include:

```bash
npm run test:visual
npm run test:visual:update
```

Before updating a baseline:

1. inspect the visual difference
2. confirm the difference is intentional
3. review affected desktop and mobile states
4. check for clipping, wrapping, overflow, contrast, and density regressions
5. document why the new baseline is correct

Do not update all snapshots automatically to silence failures.

Visual snapshots verify rendered consistency. They do not replace design judgment, interaction testing, or accessibility testing.

## UI review loop

For meaningful visual or interaction work:

1. capture the current state
2. implement the change
3. render the affected route with realistic data
4. capture desktop and mobile screenshots
5. compare hierarchy, readability, spacing, emphasis, and emotional fit
6. inspect interaction states
7. perform at least one deliberate polish pass
8. run relevant automated checks

Review more than the ideal state.

When relevant, inspect:

* default
* hover
* focus
* active
* selected
* disabled
* loading
* empty
* partial data
* long text
* missing image
* error
* signed-out
* signed-in
* mobile
* reduced motion

## Accessibility

Accessibility is part of implementation quality, not a final cleanup step.

For interactive or visual changes, verify as relevant:

* semantic HTML
* accessible names
* keyboard operation
* visible focus
* sensible focus order
* focus restoration after dialogs or menus
* correct dialog and menu behavior
* headings and landmark structure
* form labels and error association
* sufficient color contrast
* non-color state indicators
* touch-target size
* reduced-motion behavior
* zoom and text reflow
* screen-reader announcements for important dynamic state

Run automated accessibility checks where available, including the Playwright axe coverage already present in the project.

Automated scans do not prove accessibility. Perform manual keyboard review for important interaction changes.

Do not add `aria-label` to every interactive element by default. Prefer visible text and native semantics when they already provide an accessible name.

Do not add keyboard handlers to native buttons, links, inputs, or controls unless custom behavior requires them.

## Performance

Check performance when changing:

* landing or above-the-fold content
* poster and backdrop images
* fonts
* route-level dependencies
* animation
* large lists or carousels
* data-fetching behavior
* recommendation queries
* shared providers
* bundle structure

Review as relevant:

* image dimensions and responsive sources
* lazy-loading behavior
* largest contentful paint
* cumulative layout shift
* unnecessary re-renders
* request duplication
* cache behavior
* route code splitting
* bundle growth
* animation cost
* long tasks
* font-loading behavior

Do not optimize speculative micro-costs while ignoring visible loading, image, query, or bundle problems.

When a dependency materially increases the client bundle, state the trade-off.

## Recommendation quality validation

Recommendation-engine changes require more than passing unit tests.

Before accepting a scoring, threshold, filter, diversity, mood, taste, or ranking change:

1. define the intended user-visible improvement
2. inspect representative current outputs
3. identify affected user cohorts or edge cases
4. compare before-and-after candidate sets or rankings
5. check quality floors and exclusion behavior
6. test sparse-history and mature-profile users
7. test multiple moods, languages, eras, and familiarity levels when relevant
8. confirm cache-version implications
9. define production measurement or monitoring
10. preserve rollback

A mathematically valid change may still reduce recommendation quality.

Do not tune recommendation constants solely from intuition or a handful of hand-picked titles.

## Database and integration validation

For schema, query, RLS, function, cache, or external-service changes, validate:

* migration direction
* existing-data compatibility
* authorization behavior
* ownership boundaries
* nullable and missing data
* failure handling
* retries and idempotency
* rate limits
* cache invalidation
* rollback
* local versus remote environment

Use read-only inspection before modifying a remote environment.

Do not treat successful execution under an admin or service role as proof that normal users have correct access.

## Test selection by change type

Use this as guidance rather than a rigid checklist.

| Change                     | Minimum likely validation                                         |
| -------------------------- | ----------------------------------------------------------------- |
| Documentation only         | Review rendered Markdown and links                                |
| Pure utility               | Targeted unit tests, lint                                         |
| Component logic            | Component tests, lint                                             |
| Shared primitive           | Component tests, accessibility review, representative screenshots |
| Styling adjustment         | Screenshots at affected sizes, visual tests when covered          |
| Route or navigation        | E2E, build, relevant screenshots                                  |
| Authentication             | E2E with signed-out and signed-in states                          |
| Recommendation logic       | Unit tests, output comparison, quality evaluation, build          |
| Database/RLS               | Migration checks, authorization tests, integration validation     |
| Dependency/configuration   | Lint, tests, build, bundle/runtime assessment                     |
| Large cross-cutting change | Full relevant suite, E2E, visual, accessibility, build            |

## Full-suite expectations

Run the broader suite before completing:

* significant feature work
* shared-component changes with many consumers
* route or provider changes
* recommendation-engine changes
* dependency upgrades
* configuration changes
* broad refactors
* release-oriented work

A typical broad sequence is:

```bash
npm run lint
npm run test
npm run build
```

Add E2E and visual suites when the affected behavior warrants them.

Do not run expensive unrelated suites after every tiny edit. Use targeted checks while iterating and broader checks at meaningful checkpoints.

## Existing failures and blocked checks

When validation is blocked:

* state the exact command
* include the relevant failure summary
* distinguish new failures from known existing failures
* explain whether the change can still be evaluated safely
* do not report the task as fully validated

Do not modify unrelated code merely to obtain a completely green suite unless the user asks for that cleanup or the failure prevents reliable validation.

## Completion evidence

A completion report should list:

* checks run
* pass or fail result
* tests added or updated
* screenshots or routes reviewed
* checks not run and why
* known residual risk

Use precise statements such as:

* `npm run lint` passed
* 12 targeted tests passed
* production build succeeded
* desktop and mobile screenshots reviewed
* E2E not run because development credentials were unavailable

Avoid vague claims such as “everything looks good” or “fully tested” without supporting evidence.
