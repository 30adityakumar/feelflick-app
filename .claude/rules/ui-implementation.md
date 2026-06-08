---
paths:
  - "src/**/*.jsx"
  - "src/**/*.css"
  - "e2e/**/*.js"
  - "playwright.config.*"
---

# FeelFlick UI implementation

## Purpose

This file defines implementation standards for user interfaces.

It covers:

* interaction behavior
* accessibility
* forms
* loading and asynchronous states
* errors and recovery
* responsive behavior
* overlays
* navigation
* media
* component reuse
* state communication

Visual identity, typography, color, composition, and motion direction belong primarily in `.claude/rules/design-system.md`.

Testing procedures belong in `.claude/rules/testing.md`.

## Core standard

A FeelFlick interface should be:

* understandable without explanation
* usable by keyboard, mouse, touch, and assistive technology
* responsive across realistic screen sizes
* honest about state and uncertainty
* resilient to slow networks, missing data, and partial failure
* consistent where consistency helps
* adaptable where the user task differs
* efficient without feeling mechanical

Polish includes behavior, not only appearance.

## Start with the user state

Before implementing a component or route, identify the relevant states.

Common states include:

* initial
* loading
* loaded
* empty
* partial
* stale
* refreshing
* saving
* success
* validation error
* recoverable error
* fatal error
* offline
* signed out
* permission denied
* disabled
* unavailable

Do not design only the ideal loaded state.

Not every component requires every state. Include the states that are realistic for its data and interaction.

## Native semantics first

Prefer native HTML elements whenever they express the required behavior.

Use:

* `<button>` for actions
* `<a>` or router links for navigation
* `<input>`, `<textarea>`, and `<select>` for form controls
* heading elements for document hierarchy
* `<nav>`, `<main>`, `<section>`, `<article>`, and `<aside>` where appropriate
* lists for list-like content
* tables for genuinely tabular relationships

Do not replace native controls with clickable `<div>` or `<span>` elements solely for styling convenience.

If a custom interaction cannot use a native element:

* provide the correct semantic role
* support expected keyboard behavior
* provide focus management
* expose state to assistive technology
* test it manually

ARIA should supplement correct HTML, not compensate for avoidable semantic mistakes.

## Accessible names and descriptions

Every interactive control must have an accessible name.

Prefer, in order:

1. visible text
2. an associated `<label>`
3. `aria-labelledby`
4. `aria-label` when no visible label is practical

Do not add `aria-label` when visible text already names the control correctly.

Icon-only controls require a meaningful accessible name.

Avoid vague labels such as:

* “Click here”
* “More”
* “Info”
* “Action”

Include useful context where several controls would otherwise have identical names.

Examples:

* “Add Past Lives to watchlist”
* “Remove The Handmaiden from list”
* “Open filters”
* “Close recommendation details”

Decorative icons should normally use `aria-hidden="true"`.

## Buttons and links

Use a button for an action that changes state, submits, opens, closes, saves, skips, rates, or toggles.

Use a link for navigation to another URL or route.

Do not make a button visually resemble a text link if the distinction would become unclear.

Buttons should:

* communicate hover, focus, active, disabled, and loading states
* preserve a stable label or width where practical during loading
* avoid accidental double submission
* use `type="button"` when inside a form and not submitting
* expose disabled state correctly
* remain understandable without relying only on color

Links should:

* have meaningful text
* remain recognizable as navigation
* preserve browser behavior where appropriate
* not be disabled through inaccessible click prevention alone

Avoid placing interactive controls inside other interactive controls.

## Shared primitives

Inspect existing shared primitives before creating a new implementation.

Prefer an existing primitive when it provides:

* the required semantics
* correct behavior
* accessibility
* responsive support
* a suitable API
* acceptable visual flexibility

Do not assume a primitive is correct because it is described as canonical.

Review:

* actual source
* current consumers
* keyboard behavior
* focus management
* screen-reader behavior
* mobile behavior
* reduced-motion behavior
* design-system assumptions
* loading and error support

Extend a primitive when the new requirement belongs naturally to its responsibility.

Replace or redesign it when its assumptions are actively limiting correctness or quality.

Avoid creating a second nearly identical primitive solely to escape improving the first.

## Forms

Forms should make the expected action and current state clear.

Every field should have:

* an associated label
* an appropriate input type
* sensible autocomplete attributes where relevant
* visible focus
* clear required or optional status
* helpful instructions when the format is not obvious
* accessible error association
* preserved user input after recoverable failure

Use placeholders as examples or hints, not as the only label.

Validation should occur at an appropriate time:

* do not display errors before the user has had a chance to interact
* validate on submit
* optionally validate on blur or after meaningful input
* avoid interrupting typing with aggressive error states

Error messages should explain how to fix the issue.

Prefer:

> Enter an email address in the format [name@example.com](mailto:name@example.com).

Over:

> Invalid input.

When submission fails:

* preserve entered values
* show the failure near the relevant action or field
* provide a retry path
* avoid duplicate submissions
* announce important errors to assistive technology where appropriate

## Loading states

Choose the loading treatment based on the user’s context.

### Skeletons

Use skeletons when:

* the structure of incoming content is known
* preserving layout reduces visual shift
* the user is waiting for page or card content
* the skeleton helps communicate what is loading

Skeletons should approximately match the final content shape.

Do not create elaborate skeletons that are more visually prominent than the content.

### Progress indicators

Use a spinner or indeterminate progress indicator when:

* an action is in progress
* the content shape is not useful to preview
* the wait occurs inside a compact control
* the user needs confirmation that the action was accepted

Spinners are not categorically forbidden.

Use them deliberately.

### Progress bars

Use determinate progress when real progress can be measured.

Do not show fake percentages.

### Existing content during refresh

When refreshing already-visible data, prefer preserving useful existing content with a subtle refreshing indicator instead of replacing the entire surface with a blank skeleton.

Distinguish:

* first load
* background refresh
* pagination
* submission
* route transition

They do not require the same treatment.

## Loading copy

Use concise, accurate status text.

Examples:

* “Loading recommendations…”
* “Saving…”
* “Adding to watchlist…”
* “Opening Google…”
* “Updating your taste profile…”

Use a Unicode ellipsis where an ellipsis is appropriate.

Do not imply progress or completion that has not occurred.

Avoid generic status language when the specific action is known.

## Optimistic updates

Use optimistic updates when:

* the action is reversible
* failure is uncommon
* the expected result is unambiguous
* rollback can be handled clearly
* immediate response materially improves the experience

Suitable examples may include:

* watchlist toggle
* simple preference toggle
* lightweight feedback
* following or unfollowing

Be more cautious with:

* ratings that affect recommendation logic
* destructive actions
* multi-step writes
* operations with permission uncertainty
* actions that trigger external communication
* irreversible state changes

On optimistic failure:

* roll back the visible state
* explain what failed
* preserve a retry path
* avoid leaving the UI and server state inconsistent

## Empty states

An empty state should explain:

* what is absent
* whether that is expected
* what the user can do next

An empty section may be hidden when its absence carries no useful information.

Do not hide an entire route’s primary purpose merely because it is empty.

Examples:

* A “Continue watching” module can disappear when there are no items.
* An empty watchlist route should explain how to add films.
* A search with no results should show the query and suggest recovery.
* A new user’s history can explain how logging improves recommendations.

Do not fabricate content to avoid emptiness.

Do not use the same generic empty-state component copy everywhere.

## Error states

Errors should be proportional to their scope.

### Local error

Use when one card, section, field, or request fails while the rest remains usable.

Keep unaffected content available.

### Route error

Use when the route’s primary content cannot load.

Explain what happened in user language and provide a retry or navigation path.

### Fatal application error

Use only when the application cannot recover safely.

Avoid exposing raw stack traces, internal identifiers, database details, or sensitive error messages to users.

Error states should answer:

* What failed?
* What can the user still do?
* Can they retry?
* Was their action saved?
* Is this temporary?
* Where can they go next?

Do not use “Something went wrong” as the entire recovery experience when more useful information is available.

## Success and confirmation

Confirm actions when the result may not otherwise be obvious.

Use:

* inline state changes
* button-state changes
* toasts
* status messages
* navigation
* updated content

Choose the least disruptive confirmation that remains clear.

Do not show a toast for every minor interaction.

Important async status changes should be announced appropriately, such as through a polite live region.

Avoid duplicate confirmation through several mechanisms unless the action is especially consequential.

## Destructive actions

Destructive actions should be clearly differentiated and difficult to trigger accidentally.

Use confirmation when:

* data loss is meaningful
* the action is difficult to reverse
* the user may misunderstand the scope
* the action affects other users or shared content

Avoid unnecessary confirmation for easily reversible actions.

Confirmation copy should name the action and affected object.

Prefer:

> Delete “Weekend comfort films”? This cannot be undone.

Over:

> Are you sure?

Where practical, prefer undo over confirmation for low-risk reversible actions.

## Dialogs, sheets, popovers, and menus

Choose an overlay pattern according to the task.

### Dialog

Use for focused decisions, forms, or information that temporarily interrupts the current flow.

### Sheet or drawer

Use when more space or contextual continuity is useful, especially on mobile.

### Popover

Use for lightweight contextual content anchored to a control.

### Menu

Use for a set of actions or navigation choices with established keyboard behavior.

Do not use a modal merely because it is easy to implement.

A modal or dialog should:

* have an accessible name
* move focus inside on open
* keep keyboard focus within while open
* close with Escape when dismissible
* restore focus to a sensible element on close
* prevent background interaction
* handle background scroll appropriately
* have a visible close action when dismissal is expected
* support mobile viewport and keyboard constraints
* respect reduced motion
* not contain another modal unless absolutely necessary

Use established accessible primitives or thoroughly test custom implementations.

Do not assume the current shared `Modal` satisfies every requirement without inspecting its behavior.

## Focus management

Focus should follow user intent.

Manage focus explicitly when:

* opening or closing dialogs
* moving between major steps
* adding inline errors after submission
* navigating to dynamically loaded content
* removing the currently focused item
* restoring focus after temporary overlays
* changing routes in a single-page application where browser defaults are insufficient

Do not move focus unexpectedly for passive content updates.

Visible focus must remain clear on all focusable elements.

Do not remove outlines without providing an equal or stronger replacement.

Avoid positive `tabindex`.

DOM order should generally match reading and focus order.

## Navigation and route changes

Navigation should preserve orientation.

For route-level changes:

* use meaningful page titles
* provide a clear primary heading
* preserve back-button behavior
* avoid unexpected scroll jumps
* decide intentionally whether scroll should reset or restore
* move focus appropriately when needed
* retain unsaved input or warn before losing it when appropriate
* provide loading feedback for meaningful route delays

Do not use navigation for an action that could be completed in place unless the new route provides real value.

Do not trap users in flows without a clear exit.

## Headings and landmarks

Each route should have a clear document structure.

Use headings to describe content hierarchy, not to achieve a visual size.

A route should generally have one primary `<h1>` representing the page or experience.

Lower-level headings should follow a meaningful hierarchy.

Avoid skipping levels merely for styling convenience.

Use landmarks such as:

* header
* nav
* main
* aside
* footer

Maintain a usable skip-to-content path where the application shell provides one.

## Responsive behavior

Responsive design should adapt the experience, not merely reduce dimensions.

Consider:

* priority of information
* interaction mode
* touch reach
* control density
* text measure
* image cropping
* overlays
* navigation
* virtual keyboard
* safe areas
* portrait and landscape orientation
* zoom and text enlargement

Do not assume desktop hover interactions have a direct mobile equivalent.

Every hover-only feature should have a touch and keyboard path when the information or action is important.

Do not hide essential information on mobile solely to simplify the layout.

Test realistic narrow widths, not only one standard phone viewport.

## Touch targets

Interactive targets should be comfortably usable by touch.

Aim for a target around 44 by 44 CSS pixels for primary controls where practical.

Smaller visible icons may use a larger invisible hit area.

Maintain enough space between adjacent controls to prevent accidental activation.

Do not make entire complex cards clickable when they also contain nested controls unless semantics and event handling are carefully designed.

## Hover, focus, and active states

Hover is an enhancement, not the only way to discover functionality.

Important information and actions must remain available through:

* keyboard focus
* touch
* visible controls
* an alternate detail view

Focus styles should not merely copy hover styles if they remain too subtle.

Active and selected states should communicate current state, not only momentary pointer response.

Use `aria-pressed`, `aria-selected`, `aria-expanded`, or related attributes when appropriate.

## Carousels and horizontal rows

Use a carousel or horizontal row only when it fits the content and user goal.

A usable carousel should:

* support keyboard interaction
* expose usable controls
* work with touch scrolling
* avoid trapping horizontal gestures
* communicate overflow
* preserve readable card content
* avoid unexpected auto-advance
* respect reduced motion
* remain useful without hover
* avoid shifting neighboring content during interaction

Do not use auto-rotating carousels for essential content.

Do not place every content category into a carousel by default.

## Lists, feeds, grids, and pagination

Choose the collection pattern based on user intent.

### Grid

Useful for visual comparison and browsing.

### List

Useful for metadata, history, settings, and scanning.

### Feed

Useful for chronological or continuously updated content, but should have a clear product purpose.

### Pagination or bounded loading

Useful when the catalog is large and the user benefits from explicit progress or limits.

### Infinite scroll

Use only when continuous exploration is genuinely the task and recovery, orientation, performance, and stopping behavior are addressed.

Avoid infinite scroll as an automatic engagement mechanic.

Large collections should account for:

* loading cost
* rendering cost
* scroll restoration
* filtering
* sorting
* empty results
* end state
* item identity
* keyboard navigation where relevant

## Search

Search should provide:

* a clearly labelled input
* useful query persistence
* appropriate debounce
* loading state
* no-result state
* error recovery
* keyboard support
* clear result categories when multiple entity types exist
* sensible handling of spelling and partial matches
* cancellation or stale-result protection

Do not trigger excessive network requests for each keystroke without control.

Do not clear the query unexpectedly after navigation.

Recent searches or suggestions should be honest and useful, not fabricated.

## Images and media

Movie imagery is important content.

Images should:

* have explicit dimensions or reserved aspect ratio
* avoid layout shift
* use appropriate responsive sizes
* lazy-load when below the fold
* prioritize likely LCP imagery carefully
* provide meaningful alt text when the image conveys content
* use empty alt text when decorative
* handle missing, broken, or low-quality sources
* avoid displaying raw broken-image UI
* preserve focal content where practical

Poster alt text should usually identify the movie when the surrounding text does not already provide an equivalent accessible name.

Avoid redundant alt text when the same movie title is immediately adjacent and the image adds no extra information.

Background imagery that conveys essential information needs an accessible equivalent.

Do not use poster text embedded in the image as the only source of a film title.

## Long and unexpected content

Design components with real data variation.

Test:

* long titles
* long person names
* multiple languages
* non-Latin scripts
* missing year or metadata
* missing poster or backdrop
* large numbers
* zero values
* very long explanations
* empty arrays
* unexpected nulls
* duplicate titles
* narrow viewports
* browser zoom

Do not rely on truncation where the hidden information is necessary for understanding or action.

When truncation is useful, provide access to the full value where appropriate.

## Authentication and permissions

Authentication state should be clear without disrupting unrelated browsing unnecessarily.

Protected actions may:

* prompt sign-in at the moment of intent
* preserve the intended action through authentication
* explain why sign-in is required
* return the user to the correct context afterward

Do not discard the user’s work when authentication expires.

Permission-denied states should distinguish between:

* signed out
* insufficient permission
* unavailable resource
* deleted resource
* transient failure

Do not reveal whether private resources exist when authorization rules should conceal them.

## Recommendation-specific UI

Recommendation presentation should make clear:

* what is being recommended
* why it may fit
* which parts are based on mood, taste, context, quality, or other signals
* what the user can do next
* how feedback affects future recommendations where known

Do not present an algorithmic score with false precision.

A percentage or confidence value should have a stable, understandable meaning.

Do not show several competing scores unless the user can interpret the distinction.

A recommendation explanation should remain accessible even when the visual treatment is highly cinematic.

The primary poster should not overpower the title, reason, or actions.

Skip, save, watch, rate, and feedback actions should remain distinguishable.

Do not place two controls with the same outcome on one card unless the duplication serves a clear accessibility or responsive need.

## Copy and microcopy

Interface copy should be:

* concise
* specific
* actionable
* consistent
* honest
* human

Use sentence case by default.

Name actions with verbs.

Prefer:

* “Save to watchlist”
* “Try another”
* “Show why”
* “Update preferences”
* “Remove from list”

Avoid:

* “Submit”
* “Proceed”
* “Click here”
* “Got it” when the actual outcome is unclear
* unexplained technical terms

Pending copy should describe the action in progress.

Error copy should explain recovery.

Do not use humor in a state involving data loss, account problems, payment, privacy, or serious failure unless the tone has been explicitly designed and validated.

## Motion implementation

Follow the design-system motion principles.

Implementation should:

* support `prefers-reduced-motion`
* avoid relying on animation to communicate essential state
* keep interaction response immediate
* avoid animating expensive layout properties where possible
* avoid long entrance sequences before the user can act
* prevent repeated motion during routine state updates
* test low-end mobile behavior

Framer Motion does not remove the need to reason about reduced motion explicitly.

Use CSS transitions for simple state changes where they are sufficient.

Use animation libraries when they materially improve implementation quality or continuity.

## Accessibility review

For meaningful UI changes, review:

* semantic elements
* accessible names
* keyboard behavior
* focus order
* focus visibility
* dialog and menu behavior
* form labels and errors
* headings and landmarks
* live-region usage
* text and non-text contrast
* non-color indicators
* touch-target size
* reduced motion
* zoom and text reflow
* image alternatives
* loading and error communication

Run configured automated checks, but do not treat them as complete coverage.

Manually test keyboard behavior for important interactions.

The existing `a11y-audit` skill may be used as a procedure, but its checklist should follow this rule rather than preserve stale implementation assumptions.

## Completion standard

A UI change is not complete merely because:

* the ideal screenshot looks polished
* lint passes
* the component renders
* a shared primitive was used
* the happy path works

A meaningful UI change should be reviewed against the states and input methods relevant to it.

Document:

* states tested
* viewports reviewed
* keyboard behavior checked
* accessibility checks run
* known limitations
* deliberate deviations from existing primitives
* follow-up migration work where applicable

## Updating this rule

Update this file when durable UI implementation standards change.

Do not place:

* exact visual tokens
* one-off component specs
* current copy
* temporary route details
* test result snapshots
* line-number references

in this rule.

Those belong in design-system rules, component documentation, tests, references, or decision records.
