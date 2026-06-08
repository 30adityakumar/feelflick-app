---
paths:
  - "supabase/**"
  - "src/shared/lib/supabase/**"
  - "src/shared/hooks/useAuthSession*"
  - "src/features/auth/**"
  - "src/app/admin/**"
  - "src/shared/services/analytics.js"
  - "src/main.jsx"
  - "middleware.js"
  - ".env.example"
---

# FeelFlick security and data guidance

## Purpose

This file defines durable standards for:

* secrets and environment variables
* authentication
* authorization
* Supabase access
* Row Level Security
* database migrations
* Edge Functions
* administrative access
* OAuth and sessions
* analytics and observability
* personal data
* AI and external processors
* production and remote operations
* deletion and retention
* incident response

Security requirements should protect users, data, credentials, and recoverability.

They should not block harmless inspection, local testing, reversible source changes, or drafting proposed migrations.

## Security principles

Use these principles when making security or data decisions:

* least privilege
* deny by default where access is sensitive
* server-side enforcement
* explicit environment boundaries
* minimum necessary data
* defense in depth
* auditable changes
* reversible rollout
* clear ownership
* honest failure behavior

Do not rely on:

* hidden client code
* route guards alone
* unpublished URLs
* environment-variable names
* UI state
* email strings embedded in a bundle
* CORS alone
* obscurity
* a public API key as proof of identity

Security decisions must be enforced at the layer that controls the protected resource.

## Environment classification

Before any data or infrastructure action, identify the target environment.

Possible environments include:

* local development
* isolated automated test
* shared development
* preview
* staging
* production

Do not infer the environment solely from:

* the current Git branch
* the application URL
* the presence of credentials
* a variable name
* Supabase CLI linkage
* a shell prompt

Before a remote write, verify:

* project or account identifier
* hostname
* branch or environment
* authenticated role
* whether the data is real
* whether a backup or rollback exists

When uncertain, use read-only inspection first.

## Actions that may proceed without approval

Claude may normally perform:

* source and migration-file inspection
* RLS-policy review
* schema diff analysis
* read-only queries against an approved development environment
* local Supabase startup and reset
* drafting a new migration
* writing tests for a proposed migration
* editing Edge Function source locally
* linting, testing, building, and type checking
* reviewing logs with sensitive values redacted
* creating a patch without applying it remotely
* inspecting analytics event definitions
* reviewing configuration for exposed secrets

These actions are reversible or observational.

## Actions requiring explicit confirmation

Require confirmation before:

* applying a migration to a remote project
* running `supabase db push` against a remote project
* changing production RLS or grants
* modifying production Auth settings
* changing production OAuth configuration
* deploying an Edge Function
* creating or altering a scheduled production job
* executing remote data backfills or bulk updates
* deleting or anonymising user data outside an established workflow
* rotating or revoking active credentials
* changing production analytics or replay collection
* changing data retention or deletion behavior
* modifying DNS, hosting, security headers, or production infrastructure
* running a command with meaningful data-loss risk

Before asking for confirmation, state:

1. exact environment
2. exact operation
3. affected data or services
4. expected impact
5. rollback or recovery plan
6. validation plan

Drafting the code or migration does not require the same confirmation as applying it remotely.

## Secrets and configuration

### Secret classification

Treat as secrets:

* service-role or secret Supabase keys
* database passwords and connection strings with credentials
* OpenAI API keys
* OAuth client secrets
* webhook signing secrets
* private signing keys
* provider access tokens
* GitHub, Cloudflare, Sentry-management, or deployment tokens
* SMTP credentials
* credentials capable of privileged writes
* credentials that incur unrestricted cost

Never:

* commit them
* print them
* place them in screenshots
* paste them into issues or documentation
* expose them through client bundles
* include them in analytics
* include them in error messages
* place them in `VITE_*` variables
* use real values in example configuration

Use placeholders in documentation.

### Client-exposed configuration

All values referenced through `import.meta.env.VITE_*` are public to the browser.

Possible client configuration includes:

* Supabase project URL
* Supabase publishable or legacy anon key
* public analytics project key
* Sentry browser DSN
* public asset host
* non-sensitive feature configuration

A client-exposed value may still require:

* domain restriction
* quota monitoring
* API-level rate limiting
* RLS
* provider-side restrictions
* abuse detection

Do not call a value secret if the browser must receive it.

Do not assume that a public credential is harmless merely because it is expected to be visible.

### Local environment files

Local secret-bearing files should be ignored by Git.

Before adding a new environment file or variable:

* determine whether it is client or server scoped
* document its purpose without including its value
* update an example file where appropriate
* confirm ignore rules
* avoid duplicating the same credential under several names

Do not edit a user’s existing secret values unless the task explicitly requires it.

It is acceptable to update environment-variable documentation, example files, validation, or loading code without changing actual credentials.

## Supabase browser access

The browser may use the Supabase publishable or anon key when RLS and database grants correctly enforce access.

The key identifies the project and request role.

It does not provide per-user authorization by itself.

For any browser-accessible table, view, or RPC:

* enable and verify RLS where applicable
* grant only required operations
* test unauthenticated access
* test authenticated ownership
* test access as another user
* test insert and update constraints
* test deletion
* test privileged or public cases separately

Do not trust a client-supplied `user_id`.

Policies and server-side functions must derive identity from the authenticated request.

## Row Level Security

RLS is required for user-sensitive tables exposed through Supabase APIs.

### Policy design

Policies should specify:

* role
* operation
* row visibility
* permitted new row state
* ownership or membership logic

Use:

* `USING` for access to existing rows
* `WITH CHECK` for inserted or updated row state

For ownership-based data, verify that a user cannot:

* read another user’s rows
* insert a row for another user
* change ownership during update
* delete another user’s rows
* infer protected data through joins, views, or RPCs

Use explicit authenticated-role restrictions where appropriate.

### Authorization data

Do not use user-editable profile metadata as the source of authorization.

Authorization roles and memberships should live in:

* protected database tables
* server-maintained app metadata
* verified claims
* another server-controlled source

Remember that token claims may remain stale until refresh.

For high-risk actions, consider whether current database state should be checked instead of trusting an older token claim.

### Views

Review view security explicitly.

A view may expose underlying data differently from the base table.

For each exposed view:

* verify whether it runs as invoker or definer
* verify grants
* verify underlying RLS behavior
* test with anon and authenticated roles
* avoid exposing internal columns unintentionally

### Functions and RPCs

Review database functions for:

* `SECURITY DEFINER`
* search path
* caller identity
* argument validation
* object ownership
* grants
* RLS interaction
* SQL injection
* unexpectedly broad result sets

A `SECURITY DEFINER` function must have a deliberate reason and a constrained `search_path`.

Do not create privileged RPCs merely to work around a failing RLS policy.

## Administrative access

Client-side route guards are navigation and presentation controls.

They are not authorization.

An admin page may use a client-side check to improve UX, but protected data and actions must also be enforced through:

* RLS
* a server or Edge Function
* protected app metadata
* server-maintained roles
* another verified authorization mechanism

Do not authorize privileged actions solely from:

* `VITE_ADMIN_EMAILS`
* an email comparison in React
* a hidden route
* local storage
* a client-supplied role

If an administrative route only reads public or non-sensitive aggregate information, document that limitation clearly.

When adding real administrative capabilities:

* create a server-enforced authorization model
* separate read and write privileges
* log consequential actions
* require reauthentication or stronger assurance for highly sensitive operations where justified
* avoid exposing service credentials to the admin client

## Service-role and privileged credentials

Service-role and other RLS-bypassing credentials must remain server-side.

Use them only when the operation genuinely requires bypassing user-scoped policies.

Prefer an RLS-scoped user client for user-initiated operations.

When using privileged access:

* authenticate the caller separately
* authorize the operation
* limit accessible tables and fields
* validate all input
* avoid returning unrestricted rows
* log important administrative effects
* keep the privileged operation narrow
* never forward the privileged credential to the browser

Do not use service-role access as a general solution to policy problems.

## Database migrations

### Migration history

Do not edit or delete a migration that may have been applied to a shared or production environment.

Create a new migration to change existing behavior.

An unapplied local migration may be revised while it remains private and has not been shared or applied, but confirm its status first.

Migration filenames should be ordered, meaningful, and traceable.

### Migration review

A migration should be reviewed for:

* forward behavior
* existing-data compatibility
* locks and runtime
* nullability
* defaults
* indexes
* foreign keys
* uniqueness
* check constraints
* RLS
* grants
* triggers
* functions
* views
* backfill strategy
* rollback or compensating migration
* application compatibility

Do not combine unrelated schema changes merely because they are convenient to deploy together.

### Destructive schema changes

For dropping or narrowing a column, table, type, index, or constraint:

* confirm actual usage
* inspect production data
* identify application consumers
* stage the migration when appropriate
* backfill before enforcing a constraint
* preserve data until the new path is proven
* define recovery

Prefer expand-and-contract for significant production changes:

1. add compatible structure
2. deploy code that supports both
3. migrate or backfill data
4. verify
5. remove obsolete structure in a later migration

### Backfills

Backfills should be:

* bounded
* restartable
* observable
* idempotent where practical
* rate-conscious
* safe under partial completion

Do not run a large data rewrite as part of a request-path migration unless its impact is understood.

## RLS and migration validation

For relevant database changes, test at least:

* unauthenticated caller
* authenticated owner
* authenticated non-owner
* privileged system path
* insert
* select
* update
* ownership change attempt
* delete
* null and malformed inputs
* missing related records

A successful query using an admin connection does not validate RLS.

A successful local migration does not prove production compatibility.

Document any validation that requires the remote dashboard or production-like data.

## Edge Functions

Classify each Edge Function as:

* authenticated user function
* service-to-service function
* public function
* externally signed webhook

Use authentication appropriate to that class.

### Authenticated user functions

For calls made by signed-in users:

* validate the user’s session JWT
* obtain the caller’s user identity
* use an RLS-scoped client for user data where practical
* perform separate authorization for sensitive actions

A project publishable or anon key is not proof that the caller is an authenticated user.

### Service-to-service functions

For cron jobs, pipelines, workers, or internal functions:

* use a dedicated secret
* restrict the caller
* keep privileged operations narrow
* rotate credentials when necessary
* avoid reusing a public project key as the internal secret

### Public functions

A public function should be intentionally public.

Protect it through appropriate combinations of:

* input validation
* rate limiting
* quotas
* abuse detection
* request-size limits
* output limits
* caching
* cost controls

Do not expose paid AI operations merely because a caller can provide the public Supabase key.

### Webhooks

For external webhooks:

* verify the provider signature against the raw request
* enforce timestamp or replay protections when supported
* handle duplicate delivery idempotently
* return appropriate status codes
* do not trust body fields before signature verification

### Function input and output

Validate:

* content type
* request method
* body size
* required fields
* string lengths
* numeric ranges
* arrays and item counts
* allowed enum values
* identifiers
* authorization relationship
* output shape

Avoid returning internal stack traces or provider details.

Use stable error categories.

### CORS

CORS controls which browser origins may read responses.

It is not caller authentication.

For browser functions:

* allow only intended origins
* return no permissive fallback origin for an unrecognised request
* use `Vary: Origin` when responses vary by origin
* allow only required methods and headers
* test production, preview, and local origins intentionally

Do not treat a valid `Origin` header as proof of identity; non-browser clients can forge it.

### Rate limiting

In-memory rate limits may provide modest per-instance protection but are not reliable global enforcement in a serverless environment.

For cost-sensitive or abuse-sensitive functions, use a durable or provider-level limiter when necessary.

Rate-limit on a meaningful identity where available:

* user
* API consumer
* signed token
* IP as a fallback

Account for proxies and untrusted forwarding headers.

## Authentication and sessions

Use the maintained Supabase Auth flow and browser client.

For OAuth:

* use approved redirect URLs
* preserve and validate state or nonce
* strip tokens or codes from visible URLs promptly
* avoid logging callback URLs containing credentials
* return users to the intended route safely
* handle cancellation and failure
* do not use open redirects

Do not manually parse or persist OAuth credentials unless the chosen flow requires it and the implementation is validated.

For session handling:

* avoid exposing access or refresh tokens
* do not place tokens in analytics or error reports
* clear application identity on sign-out
* handle expired sessions
* preserve unsaved work where practical
* avoid treating the existence of a client session object as authorization for server-side resources

Authentication answers who the caller is.

Authorization answers what they may do.

Do not conflate them.

## External APIs

Classify each external API credential as:

* public and client-safe
* restricted public credential
* server secret
* privileged administrative credential

For client-visible keys:

* assume users can extract and reuse them
* apply provider restrictions where supported
* monitor quota
* avoid granting write or account-level permissions
* route through a server when secrecy, cost, or abuse resistance is required

For server API calls:

* validate output
* enforce timeouts
* handle rate limits
* avoid leaking provider errors
* avoid sending unnecessary personal data
* document retention and processing implications

## AI and user-provided text

Mood descriptions, reflections, recommendation feedback, profile summaries, and free-text inputs may contain sensitive personal information.

Before sending user content to an AI provider:

* send only what is needed
* avoid unrelated profile attributes
* avoid direct identifiers where unnecessary
* limit history included in prompts
* validate and constrain model output
* define fallback behavior
* avoid logging full prompt content by default
* consider retention and privacy disclosures
* treat model output as untrusted input

Do not allow model-generated:

* SQL
* HTML
* URLs
* identifiers
* recommendation reasons
* scores
* user-facing claims

to bypass validation solely because the model returned valid JSON.

AI-generated recommendation explanations must remain grounded in real data.

## Analytics and telemetry

Collect analytics for defined product and operational purposes.

Before adding an event, identify:

* the decision it supports
* event owner
* fields collected
* user identifiability
* retention
* consent or preference behavior
* whether the same information already exists

Avoid sending:

* email unless genuinely required
* full names
* free-text mood descriptions
* search text containing sensitive context
* OAuth URLs or tokens
* unredacted errors
* detailed watch history in one payload
* recommendation prompts
* private list content
* content-boundary preferences without a clear purpose

Prefer stable internal IDs and coarse derived categories.

### Consent and preference handling

Analytics preference should be applied before non-essential collection begins whenever practical.

Do not default to collection after a consent lookup failure without an explicit product and legal decision.

Opt-out should stop:

* event capture
* heatmaps
* session replay
* future identity association

Define whether previously collected data is retained or deleted.

Reset analytics identity on sign-out.

### Session replay

Session replay has a higher privacy risk than aggregate events.

When enabled:

* mask sensitive text
* mask form inputs
* block sensitive media or components as appropriate
* exclude authentication and private-data surfaces where practical
* sample conservatively
* test actual replay output
* document provider retention
* honor opt-out before recording begins where practical

Do not assume a masking configuration covers every new component automatically.

### Error monitoring

Error reports should exclude:

* access tokens
* refresh tokens
* authorization headers
* passwords
* personal free text
* sensitive database records
* raw provider responses containing personal data

Use filtering or `beforeSend` logic where needed.

Public browser ingestion identifiers may be present in client code, but management tokens and credentials must remain secret.

## Personal data

Treat the following as potentially personal or sensitive:

* identity and account data
* watch history
* ratings
* skips and dislikes
* mood selections
* free-text mood descriptions
* content boundaries
* recommendation explanations
* taste profiles
* social relationships
* private lists
* analytics identifiers
* session replay
* IP addresses
* device and location-derived information

Use only the data necessary for the feature.

Do not broaden data collection merely because storage is available.

## Data ownership and access

For user-owned records:

* store owner identity explicitly
* enforce ownership server-side
* prevent ownership reassignment by ordinary users
* define public/private visibility
* ensure related records cannot bypass parent visibility
* consider deletion cascades carefully

For shared or public resources:

* define who may create, edit, publish, unpublish, and delete
* avoid using “public” as a substitute for an ownership model
* validate access through direct API calls, not only through the UI

## Data deletion and retention

Define deletion semantics for:

* account deletion
* watch history
* ratings
* mood sessions
* recommendations and impressions
* lists
* analytics identity
* generated summaries
* cached profiles
* uploaded media
* logs

Decide whether deletion is:

* immediate
* soft
* delayed
* anonymised
* retained for legal or security purposes

User-facing copy should match actual behavior.

Account deletion should not leave user-identifiable recommendation caches or orphaned private data unless deliberately retained and disclosed.

Do not promise deletion behavior that is not implemented.

## Observability and logs

Logs should help diagnose systems without becoming a secondary personal-data store.

Log:

* operation type
* internal correlation identifier
* outcome
* duration
* safe error category
* environment
* relevant version

Avoid logging complete:

* request bodies
* tokens
* user profiles
* free text
* external API responses
* database rows

Use structured logs and redaction.

Development logs may be more detailed, but do not assume development data is non-sensitive.

## Security headers and browser policy

Maintain browser security controls appropriate to the deployment platform.

Consider:

* Content Security Policy
* frame restrictions
* MIME sniffing protection
* referrer policy
* permissions policy
* transport security
* cross-origin isolation where relevant

Introduce CSP in report-only mode before enforcement when the existing application uses several third-party scripts, frames, workers, or inline styles.

Do not copy a CSP allowlist without verifying actual production requests.

Security-header changes require deployment-level validation because local builds alone cannot prove the platform serves them correctly.

## Incident response

When a credential or sensitive value is exposed:

1. stop further exposure
2. do not repeat the value
3. identify scope and affected environment
4. rotate or revoke the credential
5. review logs and recent usage
6. remove the value from active source
7. assess Git history and artifacts
8. document remediation
9. add prevention where appropriate

Deleting a secret from the latest commit does not remove it from history or make the credential safe again.

When unauthorised access or data exposure is suspected:

* preserve relevant evidence
* avoid destructive cleanup that removes logs
* restrict further access
* identify affected users and data
* follow the applicable incident and notification process

## Validation checklist

For a security- or data-sensitive change, report:

* target environment
* authentication model
* authorization model
* RLS or server-side enforcement
* secret exposure assessment
* migration and rollback
* data affected
* external processors affected
* tests run
* manual checks required
* remaining risk

Security review should focus on realistic abuse and failure paths, not only the expected UI flow.

## Updating this rule

Update this file when durable security architecture or data-handling standards change.

Do not include:

* real credential values
* current secret names that expose sensitive architecture unnecessarily
* exact production IDs
* temporary incident details
* current table counts
* one-time dashboard instructions
* volatile provider configuration

Place operational setup, current environments, variable names, and provider-specific runbooks in maintained reference or runbook documents.
