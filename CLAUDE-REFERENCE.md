# FeelFlick — Operational Reference

**Status:** Current operational reference
**Last verified:** 2026-06-07

> Load this file only when the task involves recommendation behavior, environments, deployment, authentication, Supabase, external services, caching, data pipelines, or operational debugging.
>
> Do not load it by default for ordinary UI or component work.
>
> This file records volatile facts. Verify important values from source, configuration, the database, or provider dashboards before making consequential changes.
>
> Durable standards belong in `.claude/rules/`. This file must not override the root `CLAUDE.md` or a relevant maintained rule.

## How to use this reference

Use this file to locate current facts and likely sources of truth.

Do not assume that:

* a remote environment matches local configuration
* a historical migration is still the active remote policy
* a comment reflects the active call path
* a constant applies to every recommendation surface
* a client-side guard provides authorization
* a public browser key is secret
* a successful admin query proves normal-user access
* an old test or audit snapshot is still current

When this file disagrees with implementation or runtime behavior, investigate and update this file after resolving the discrepancy.

## Source-of-truth map

| Fact                                         | Preferred source                                                                                |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Dependency versions                          | `package.json` and lockfile                                                                     |
| Available npm commands                       | `package.json`                                                                                  |
| Runtime routes                               | `src/app/router.jsx`                                                                            |
| Vite aliases and development server behavior | `vite.config.js`                                                                                |
| Browser environment variables                | `import.meta.env` usage and maintained env example                                              |
| Supabase local configuration                 | `supabase/config.toml`                                                                          |
| Hosted Supabase configuration                | Supabase dashboard, CLI inspection, or remote SQL                                               |
| Database schema                              | Applied migrations plus remote schema inspection                                                |
| RLS and grants                               | Remote policies/grants plus migration history                                                   |
| Edge Function behavior                       | `supabase/functions/*/index.ts` and deployed function configuration                             |
| Recommendation engine version                | `ENGINE_VERSION` in `src/shared/services/recommendations.js`                                    |
| Recommendation constants                     | Current source modules                                                                          |
| Recommendation quality tiers                 | `src/shared/services/qualityTiers.js`                                                           |
| Recommendation exclusions                    | `src/shared/services/exclusions.js`, `boundaries.js`, `skipSignals.js`, and profile computation |
| TMDB caching and rate limiting               | `src/shared/api/tmdb.js`                                                                        |
| Recommendation in-memory cache               | `src/shared/lib/cache.js`                                                                       |
| Taste-fingerprint cache                      | `src/shared/services/tasteCache.js`                                                             |
| Analytics behavior                           | `src/shared/services/analytics.js` and provider settings                                        |
| Sentry behavior                              | `src/main.jsx`, error-monitoring code, and provider settings                                    |
| Admin UI access                              | `src/app/router.jsx` and `src/app/admin/access.js`                                              |
| Real admin authorization                     | RLS, protected claims/tables, or server-side enforcement                                        |
| Test coverage and current failures           | Fresh command output                                                                            |
| Deployment state                             | Active hosting and provider dashboards                                                          |
| Design-system production values              | Current CSS, tokens, and loaded font configuration                                              |

## Current project snapshot

The repository currently uses JavaScript and JSX.

Current package versions should be read from `package.json`. As last verified:

| Package           | Version range |
| ----------------- | ------------- |
| React             | `^19.2.7`     |
| React DOM         | `^19.2.7`     |
| React Router DOM  | `^7.17.0`     |
| TanStack Query    | `^5.101.0`    |
| Supabase JS       | `^2.107.0`    |
| Framer Motion     | `^12.40.0`    |
| Tailwind CSS      | `^4.3.0`      |
| Vite              | `^8.0.16`     |
| Vitest            | `^4.1.0`      |
| Playwright        | `^1.60.0`     |
| Sentry React      | `^10.56.0`    |
| PostHog JS        | `^1.380.1`    |
| OpenAI JS package | `^6.42.0`     |
| Lucide React      | `^1.17.0`     |
| web-vitals        | `^5.3.0`      |

Do not duplicate these versions into the root `CLAUDE.md`.

## npm commands

Current scripts:

```bash
npm run dev
npm run build
npm run preview

npm run lint
npm run lint:fix

npm run test
npm run test:watch
npm run test:coverage

npm run test:e2e
npm run test:e2e:ui
npm run test:e2e:report

npm run test:visual
npm run test:visual:update

npm run supabase:init
npm run supabase:start
npm run supabase:login
npm run supabase:link
```

Before relying on a command, verify it still exists in `package.json`.

### Test routing

Current Playwright scripts use these projects:

* `public`
* `app`
* `visual`

Current Vitest configuration excludes:

* `src/shared/services/recommendations.test.js`
* `src/shared/services/__tests__/services.test.js`

Do not assume excluded files are valid coverage. Determine whether they are legacy manual scripts, obsolete tests, or work that should be migrated.

## Local development

The Vite development server currently uses:

* port `5173`
* `strictPort: true`
* `host: true`
* HMR protocol `wss`
* HMR client port `443`

The HMR settings support VS Code Remote Tunnels or similar HTTPS tunnel environments. If ordinary local HMR fails, inspect whether the forced WSS configuration is the cause before removing it.

Current aliases:

```text
@        → ./src
@assets  → ./src/assets
@shared  → ./src/shared
```

Typical startup:

```bash
npm install
npm run dev
```

Verify the active Node.js version with:

```bash
node --version
```

Do not preserve a machine-specific Node version here unless the repository adds an explicit `.nvmrc`, `.node-version`, or package-engine requirement.

## Local Supabase configuration

Current local ports in `supabase/config.toml`:

| Service                |    Port |
| ---------------------- | ------: |
| API                    | `54321` |
| Database               | `54322` |
| Shadow database        | `54320` |
| Studio                 | `54323` |
| Inbucket               | `54324` |
| Analytics              | `54327` |
| Edge runtime inspector |  `8083` |

Current local database major version:

```text
17
```

Important: local `supabase/config.toml` does not prove that the hosted project has matching settings.

### Local Auth configuration

Current local Auth configuration includes:

```text
site_url = http://127.0.0.1:3000
additional_redirect_urls = https://127.0.0.1:3000
```

The Vite application runs on port `5173`.

This mismatch may be intentional, stale, or incomplete. Verify OAuth and email-link behavior before changing it. Do not assume local Auth callbacks are correct merely because password authentication works.

## Environment-variable classification

### Browser-exposed configuration

Every `VITE_*` value is bundled into browser code and must be treated as public.

| Variable                 | Classification                      | Current role                                          |
| ------------------------ | ----------------------------------- | ----------------------------------------------------- |
| `VITE_SUPABASE_URL`      | Public client configuration         | Supabase project URL                                  |
| `VITE_SUPABASE_ANON_KEY` | Public project credential           | Browser Supabase access; RLS must enforce data access |
| `VITE_TMDB_API_KEY`      | Restricted public client credential | TMDB browser requests; users can extract it           |
| `VITE_ADMIN_EMAILS`      | Public UI configuration             | Client-side admin-route allowlist only                |
| `VITE_SENTRY_DSN`        | Public ingestion configuration      | Browser error-monitoring endpoint                     |
| `VITE_POSTHOG_KEY`       | Public analytics project key        | Browser analytics                                     |
| `VITE_POSTHOG_HOST`      | Public configuration                | Analytics ingest host                                 |

Do not describe a `VITE_*` variable as secret.

A public credential may still require provider restrictions, quotas, RLS, abuse monitoring, or server-side replacement.

### Server-only secrets

Treat these as server-only when present:

| Variable                                          | Classification           | Likely role                              |
| ------------------------------------------------- | ------------------------ | ---------------------------------------- |
| `OPENAI_API_KEY`                                  | Secret                   | Edge Function AI requests                |
| `SUPABASE_SERVICE_ROLE_KEY`                       | Highly privileged secret | Server-side operations that bypass RLS   |
| `TMDB_READ_ACCESS_TOKEN`                          | Server credential        | Vercel Edge middleware TMDB access       |
| OAuth provider client secrets                     | Secret                   | Provider configuration                   |
| Webhook signing secrets                           | Secret                   | External callback verification           |
| Deployment/provider API tokens                    | Secret                   | Cloud or CI operations                   |
| SMTP or email-provider credentials                | Secret                   | Transactional email                      |
| Sentry auth or management token                   | Secret                   | Release/source-map or project management |
| Database password or privileged connection string | Secret                   | Direct database access                   |

`SUPABASE_ANON_KEY` or a publishable key is not proof of user identity, even when read from a server environment.

### Local secret storage

Development test credentials may live in:

```text
.claude/local-secrets.json
```

This file must remain gitignored.

Never:

* print it
* paste its values into chat
* include it in screenshots
* add it to documentation
* commit it
* copy it into a public fixture

Use it only for approved local development authentication.

Current E2E authentication may rely on:

```text
E2E_TEST_EMAIL
E2E_TEST_PASSWORD
```

Verify the Playwright setup before using them.

## Deployment and origin references

Current Edge Function comments and allowlists reference:

* `https://app.feelflick.com`
* `https://feelflick.com`
* `https://www.feelflick.com`
* `https://feelflick-app.pages.dev`
* `http://localhost:5173`

Treat this as an application allowlist, not proof that every host is active or correctly configured.

The repository also contains Vercel Edge middleware for bot-specific metadata on:

* `/movie/:id`
* `/lists/:id`

Verify the active hosting platform and middleware deployment before relying on this behavior.

## Active external services

The codebase currently integrates with or references:

* Supabase Auth
* Supabase PostgreSQL
* pgvector-backed recommendation data
* Supabase Edge Functions
* TMDB API and image CDN
* OpenAI from server-side functions
* PostHog
* Sentry
* Google OAuth
* Vercel Edge middleware
* browser Web Vitals reporting

Do not assume a package or code path proves that the corresponding production service is enabled.

Verify provider configuration when the task depends on:

* billing
* retention
* consent
* quotas
* webhooks
* production origins
* scheduled jobs
* remote secrets
* deployment status

## Authentication reference

### Browser Supabase client

The browser client uses:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

The anon or publishable key is expected to be visible.

Security depends on:

* Auth session identity
* RLS
* grants
* server-side authorization for privileged actions

### OAuth callback

Current startup behavior in `src/main.jsx`:

1. inspect the URL hash before React mounts
2. require callback route `/auth/callback`
3. validate a stored OAuth nonce
4. read access and refresh tokens from the hash
5. call `supabase.auth.setSession`
6. strip tokens from the visible URL
7. mount the application
8. redirect safely on invalid callback state

Do not log callback URLs or tokens.

### Admin UI

Current client-side admin access compares the signed-in email against `VITE_ADMIN_EMAILS`.

This is only a UI and navigation guard.

It must not be treated as authorization for:

* privileged reads
* catalog mutations
* user-data access
* administrative RPCs
* Edge Function actions
* service-role operations

Real admin capabilities require server-enforced authorization.

## Analytics reference

Current PostHog configuration:

* `capture_pageview: false`
* `autocapture: false`
* heatmaps enabled
* session recording enabled
* form inputs masked
* `[data-ph-mask]` used for additional text masking
* user preference read from `user_settings.settings.privacy.analytics`
* only explicit `false` opts out
* preference-read failure currently leaves collection enabled

Current identity flow:

* initialise before React mounts
* identify authenticated user later
* fetch analytics preference during `identify`
* call `opt_out_capturing` for explicit opt-out
* reset identity on sign-out

Known privacy question:

> Analytics and replay may initialise before the stored preference is resolved.

Treat this as an active policy and implementation issue, not an accidental detail to ignore.

Before changing analytics:

* define the consent model
* define anonymous behavior
* define replay behavior
* define failure defaults
* verify actual provider retention
* test real replay output

## Sentry reference

Current browser Sentry configuration includes:

* production-only enablement
* browser tracing
* session replay
* `maskAllText: true`
* `blockAllMedia: false`
* traces sample rate `0.2`
* session replay sample rate `0.1`
* replay-on-error sample rate `1.0`

The browser DSN is public configuration.

Review whether movie imagery, URLs, component attributes, or state can expose private information despite text masking.

Do not assume masking remains correct as new components are added.

## TMDB reference

Current browser wrapper:

```text
src/shared/api/tmdb.js
```

Current API key source:

```text
VITE_TMDB_API_KEY
```

Because it is client-exposed, users can extract it.

### Rate limiting

Current in-browser limiter:

```text
maxRequests = 40
windowMs = 10_000
```

This is per browser tab/runtime and is not a provider-enforced security boundary.

### Cache TTLs

| Tier     |     Current TTL | Intended use                 |
| -------- | --------------: | ---------------------------- |
| `FAST`   |     `60_000` ms | Search and dynamic endpoints |
| `NORMAL` |    `300_000` ms | Discover and lists           |
| `SLOW`   | `43_200_000` ms | Details and credits          |

The cache is in memory and per tab.

### Retry policy

Current retry configuration:

| Setting            |                                    Value |
| ------------------ | ---------------------------------------: |
| Maximum retries    |                                      `3` |
| Base delay         |                               `1,000` ms |
| Maximum delay      |                               `8,000` ms |
| Retryable statuses | `408`, `429`, `500`, `502`, `503`, `504` |

When changing API behavior, consider:

* provider quotas
* duplicate retries
* aborted requests
* browser visibility
* stale cache
* concurrent request deduplication
* server-side proxying if secrecy or stronger abuse protection is required

## Recommendation-engine sources

Primary modules include:

```text
src/shared/services/recommendations.js
src/shared/services/scoringV3.js
src/shared/services/exclusions.js
src/shared/services/qualityTiers.js
src/shared/services/briefScoring.js
src/shared/services/boundaries.js
src/shared/services/skipSignals.js
src/shared/services/diversity.js
src/shared/services/heroReason.js
src/shared/services/tasteCache.js
src/shared/lib/cache.js
```

The engine still contains compatibility and legacy paths.

Before tuning a constant, identify which active surface and call path actually use it.

## Recommendation version and caches

### Engine version

Current source value:

```text
ENGINE_VERSION = '2.17'
```

Current comment says this version expanded gated genres to include:

* War
* Music
* Western
* TV Movie

An engine-version bump should occur only when cached computed state is semantically incompatible.

Do not bump it for formatting-only refactors.

### Short-lived profile and seed memory

Current in-module TTLs:

```text
PROFILE_MEMORY_TTL_MS = 60_000
SEED_MEMORY_TTL_MS = 60_000
```

These are process or page-runtime memory caches.

### General recommendation cache

Current default:

```text
5 minutes
```

Source:

```text
src/shared/lib/cache.js
```

The cache is exposed on `window.recommendationCache` in browser environments.

### Taste fingerprint cache

Current values:

```text
CACHE_TTL_MS = 24 hours
MIN_FILMS_FOR_FINGERPRINT = 5
```

Persistence:

```text
user_profiles_computed.taste_fingerprint
user_profiles_computed.taste_fingerprint_computed_at
```

The implementation writes only when computing the signed-in user’s own fingerprint.

## Headline recommendation constants

Current shared thresholds:

| Constant                      | Current value | Meaning                                                             |
| ----------------------------- | ------------: | ------------------------------------------------------------------- |
| `MIN_FF_RATING`               |         `6.5` | General minimum FeelFlick rating                                    |
| `MIN_FF_CONFIDENCE`           |          `50` | General minimum confidence                                          |
| `MIN_FILMS_FOR_LANGUAGE_PREF` |           `3` | Minimum history before language inference in the legacy/shared path |
| `MIN_FILMS_FOR_AFFINITY`      |           `2` | Minimum history before genre/director affinity                      |
| `MIN_VOTE_COUNT`              |         `150` | Main-pool TMDB vote floor                                           |
| Hidden-gems vote floor        |          `50` | Lower floor for intentionally obscure titles                        |
| `LIKELY_SEEN_WEIGHTS`         |       all `0` | Feature retained for compatibility but disabled                     |

Do not assume these headline thresholds govern every surface. Quality tiers and surface-specific gates can be stricter.

## Current quality tiers

Source:

```text
src/shared/services/qualityTiers.js
```

Values are on a `0–100` FeelFlick audience or critic scale.

| Tier            |      Audience min | Confidence min | Vote min | Other                    |
| --------------- | ----------------: | -------------: | -------: | ------------------------ |
| `HERO`          |              `78` |           `65` |    `200` | —                        |
| `NEIGHBOR`      |              `75` |           `30` |    `200` | Neighbor-language rescue |
| `SIGNATURE`     |              `75` |           `60` |    `200` | —                        |
| `CONTEXT`       |              `68` |           `50` |     none | —                        |
| `NICHE_CRITICS` | audience max `65` |           `50` |     none | critic min `72`          |
| `NICHE_UNDER90` |              `70` |           `50` |     none | runtime `60–90`          |

These are product hypotheses, not universal definitions of quality.

Audit their effect on:

* language
* decade
* country
* genre
* popularity
* catalog coverage
* user-specific high-fit titles

## Current hard-filter registry

This registry describes known paths that can remove a film before final selection.

Verify exact behavior from source before tuning.

### Watched exclusion

**Current behavior**

* Discover can exclude watched films.
* Some recommendation flows exclude watched titles by both internal ID and TMDB ID.

**Classification**

* Explicit flow rule for discovery.
* Not appropriate as a universal rule for rewatch-oriented experiences.

### Session runtime bands

Current Briefing runtime bands:

| Selection | Current hard filter      |
| --------- | ------------------------ |
| Short     | runtime `≤ 100` minutes  |
| Medium    | runtime `90–140` minutes |
| Long      | runtime `≥ 130` minutes  |

The overlap is intentional in current code.

Treat this as temporary session intent, not stable taste.

### Family context

The current Briefing flow can enable a family-friendly gate.

Verify the exact certification, genre, or keyword definition before modifying it.

Measure empty-pool and fallback behavior.

### Explicit content boundaries

Current preference semantics:

| Boundary                | Behavior     |
| ----------------------- | ------------ |
| Graphic violence        | Hard filter  |
| Explicit sexual content | Hard filter  |
| Harm to animals         | Warning only |
| Sensory-heavy content   | Warning only |

The current implementation uses curated TMDB keyword sets and treats `NC-17` as a sexual-content signal.

Do not silently convert warning-only boundaries into exclusions.

### Genre gates

The engine can derive excluded genre IDs from profile computation.

Current known gated genres include:

* Animation
* Family
* Documentary
* Horror
* War
* Music
* Western
* TV Movie

Known policy inconsistency:

* one profile path has historically excluded gated genres with zero watches and no explicit preference
* another legacy path has required two watches to unlock a genre

Before modifying genre behavior:

* identify the active path
* reconcile duplicate policies
* measure candidate loss
* preserve an exploration route
* distinguish absence of history from explicit dislike

### Language filter

Current unified exclusions:

* set a primary language only when profile logic establishes strong dominance
* v3 comments indicate an `80%` dominance threshold
* allow the primary language plus languages already present in watch history
* apply `.in('original_language', allowedLanguages)` at query level
* apply equivalent filtering client-side for RPC/TMDB results
* use a neighbor-language rescue path in some hero fallback flows

Known risk:

> Exposure history can be mistaken for language preference and reinforce a language bubble.

Before tuning:

* measure pool loss by language
* distinguish availability from preference
* inspect sparse and multilingual profiles
* verify rescue activation and acceptance

### Era floor

Current content gates:

* apply only after at least `10` watches
* derive `era_floor` from profile history
* hard-filter candidates below the floor

Known risk:

> A historical viewing pattern can permanently hide older cinema.

Treat this as a strong inferred preference requiring validation.

### Runtime-history floor

Current content gates:

* apply only after at least `10` watches
* use the lower value of the inferred `runtime_band`
* hard-filter shorter films below that value
* do not currently apply the upper runtime value in the unified DB exclusion path

Known inconsistency:

> Some older scoring paths treat runtime preference as a score penalty rather than a hard exclusion.

Reconcile policy before tuning either path.

### Pacing and intensity floors

Current content gates:

* apply after at least `10` watches
* use the user profile’s twentieth percentile
* convert the `1–10` profile percentile to the stored `0–100` movie score
* hard-filter candidates below the user’s inferred pacing floor
* hard-filter candidates below the user’s inferred intensity floor

Known risk:

> These filters can create a self-reinforcing content-shape bubble.

### Community high-skip exclusion

Current profile behavior has treated films as high-skip when they exceed approximately:

```text
40% skip rate
with at least 20 impressions
```

Unified exclusions can remove those movie IDs entirely.

Verify the exact active computation before relying on these numbers.

Known risk:

* niche titles
* challenging titles
* poorly targeted titles
* misleadingly presented titles

may be suppressed globally rather than for the cohorts that skipped them.

### Personal skipped-film exclusion

The client-side exclusion path removes IDs in:

```text
profile.negative.personal_skipped_ids
```

Other hero paths use cooldowns and decayed penalties rather than permanent removal.

This is a policy inconsistency.

Before changing skip behavior, identify which path controls the target surface.

### Skip cooldowns

Current cooldowns:

| Placement            | Cooldown |
| -------------------- | -------: |
| Hero skip            | `3` days |
| Any row/surface skip | `2` days |

These are more recoverable than permanent exclusion.

### Skip decay

Current recency weights:

| Skip age        | Weight |
| --------------- | -----: |
| Under `7` days  |  `1.0` |
| Under `30` days |  `0.6` |
| Under `90` days |  `0.3` |
| `90+` days      | `0.15` |

Hero skips have severity multiplier:

```text
1.5
```

Most other known placements use:

```text
1.0
```

Very old skips never fully decay to zero.

Treat the `0.15` floor as a tuneable hypothesis.

### Muted directors and explicit preferences

Current user settings can include:

* `moodWeights`
* `trustedDirectors`
* `mutedDirectors`
* `runtimeFloor`
* `runtimeCap`
* `subscriptions`
* `boundaries`

Explicit muted creators and user-selected constraints should generally be stronger than inferred preferences.

Verify whether each field is currently a hard filter, score modifier, UI-only control, or unused value.

### Quality floors

Quality tiers are hard query filters.

The hero tier currently requires:

```text
ff_audience_rating >= 78
ff_audience_confidence >= 65
vote_count >= 200
```

This occurs before later scoring and can dominate catalog exposure.

### Final score gates and fallback

Known current hero behavior has used:

* final personalized gate around `50`
* weak-personalization or neighbor rescue gate around `30`
* a small diversified passed set
* stable day-based selection from passed candidates

Verify exact active values and selection order in `recommendations.js` before tuning.

Track:

* personalized pass rate
* fallback rate
* fallback acceptance
* empty-pool rate
* pass rate by profile maturity
* pass rate by language and mood

### Profile maturity

Known active personalization logic has used thresholds similar to:

```text
at least 3 positive seeds
or at least 5 watches
```

Verify the active path.

Do not apply mature-profile hard gates to cold-start users.

## Current scoring model

Current v3 scoring combines dimensions including:

* embedding similarity
* fit-profile alignment
* mood coherence
* director affinity
* genre affinity
* content-shape alignment
* quality
* negative signals

Different surfaces may use different weight presets.

Do not assume one global set of weights.

Before changing scoring:

1. identify the active surface
2. identify the active scoring function
3. identify pre-scoring hard filters
4. compare before-and-after candidate pools
5. inspect correlated penalties
6. confirm explanation behavior
7. plan cache invalidation
8. preserve rollback

## Known recommendation-policy conflicts

Investigate these before broad engine tuning:

1. **Genre unlock threshold**

   * zero-watch exclusion in one profile path
   * two-watch unlock policy in an older path

2. **Skip semantics**

   * permanent personal-skip exclusion in unified client filtering
   * cooldown and decay in hero logic

3. **Runtime semantics**

   * inferred lower bound as a hard filter
   * explicit floor/cap handled differently in older scoring

4. **Legacy and v3 scoring**

   * active and compatibility paths coexist
   * tuning the wrong path may have no user-visible effect

5. **Language policy**

   * strict filtering and rescue behavior differ by candidate path

6. **Quality policy**

   * headline thresholds and quality tiers overlap but are not identical

7. **Circular dependency**

   * `recommendations.js` imports `exclusions.js`
   * `exclusions.js` lazily accesses exports from `recommendations.js`

Treat these as migration and ownership issues, not merely code-style concerns.

## Recommendation evaluation reference

For behavior-changing engine work, capture:

### Pool stages

```text
catalog eligible
→ after identifier/data validation
→ after watched exclusion
→ after explicit boundaries
→ after genre gates
→ after language filter
→ after era/runtime/pacing/intensity gates
→ after community skip exclusion
→ after personal skip/cooldown
→ after quality floor
→ after scoring threshold
→ after diversity
→ final selection
```

### Required comparisons

Include representative:

* signed-out or cold-start user
* onboarding-only user
* sparse history
* mature history
* narrow-language history
* multilingual history
* narrow-genre history
* broad taste
* repeated skipper
* explicit boundaries
* uncommon mood
* short-runtime request
* long-runtime request
* low-candidate-pool case

### Catalog-health dimensions

Measure:

* language
* decade
* country
* genre
* runtime
* popularity
* director concentration
* repeated-title rate
* catalog coverage
* fallback concentration

## Edge Functions

Known function directories:

```text
supabase/functions/ai-mood-context/
supabase/functions/generate-taste-summary/
supabase/functions/generate-movie-overlay/
supabase/functions/generate-reflection-prompt/
```

Verify the complete directory list before deployment work.

### Current authentication pattern

Known AI functions compare the `Authorization` bearer value to `SUPABASE_ANON_KEY`.

That verifies possession of a public project key.

It does not authenticate an individual user.

Classify each function explicitly as:

* authenticated-user function
* public function
* internal service function
* signed webhook

Then apply an appropriate authentication and authorization model.

### `ai-mood-context`

Current characteristics include:

* OpenAI server-side call
* model historically set to `gpt-4.1-mini`
* parse action for free-text mood signals
* streaming explanation mode
* CORS allowlist
* in-memory IP rate limiting
* anon-key equality check
* user-provided mood/context data sent to OpenAI

Known risks:

* public project-key access can be automated outside the app
* in-memory rate limits are per instance and reset
* `x-forwarded-for` may not be a trustworthy identity
* CORS is not authentication
* unknown-origin fallback currently returns the first allowed origin
* free text may contain sensitive personal information
* model output must remain untrusted and validated

### CORS

Current known allowlist contains production, apex, preview, and local origins.

For dynamic origin handling:

* return the matching origin only
* omit or reject for unknown origins
* include `Vary: Origin`
* allow only required headers and methods

### AI output

AI-generated:

* scores
* explanations
* tags
* summaries
* overlay copy
* reflection prompts

must be treated as untrusted output.

Validate:

* JSON shape
* identifiers
* score ranges
* allowed vocabularies
* text length
* grounding
* fallback behavior

Do not allow generated text to invent recommendation evidence.

## Scheduled jobs and remote-only state

Repository migrations and historical documents may reference:

* `refresh_feelflick_stats()`
* pg_cron jobs
* catalog pipelines
* daily briefing or email workflows
* embedding pipelines
* data backfills

Do not state that a scheduled job is active until remote state is inspected.

For cron or scheduled work, verify:

* active job
* schedule
* timezone
* owner
* credentials
* last successful run
* failure alerting
* idempotency
* lock behavior
* cost
* rollback

## Middleware reference

Current Vercel Edge middleware:

* runs only for bot user agents
* matches `/movie/:id` and `/lists/:id`
* fetches movie metadata from TMDB
* fetches public list data from Supabase REST
* injects Open Graph and Twitter metadata
* escapes attribute values before insertion

Server environment references include:

```text
TMDB_READ_ACCESS_TOKEN
SUPABASE_URL
SUPABASE_ANON_KEY
```

The Supabase anon key is acceptable for public-list reads only if RLS and grants enforce public visibility correctly.

## Known operational risks

### High priority

1. **AI Edge Functions use public anon-key equality as authorization**

   * This is not user authentication.
   * Decide whether each function is intentionally public.

2. **Client admin allowlist is not authorization**

   * `VITE_ADMIN_EMAILS` is public.
   * Sensitive admin data and actions require server enforcement.

3. **Analytics preference is resolved after initialisation**

   * Collection may begin before stored opt-out is known.
   * Preference-read failure currently defaults to collection.

4. **TMDB browser key is public**

   * Do not classify `VITE_TMDB_API_KEY` as secret.
   * Use restrictions, monitoring, or a server proxy if needed.

5. **Recommendation hard filters are distributed**

   * A change in one module may not affect every path.
   * Maintain the hard-filter registry.

### Medium priority

6. **Edge Function rate limiting is instance-local**

   * Not durable global abuse protection.

7. **Unknown CORS origin fallback is confusing**

   * Return no allow-origin header for unknown origins.

8. **Local Supabase Auth URL uses port 3000**

   * Vite currently uses 5173.
   * Verify callback behavior.

9. **Recommendation legacy and v3 paths coexist**

   * Policy and tuning can diverge.

10. **PostHog and Sentry replay require actual-output review**

    * Configuration alone does not prove privacy.

11. **Current Vitest excludes recommendation-related files**

    * Determine whether useful coverage is being skipped.

12. **Remote state may diverge from migrations**

    * Inspect remote RLS, grants, functions, Auth, secrets, and cron before consequential work.

## Known documentation risks

Remove or update documentation that claims:

* React 18 is current
* purple and pink are permanent brand law
* Outfit is permanently required
* a specific MovieCard hover can never be redesigned
* all Supabase edits require approval before local drafting
* `VITE_TMDB_API_KEY` is secret
* `VITE_SENTRY_DSN` is secret
* the shared Modal is fully focus-trapped without runtime verification
* a specific browse token holdout remains without checking current source
* current test counts are durable facts
* every installed skill auto-invokes automatically
* the old `CLAUDE.md` overrides explicit redesign tasks

## Maintenance procedure

Update this file when any of these change:

* package versions with operational implications
* npm commands
* environment-variable names or classification
* deployment origins
* Auth flow
* recommendation engine version
* recommendation caches
* hard filters
* quality tiers
* Edge Functions
* scheduled jobs
* analytics or replay behavior
* known security risks
* remote environment architecture

When updating:

1. verify the source
2. add a new `Last verified` date
3. avoid fragile line-number references
4. remove superseded facts
5. preserve unresolved issues as clearly labelled risks
6. do not copy durable standards from `.claude/rules/`
7. do not include credential values
8. do not include temporary test-count snapshots
9. do not claim remote configuration without remote inspection
10. keep historical reasoning in `docs/`, not here

## Operational checklists

### Before recommendation work

* read `.claude/rules/recommendation-engine.md`
* identify the active surface and call path
* verify `ENGINE_VERSION`
* inventory active hard filters
* inspect relevant data
* measure candidate pools
* compare representative profiles
* plan cache invalidation
* define rollback

### Before Supabase work

* read `.claude/rules/security-and-data.md`
* identify local versus remote environment
* inspect current schema and policies
* determine caller role
* test owner and non-owner access
* draft migrations locally
* confirm before remote application
* preserve migration history

### Before Edge Function work

* classify the function
* verify authentication
* verify authorization
* verify secret placement
* validate input and output
* inspect CORS
* inspect rate limiting
* consider provider cost
* test failure behavior
* confirm before deployment

### Before analytics or replay work

* identify the product decision supported
* inspect consent and opt-out timing
* inspect captured fields
* inspect replay masking
* test actual provider output
* document retention
* confirm production configuration changes

### Before deployment-sensitive work

* identify active host and environment
* inspect current platform configuration
* verify environment variables
* verify redirects and OAuth origins
* verify security headers
* run relevant build and browser checks
* define rollback
* confirm before production changes
