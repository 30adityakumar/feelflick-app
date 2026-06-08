# FeelFlick repository structure

## Purpose

This file defines durable guidance for:

* module ownership
* file placement
* dependency direction
* feature organization
* shared code
* routing
* naming
* imports
* refactoring
* configuration
* scripts
* tests
* documentation
* dependencies

It should make the repository easier to understand and change.

It should not force every feature into the same file layout or preserve weak boundaries merely because they already exist.

## Architectural principle

Organize primarily by product capability.

Keep code near the feature that owns its meaning.

Promote code to a shared layer only when it has a clear cross-feature role.

Prefer:

> feature ownership first, shared abstraction second

Avoid:

> placing code in `shared` merely because it might someday be reused

A file’s location should answer:

* Who owns this behavior?
* Which parts of the product may depend on it?
* Is it domain-specific or generally reusable?
* Does it operate on UI, business logic, data, or infrastructure?

## Current high-level structure

The repository currently uses these major areas:

```text
src/
├── app/
├── components/
├── features/
├── shared/
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   ├── services/
│   └── ui/
├── styles/
└── test/

supabase/
├── functions/
├── migrations/
└── config.toml

scripts/
docs/
public/
tests/
```

This is the current model, not an irreversible folder contract.

Before introducing a new top-level directory, determine whether an existing area can own the concern clearly.

## `src/app/`

`src/app/` owns application-level composition and cross-cutting wiring.

Suitable responsibilities include:

* application shell
* route registration
* global providers
* global error boundaries
* authentication gates
* administrative route gates
* application-wide bootstrapping
* route-level lazy loading
* cross-route navigation behavior

Feature-specific presentation and business logic should not accumulate in `src/app/`.

A route guard may improve navigation and presentation, but it must not be treated as server-side authorization.

### Routing

The route tree is currently centralized in `src/app/router.jsx`.

When adding or changing a route:

* preserve a clear public versus authenticated distinction
* use lazy loading where appropriate
* provide a suitable loading state
* define error handling
* consider page title, focus, and scroll behavior
* preserve intended return navigation through authentication
* avoid duplicate aliases unless compatibility requires them
* remove obsolete aliases when their migration period is complete

A route module should usually live inside the feature that owns the experience.

Do not put substantial route implementation directly into the central router.

If the route tree becomes difficult to understand, it may be decomposed into route modules. Do not split it solely to reduce line count.

## `src/features/`

`src/features/` owns product capabilities.

Examples include:

* landing
* recommendations
* discover
* browse
* onboarding
* movie detail
* profile
* watchlist
* history
* lists
* people
* account
* preferences
* authentication
* legal content

A feature may contain:

```text
feature-name/
├── FeatureEntry.jsx
├── components/
├── sections/
├── hooks/
├── services/
├── lib/
├── data/
├── styles/
└── __tests__/
```

This is an available pattern, not a required template.

Create only the directories that improve the feature’s organization.

### Feature ownership

Keep behavior inside a feature when:

* only that capability uses it
* its meaning depends on feature-specific concepts
* its API is still evolving
* promoting it would expose unnecessary internals
* reuse is only speculative

A feature should expose a small, intentional public surface when another feature needs to use it.

Avoid importing deeply into another feature’s internal folders.

Instead:

* expose a deliberate module entry
* move genuinely shared behavior into a shared layer
* or reconsider whether the dependency belongs at all

### Cross-feature dependencies

Cross-feature imports are not automatically forbidden.

They should represent a real product relationship and avoid circular ownership.

Before importing one feature from another, ask:

* Which feature owns the concept?
* Is the dependency one-way?
* Is this actually shared domain behavior?
* Would an explicit public export improve the boundary?
* Is duplication temporarily safer than a premature abstraction?

Avoid building a hidden dependency graph through deep relative imports.

## `src/components/`

`src/components/` should contain application-wide components with recognizable product-level responsibility.

Suitable examples include:

* global layout
* primary navigation
* footer
* application chrome
* canonical movie presentation used broadly
* global feedback surfaces
* product-wide composition components

This layer may understand FeelFlick domain concepts.

It should not become a dumping ground for every reusable JSX fragment.

When a component is only used by one feature, colocate it with that feature.

## `src/shared/ui/`

`src/shared/ui/` owns low-level interface primitives.

Examples may include:

* button
* input
* textarea
* select
* dialog primitive
* tooltip
* badge
* skeleton
* surface
* focus treatment
* visually hidden helper

A shared UI primitive should generally:

* have a narrow responsibility
* provide correct semantics
* handle core interaction states
* support accessibility
* avoid feature-specific data fetching
* remain visually adaptable
* have an API that several consumers can use coherently

Do not place a full recommendation card, taste profile, watchlist row, or film-specific experience in `shared/ui`.

A primitive is not automatically correct because it is shared.

It may be redesigned or replaced when its behavior, accessibility, or visual assumptions are limiting the product.

## `src/shared/components/`

`src/shared/components/` owns reusable components that understand FeelFlick domain concepts but are not owned by a single feature.

Examples may include:

* reusable film metadata
* rating presentation
* poster treatment
* recommendation explanation
* shared user identity presentation
* common list presentation
* cross-feature film actions

This layer sits between generic UI primitives and feature-specific composition.

Before placing a component here, confirm that:

* more than one feature genuinely needs it
* its behavior is coherent across those uses
* its ownership would be unclear inside a single feature
* it does not require feature-specific branching to remain reusable

If a shared component accumulates many mode flags, consider:

* splitting it into smaller primitives
* returning ownership to individual features
* using composition rather than conditionals
* defining separate domain components

## `src/shared/hooks/`

`src/shared/hooks/` owns hooks that are useful across product capabilities.

Suitable responsibilities include:

* authentication session access
* responsive or browser capabilities
* shared query behavior
* cross-feature user settings
* shared media behavior
* common interaction state

A hook should not move to `shared` merely because it contains reusable React code.

Keep it feature-local when its data model or behavior belongs to one feature.

Hooks should:

* follow React hook rules
* make dependencies explicit
* avoid hidden global side effects
* clean up subscriptions
* handle stale asynchronous work
* expose stable, understandable state
* distinguish loading, empty, error, and success where relevant

Do not hide substantial business policy inside a generic-sounding hook.

## `src/shared/services/`

`src/shared/services/` owns business logic, data orchestration, and external-service interaction used across features.

Suitable responsibilities include:

* recommendation logic
* profile computation
* Supabase-backed domain operations
* analytics
* external API integration
* caching policy
* data transformation involving domain behavior

Services should separate, where practical:

* pure computation
* data access
* orchestration
* side effects
* presentation formatting

Pure recommendation calculations should remain independently testable when possible.

Do not place generic helpers in `services` solely because they are imported by a service.

Do not place JSX or visual presentation in service modules.

Large services may be decomposed by responsibility when:

* active and legacy paths are difficult to distinguish
* several policies are mixed together
* circular imports are emerging
* tests require excessive setup
* file ownership is unclear
* independent migration would become safer

Do not split a service without understanding its current call paths.

## `src/shared/lib/`

`src/shared/lib/` owns lower-level utilities and infrastructure helpers.

Suitable responsibilities include:

* clients
* tokens
* formatting
* pure general utilities
* identifier helpers
* date and number utilities
* browser helpers
* stable configuration adapters

A `lib` module should not conceal significant product policy behind a generic filename.

Prefer specific names such as:

* `formatRuntime`
* `normalizeMovieId`
* `oauthNonce`
* `recommendationTokens`

over broad files such as:

* `helpers`
* `utils2`
* `common`
* `misc`

Small cohesive utility modules are preferable to one growing catch-all file.

## `src/styles/`

`src/styles/` owns global and cross-component styling systems.

Suitable responsibilities include:

* global resets
* font definitions
* shared animation definitions
* typography systems
* reusable CSS custom properties
* cross-component accessibility helpers
* global theme foundations

Feature-specific styles should remain near the feature unless they genuinely affect the whole product.

Do not leave obsolete design-system utilities active indefinitely after a migration.

When replacing a token, animation, or global utility:

* search all consumers
* migrate or remove usage
* update documentation
* remove conflicting definitions
* validate representative routes

Avoid maintaining competing global systems under different names.

## Tests

Tests may live:

* beside the module in `__tests__/`
* beside the module with a test suffix
* in an integration or E2E test area
* in shared test infrastructure

Follow the surrounding convention unless changing it improves discoverability substantially.

Keep tests near the behavior they describe when practical.

Use broader test areas for:

* cross-feature journeys
* browser workflows
* visual regression
* shared fixtures
* environment setup

Do not move tests purely for aesthetic consistency.

Testing standards belong in `.claude/rules/testing.md`.

## `supabase/`

`supabase/` owns database and server-side Supabase behavior.

### `supabase/migrations/`

Use migrations for:

* schema
* functions
* triggers
* indexes
* RLS
* grants
* database-backed policy
* scheduled-job definitions where applicable

Do not edit or delete migrations that may have been applied to a shared environment.

Migration safety belongs in `.claude/rules/security-and-data.md`.

### `supabase/functions/`

Each Edge Function should have a clear security classification:

* authenticated user
* internal service
* public
* signed webhook

Keep shared behavior explicit.

Do not copy authentication, CORS, rate-limiting, and error logic across functions indefinitely when a maintained shared implementation would reduce security drift.

A shared helper is useful only if deployment and Supabase’s function-bundling model support it reliably.

### `supabase/config.toml`

Treat local Supabase configuration separately from hosted-project state.

A setting in `config.toml` does not prove that the remote project has the same setting.

Document remote dashboard changes in an appropriate runbook or decision record.

## Scripts

`scripts/` should contain explicit operational or development tooling.

Organize scripts by purpose when volume justifies it, such as:

* maintenance
* validation
* data import
* recommendation evaluation
* release
* local setup

Scripts should:

* state whether they are read-only or mutating
* identify the target environment
* validate required configuration
* fail clearly
* avoid printing secrets
* support dry-run mode for meaningful destructive work where practical
* avoid silently targeting production
* use stable exit codes

A script that mutates remote data should not rely on a vague filename to communicate risk.

Prefer names such as:

* `audit-recommendation-pools`
* `validate-schema`
* `backfill-movie-tags`
* `check-rls-policies`

over:

* `run`
* `fix`
* `temp`
* `cleanup2`

One-off investigative scripts may be temporary. Delete them when their purpose is complete, or document and maintain them if they become operational tooling.

## Documentation

Use `docs/` for material that helps humans and agents understand:

* architecture
* product decisions
* design research
* experiments
* runbooks
* audits
* migrations
* incidents
* release readiness
* historical context

Separate current standards from historical records.

A document should clearly indicate when it is:

* current guidance
* proposal
* experiment
* audit
* decision record
* runbook
* historical record
* superseded

Do not allow old phase documents and audit findings to become active project rules merely because they remain in the repository.

### Decision records

Use a decision record when a choice has meaningful future consequences, such as:

* design-system adoption
* recommendation-policy change
* analytics consent model
* authentication architecture
* major dependency
* information-architecture change
* schema strategy

A useful decision record includes:

* context
* decision
* alternatives
* evidence
* consequences
* status
* date
* superseding decision where applicable

Do not place temporary implementation steps in durable doctrine.

## Configuration

Configuration files may include:

* `package.json`
* Vite configuration
* Tailwind or CSS configuration
* ESLint configuration
* Vitest configuration
* Playwright configuration
* Supabase configuration
* deployment configuration
* environment examples
* Claude settings

Before changing configuration:

* identify all environments affected
* determine whether the setting is active
* check for stale or duplicated configuration
* validate the relevant build or tool
* avoid retaining fossilized settings that contradict the current implementation

Configuration is not automatically immutable.

A configuration file should be changed when it is the correct source of truth for the task.

Do not add a second configuration path to avoid understanding the first.

## Source of truth

Prefer deriving volatile facts from their real source.

Examples:

| Fact                       | Preferred source                             |
| -------------------------- | -------------------------------------------- |
| Dependency versions        | `package.json` and lockfile                  |
| Route definitions          | router source                                |
| Environment-variable usage | source and maintained env example            |
| Current design tokens      | token and style source                       |
| Recommendation thresholds  | recommendation source and reference registry |
| Database schema            | migrations and remote schema inspection      |
| Test scripts               | `package.json`                               |
| Deployment headers         | active platform configuration                |
| Current engine version     | recommendation source                        |
| Font loading               | HTML, CSS, and asset configuration           |

Do not duplicate volatile facts in the root `CLAUDE.md`.

When documentation duplicates a fact, it should point to the source or be updated as part of the same change.

## Imports and dependency direction

Use the project alias for cross-directory imports where it improves clarity.

Relative imports are appropriate for tightly colocated modules.

A reasonable dependency direction is:

```text
app
  → features
  → shared domain components and services
  → shared UI and library utilities
```

This is a guide, not a mechanically enforced layering system.

Avoid:

* `shared` importing feature internals
* low-level UI primitives importing route logic
* utility modules importing application shells
* circular feature dependencies
* services importing visual components
* tests becoming production dependencies

When a lower-level module needs product-specific behavior, prefer:

* dependency injection
* a callback
* composition
* a higher-level orchestrator
* moving ownership upward

Do not create an abstraction solely to satisfy a diagram when direct code remains clearer.

## Public module surfaces

A module or feature may use an explicit entry file when it improves ownership.

For example:

```text
feature/
├── index.js
├── FeaturePage.jsx
├── components/
└── services/
```

The entry should expose only intentionally supported imports.

Do not create `index.js` files everywhere automatically.

Barrel files can:

* clarify public surfaces
* simplify imports

They can also:

* hide dependency direction
* create circular imports
* reduce tree-shaking clarity
* make searches harder

Use them selectively.

## Naming

Use names that express product meaning and responsibility.

### Files and components

* React components: `PascalCase`
* hooks: `useCamelCase`
* non-component modules: follow the surrounding convention consistently
* tests: match the module being tested
* migrations: ordered and descriptive
* scripts: action-oriented and specific

A route component may use a product name such as `History.jsx` or a suffix such as `HistoryPage.jsx`.

Follow local consistency unless one form is causing real ambiguity.

### Variables and functions

* functions and variables: `camelCase`
* true module constants: `SCREAMING_SNAKE_CASE`
* booleans: use meaningful predicates such as `is`, `has`, `can`, `should`
* handlers: name the action or event clearly
* sets and maps: name the contained relationship where useful

Do not enforce verbose handler prefixes when a shorter name remains clear.

Avoid encoded type information in names unless it improves understanding.

### Domain language

Use the same term for the same product concept.

Do not alternate casually among terms such as:

* recommendation
* pick
* suggestion
* result

when the distinction matters.

Define domain language in product or feature documentation where needed.

Do not rename established concepts during unrelated cleanup.

## Components and files

A file may contain more than one component when the additional components are:

* small
* tightly coupled
* not independently reusable
* easier to understand beside the owner

Extract a component when it:

* has meaningful responsibility
* is reused
* owns significant interaction
* is independently testable
* obscures the parent
* has its own state or accessibility requirements

Do not require one component per file.

Do not create arbitrary maximum file lengths.

A large file is a signal to inspect responsibilities, not proof that it must be split.

## Refactoring

A refactor should have a defined purpose.

Examples:

* clarify ownership
* remove duplicated policy
* isolate side effects
* improve testability
* eliminate circular dependencies
* complete a migration
* remove dead compatibility paths
* make an API easier to use correctly

Before a broad refactor:

* identify consumers
* characterize current behavior
* define what must remain unchanged
* add or retain suitable tests
* avoid mixing unrelated product changes
* determine migration order

Do not hide behavior changes under a “cleanup” label.

Do not preserve obsolete structure merely to minimize the number of changed files.

## Shared abstraction threshold

Promote code into a shared abstraction when:

* at least two real consumers need the same behavior
* the shared concept has a coherent name
* likely differences can be expressed through composition or a small API
* ownership is clearer after promotion
* testing becomes easier

Do not abstract based only on visual similarity.

Do not wait for exactly three duplicates when two implementations are already drifting around one concept.

Conversely, temporary duplication may be preferable when:

* behavior is still being explored
* consumers have different requirements
* a shared API would require many flags
* migration risk exceeds the current benefit

## Dependencies

Use existing dependencies when they solve the requirement cleanly.

Before adding a dependency, assess:

* concrete need
* existing alternatives in the repo
* maintenance activity
* license
* bundle impact
* runtime cost
* security history
* browser support
* accessibility quality
* compatibility
* amount of the package actually needed

Avoid overlapping packages with unclear ownership.

Examples include multiple:

* component systems
* animation libraries
* date libraries
* state-management systems
* form frameworks
* icon libraries
* analytics SDKs

Do not reimplement a difficult, security-sensitive, or accessibility-sensitive primitive merely to avoid a justified dependency.

Do not introduce a broad framework to solve one minor problem.

## Generated and vendor files

Identify generated files before editing them.

Generated output should normally be changed through its source or generator.

Examples may include:

* build output
* coverage reports
* visual snapshots
* generated types
* lockfiles
* generated database definitions

Lockfiles should be committed when dependencies change.

Do not hand-edit a lockfile to avoid running the package manager.

Third-party or vendor code should not be modified casually.

Document and isolate necessary patches.

## Dead code and compatibility

Remove dead code when:

* usage has been verified
* compatibility is no longer needed
* tests and references are updated
* rollback does not depend on it

Do not keep deprecated paths indefinitely without an owner and removal condition.

A deprecation should state:

* replacement
* current consumers
* migration path
* removal condition

Avoid comments such as “legacy” without explaining whether the code is still active.

## Repository-wide changes

For changes spanning many modules:

1. define the target architecture
2. inventory affected files and consumers
3. identify compatibility requirements
4. choose a migration sequence
5. update tests during migration
6. remove obsolete paths
7. update guidance and documentation
8. validate representative product flows

Do not maintain two complete architectures indefinitely to reduce short-term diff size.

Do not combine a repository-wide reorganization with unrelated visual or product redesign unless they genuinely depend on each other.

## Updating this rule

Update this file when durable repository ownership or architectural conventions change.

Do not include:

* exhaustive file inventories
* exact line numbers
* current dependency versions
* temporary migration status
* individual issue or pull-request history
* current test counts

Those belong in source, generated reports, plans, or historical documentation.

When the repository evolves, update this rule to describe the intended ownership model rather than preserving obsolete folders as permanent doctrine.
