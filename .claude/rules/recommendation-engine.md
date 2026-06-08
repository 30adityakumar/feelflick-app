---
paths:
  - "src/shared/services/recommendations.js"
  - "src/shared/services/scoringV3.js"
  - "src/shared/services/exclusions.js"
  - "src/shared/services/qualityTiers.js"
  - "src/shared/services/briefScoring.js"
  - "src/shared/services/boundaries.js"
  - "src/shared/services/skipSignals.js"
  - "src/shared/services/diversity.js"
  - "src/shared/services/heroReason.js"
  - "src/shared/services/tasteCache.js"
  - "src/shared/lib/cache.js"
  - "src/features/discover/**"
  - "src/features/preferences/**"
  - "src/features/onboarding/**"
  - "supabase/functions/ai-mood-context/**"
  - "supabase/functions/generate-taste-summary/**"
  - "supabase/functions/generate-movie-overlay/**"
  - "supabase/functions/generate-reflection-prompt/**"
  - "scripts/**/*recommend*"
---

# FeelFlick recommendation-engine guidance

## Purpose

This file defines durable standards for recommendation-engine work.

It applies to:

* candidate generation
* hard filters
* scoring and ranking
* mood and context interpretation
* taste-profile computation
* embeddings and similarity
* skips and negative signals
* quality gating
* diversity and exploration
* recommendation explanations
* caching and engine versions
* recommendation analytics
* catalog pipelines
* recommendation-facing database functions

Exact thresholds, cache durations, model versions, and current implementation constants belong in `CLAUDE-REFERENCE.md` or source code.

## Product objective

The engine should help a user find a film that fits:

* who they are
* what they want now
* their practical context
* their stated boundaries
* their evolving taste

A recommendation should be:

* relevant
* high enough quality to deserve the user’s time
* explainable
* appropriately novel
* emotionally coherent
* diverse over time
* responsive to feedback
* honest about uncertainty

The goal is not to maximize a single score.

The goal is to produce decisions users are glad they made.

## Existing behavior is evidence, not law

The current engine contains deliberate work and useful protections.

It also contains assumptions accumulated across versions.

Do not change filters or weights casually.

Do not preserve them automatically merely because they already exist.

Classify each relevant rule as one of:

1. explicit user constraint
2. integrity or eligibility requirement
3. trust or quality protection
4. inferred preference
5. ranking heuristic
6. exploration or diversity policy
7. operational limit
8. historical compatibility behavior

The classification determines how strongly the rule should be preserved.

## Recommendation pipeline

Before changing behavior, identify the affected stage.

A typical recommendation pipeline includes:

1. user and session signal collection
2. profile or context derivation
3. candidate retrieval
4. eligibility and exclusion filtering
5. feature computation
6. scoring
7. diversity or de-duplication
8. thresholding
9. final selection or rotation
10. explanation generation
11. impression logging
12. feedback and learning
13. cache invalidation or refresh

A change at an early stage can remove candidates before later scoring has any opportunity to recover them.

Do not evaluate only the final ranking.

Inspect candidate loss at every affected stage.

## Filter taxonomy

### Explicit user constraints

Explicit user constraints should generally be honored strongly.

Examples include:

* content boundaries
* intentionally avoided genres
* muted creators
* runtime limits entered for the current session
* family-safe context
* watched-title exclusion when the user requested discovery
* accessibility needs
* language constraints explicitly selected by the user

When an explicit constraint leaves no viable recommendation:

* do not silently ignore it
* explain that no strong match was found
* offer a clear way to relax the relevant constraint
* preserve the user’s other boundaries
* do not substitute an unrelated popular film without disclosure

Distinguish stable preferences from temporary session needs.

A short-runtime request tonight should not automatically become a permanent taste assumption.

### Integrity and eligibility requirements

Integrity filters protect the system from invalid or unusable candidates.

Examples include:

* missing internal or external identifiers required by the flow
* duplicate candidates
* deleted or unavailable records
* malformed metadata that makes the surface unusable
* content the user has already completed when the mode requires unseen films
* records the user is not permitted to access
* unsupported media types for a film-only surface

These may be strict, but their effect should still be measured.

Do not use missing optional metadata as a reason to remove otherwise valuable films unless the experience genuinely depends on it.

### Trust and quality protections

Quality filters are intended to avoid low-confidence or poor recommendations.

They may use:

* audience rating
* critic rating
* confidence
* vote count
* metadata completeness
* catalog curation
* surface-specific quality tiers

These are product hypotheses, not objective truths.

Quality protections can introduce bias toward:

* popular films
* English-language films
* recent films
* widely distributed films
* films with more online engagement
* culturally dominant audiences
* established filmmakers

Audit both recommendation quality and catalog exclusion.

Do not describe popularity or vote volume as quality.

### Inferred preference filters

Inferred preferences should usually be softer and easier to escape than explicit constraints.

Examples include:

* inferred language preference
* inferred era floor
* inferred runtime range
* inferred pacing or intensity range
* unwatched genre gates
* creator or genre fatigue
* community skip behavior
* taste-profile boundaries

An inferred preference is uncertain.

Hard-filtering on inferred behavior can create self-reinforcing bubbles because excluded content never receives exposure or feedback.

Before making an inferred signal a hard filter, establish:

* enough supporting data
* a clear user benefit
* acceptable candidate-pool loss
* an escape or exploration path
* behavior for sparse profiles
* behavior for users whose taste changes
* behavior across cultures and languages

Prefer scoring, diversification, or bounded exploration when a strict exclusion is not necessary.

### Ranking heuristics

Ranking heuristics determine order rather than eligibility.

Examples include:

* embedding similarity
* fit-profile alignment
* mood coherence
* genre and director affinity
* content-shape similarity
* quality
* negative-signal penalties
* trusted or muted creator weights
* recency
* discovery potential

Weights are not facts.

They encode a product judgment about trade-offs.

Change them through comparative evaluation rather than intuition alone.

### Diversity and exploration policies

Diversity should prevent repetitive output without making recommendations arbitrary.

It may consider:

* director
* genre
* era
* language
* country or region
* popularity
* familiarity
* representation
* fit profile
* mood or tone
* recent exposure

Diversity may apply:

* within a shortlist
* across rows
* across sessions
* across a longer recommendation history

Do not optimize only for within-row variety while repeatedly recommending the same narrow catalog over time.

Do not force diversity dimensions that materially reduce fit without understanding the trade-off.

### Operational limits

Operational constraints include:

* query limits
* rate limits
* cache TTLs
* embedding dimensions
* candidate-pool caps
* RPC cost
* timeout behavior
* external API budgets
* batch size

These affect recommendation quality indirectly.

Document when a ranking or filtering choice exists primarily because of infrastructure limitations.

Do not present an operational compromise as a product principle.

## Current filter registry

The engine should maintain a documented registry of all active hard filters and major score gates.

For each filter, record:

* name
* pipeline stage
* source file and function
* whether it is explicit or inferred
* trigger condition
* excluded population
* fallback behavior
* rationale
* owner
* measurement
* date last validated

The registry belongs in `CLAUDE-REFERENCE.md` or a generated recommendation reference—not duplicated throughout project guidance.

The current implementation includes at least the following categories.

### Session-brief filters

The current Discover brief can:

* exclude watched films
* impose runtime bands
* enable a family-friendly restriction
* change mood, fit, and embedding weights
* inject an anchor film as a temporary seed

These should be evaluated as session intent, not permanent taste.

### Content-boundary filters

Current boundaries distinguish between:

* constraints that remove a film
* warnings that preserve the film but inform the user

Do not combine all content sensitivities into the same behavior.

A content-warning signal should not become a hard exclusion unless the user explicitly requested exclusion or product evidence supports that interpretation.

### Genre gates

The current engine can exclude selected genres until it sees sufficient user evidence.

Genre gates are particularly likely to create exposure loops:

1. the user has not watched a genre
2. the genre is excluded
3. the user never sees it
4. the engine continues to interpret absence as disinterest

Genre absence is not the same as dislike.

Explicit avoidance and repeated negative feedback are stronger evidence than no watch history.

Keep a controlled discovery path for untested genres.

### Language filtering

The current engine can infer a primary language and restrict candidates to languages already present in watch history, with a neighboring-language rescue path in some flows.

Language filtering must be audited carefully.

Watching mostly one language may reflect:

* catalog availability
* onboarding defaults
* regional distribution
* previous recommender bias
* subtitle availability
* genuine preference

Do not interpret exposure history as preference without considering those alternatives.

A language preference should not eliminate international discovery unless the user explicitly requests restriction.

### Era, runtime, pacing, and intensity gates

The engine can derive content-shape boundaries from watch history.

These may improve immediate fit but can also narrow future discovery.

Use sufficient sample sizes.

Prefer tolerance ranges over precise imitation.

Do not assume that a user who usually watches one pace, era, or runtime never wants contrast.

Separate:

* stable aversion
* observed habit
* temporary session context
* discovery opportunity

### Watched, skipped, and cooldown filters

Watched exclusion is appropriate when the user wants discovery, but rewatches can be valid in other modes.

Skips should influence future recommendations without becoming permanent unexplained bans.

A skip may mean:

* not tonight
* already seen elsewhere
* wrong mood
* bad recommendation
* no interest
* unavailable
* disliked poster or presentation
* accidental dismissal

Use recency, repetition, placement, and explicit follow-up feedback to distinguish these meanings.

Cooldowns are generally safer than permanent exclusion.

Exceptional-quality overrides should be used cautiously and transparently; high aggregate ratings do not automatically justify ignoring a user’s repeated rejection.

### Community behavior filters

Community skip or engagement data may identify broadly weak recommendations.

It can also suppress:

* niche films
* challenging films
* films shown to the wrong audience
* films with misleading presentation
* culturally specific films
* content that is valuable to a smaller segment

Community behavior should usually inform ranking or surface-specific policy rather than silently erase a film for every user.

Segment community signals where possible.

### Quality tiers and vote floors

Surface-specific quality tiers can protect trust.

Audit them for:

* percentage of catalog removed
* language distribution
* decade distribution
* genre distribution
* country distribution
* popularity distribution
* new-release behavior
* underrepresented catalog segments
* user-specific high-fit titles lost

A different surface may justify a different quality-confidence trade-off.

The primary recommendation can be stricter than exploratory browse, but should not become a popularity-only system.

### Score gates and fallback paths

Final score thresholds determine whether personalized candidates survive.

A high-quality scoring model can still produce poor output if the threshold routes too many users into a generic fallback.

Track:

* pass rate
* fallback rate
* fallback quality
* fallback acceptance
* pass rate by user maturity
* pass rate by language profile
* pass rate by selected mood
* pass rate after each filter stage

Fallback should remain relevant to the user’s active context where possible.

Do not hide a weak personalized pipeline behind a strong generic fallback.

## Current scoring model

The current v3 model combines dimensions including:

* embedding similarity
* fit-profile alignment
* mood coherence
* director and genre affinity
* content shape
* film quality
* negative signals

Different surfaces may use different weight presets.

The current implementation also contains older scoring paths retained for compatibility.

Before changing scoring:

* identify which path the target surface actually uses
* identify whether older and newer paths disagree
* identify duplicated logic
* avoid tuning a deprecated path while assuming the active path changed
* decide whether compatibility code should be migrated or removed

Do not maintain multiple scoring systems indefinitely without a clear ownership and migration plan.

## Cold start and profile maturity

Cold-start behavior should provide useful results before the user has extensive history.

Distinguish profiles such as:

* signed-out or anonymous
* onboarding-only
* a few explicit ratings
* a few completed watches
* moderate history
* mature history
* stale or contradictory history

Do not apply mature-profile inference gates to sparse users.

Explicit onboarding and rating signals can be more valuable than raw watch count.

As behavioral evidence grows:

* reduce reliance on onboarding assumptions
* increase confidence gradually
* retain user control
* avoid sudden unexplained recommendation shifts

Profile-confidence labels should correspond to actual reliability and be used consistently.

## Mood and context

Mood should represent present intent rather than merely reproduce recent viewing history.

Separate:

* current selected mood
* recent mood behavior
* stable taste
* film tone
* desired emotional outcome
* intensity or energy
* attention
* time
* company

“Feeling sad” does not necessarily mean “show a sad film.”

The user may want:

* resonance
* comfort
* catharsis
* escape
* contrast
* challenge

Mood interpretation should be explicit enough to test.

Do not collapse complex emotional intent into simple tag overlap without evaluating outcomes.

## Embeddings and similarity

Embedding similarity is useful for discovering relationships that metadata misses.

It should not become an unexamined truth signal.

Validate:

* embedding input text
* model version
* normalization
* similarity distribution
* neighbor quality
* multilingual behavior
* metadata leakage
* catalog coverage
* stale embeddings
* missing vectors
* seed selection
* anti-seed behavior

High cosine similarity does not guarantee that a film fits the current mood or practical context.

Embedding changes may require:

* pipeline recomputation
* cache invalidation
* comparison against prior neighbors
* cost assessment
* rollback data

Never expose server-side embedding or OpenAI secrets to the client.

## Negative signals

Negative signals should be proportionate and recoverable.

Consider:

* explicit dislike
* low rating
* repeated skip
* one-time skip
* incomplete watch
* muted creator
* avoided genre
* content boundary
* community skip
* anti-seed similarity

These signals do not have equal meaning.

Avoid stacking several correlated penalties until a candidate is effectively impossible to recover.

Audit double-counting.

For example, one disliked film may simultaneously affect:

* anti-seed similarity
* genre penalty
* director penalty
* fit-profile penalty
* skip weight
* content-shape inference

Document when several dimensions derive from the same underlying event.

## Explanations

Recommendation explanations are part of the product, not decorative copy.

An explanation should be traceable to real signals.

It may refer to:

* current mood or context
* a genuinely similar film the user liked
* a trusted director or genre
* content-shape alignment
* quality
* novelty
* a stated preference

Do not generate reasons that are merely plausible but unsupported.

Do not imply that one visible reason fully caused a multi-signal ranking.

Avoid false precision.

Prefer:

> You asked for something warm and unhurried, and this shares the quiet character focus you liked in Past Lives.

Over:

> This is a 94.7% perfect match.

When uncertainty is material, express it honestly.

Log enough structured reason information to audit whether displayed explanations correspond to scoring signals.

## Data-first analysis

Behavior-changing recommendation work should begin with data.

Before changing a filter, threshold, weight, or fallback:

1. define the user-visible problem
2. reproduce representative current outputs
3. measure candidate counts before and after each affected stage
4. inspect catalog and user-cohort distributions
5. identify which films and users gain or lose exposure
6. compare expected effects against actual recommendation events
7. define success and guardrail metrics
8. preserve a rollback path

Data-first does not mean every pure refactor requires a production database query.

A read-only refactor with unchanged behavior may rely on tests and equivalence checks.

A change to recommendation behavior requires evidence appropriate to its impact.

Do not stop at global averages.

Segment where relevant by:

* profile maturity
* language history
* country or region
* genre breadth
* era preference
* mood
* runtime request
* history size
* accessibility or content boundaries
* active versus returning users

## Candidate-pool audit

For a behavior change, produce a stage-by-stage pool report when practical.

Example stages:

| Stage                          | Count | Removed | Main reason |
| ------------------------------ | ----: | ------: | ----------- |
| Catalog eligible               |       |         |             |
| After ID/data checks           |       |         |             |
| After watched exclusion        |       |         |             |
| After user boundaries          |       |         |             |
| After inferred profile filters |       |         |             |
| After quality floors           |       |         |             |
| After cooldown/skip logic      |       |         |             |
| After scoring threshold        |       |         |             |
| After diversity                |       |         |             |
| Final selected set             |       |         |             |

Include distributions when the change may affect:

* language
* decade
* country
* genre
* popularity
* gender or creator representation
* runtime
* rating confidence

A filter that removes only a small global percentage may still erase an important cohort.

## Evaluation

Recommendation evaluation should include several kinds of evidence.

### Offline comparison

Compare before and after output for representative profiles and sessions.

Include:

* cold-start user
* onboarding-heavy user
* mature profile
* narrow-language history
* multilingual history
* narrow-genre history
* broad taste
* repeated skipper
* user with explicit boundaries
* uncommon mood or context
* sparse candidate pool

Review both rank order and excluded candidates.

### Behavioral metrics

Potential outcome metrics include:

* recommendation acceptance
* watch-intent action
* watch completion where available
* skip rate
* repeated skip rate
* save-to-watch conversion
* explanation engagement
* explicit fit feedback
* fallback rate
* time to decision
* repeat use
* user-reported satisfaction

Do not optimize one metric in isolation.

Lower skip rate may result from safer, less interesting recommendations.

Higher click rate may result from misleading posters or copy.

### Catalog-health metrics

Track:

* catalog coverage
* unique films exposed
* repeated-title rate
* director concentration
* genre concentration
* language concentration
* decade concentration
* popularity concentration
* exploration acceptance
* long-tail exposure
* fallback concentration

### Guardrail metrics

Monitor:

* mediocre-title exposure
* explicit-boundary violations
* watched-title leakage
* invalid recommendation reasons
* empty-result rate
* latency
* error rate
* cache-staleness incidents
* recommendation repetition

## Experiments and rollout

For meaningful ranking or filtering changes:

* state the hypothesis
* define the comparison
* isolate the changed variables
* determine affected cohorts
* record the engine version or experiment assignment
* keep rollback simple
* avoid overwriting the previous evaluation data
* monitor both user outcomes and catalog-health guardrails

Use gradual rollout when the change is high impact.

Do not convert an experiment into a permanent rule solely because one headline metric improved.

## Caching and engine versions

Caches can make a correct code change appear ineffective or produce mixed behavior.

Before changing profile computation, scoring inputs, exclusions, or candidate logic, identify:

* profile cache
* taste or fingerprint cache
* in-memory cache
* query cache
* recommendation result cache
* browser cache
* pipeline-generated data

Bump an engine or profile version when cached computed state is no longer semantically compatible.

Do not bump versions for formatting-only or behavior-neutral refactors.

A version bump should include:

* reason
* affected cache
* expected recomputation cost
* rollout impact
* rollback behavior

Avoid using a version bump as a substitute for understanding invalidation.

## Logging and privacy

Log enough to evaluate recommendation quality without exposing unnecessary personal data.

Prefer structured identifiers and derived signals over raw private text.

Do not log:

* secrets
* OAuth tokens
* private profile content unrelated to evaluation
* unrestricted free-text mood input when a safer derived representation is sufficient
* full user histories in ordinary client logs

Recommendation analytics should distinguish:

* impression
* visible exposure
* click
* save
* skip
* watch intent
* completed watch
* rating
* explicit feedback

Do not infer a completed watch from a click.

## Failures and fallback

When recommendation services fail:

* preserve user boundaries
* avoid presenting random content as personalized
* distinguish generic fallback from personalized output
* provide a useful recovery path
* log the failure
* avoid exposing internal errors

A fallback should degrade capability honestly.

For example:

> We couldn’t fully personalize this pick, so here is a highly regarded option matching tonight’s mood.

is more trustworthy than silently showing a generic result with a personalised label.

## Refactoring

Recommendation code may be refactored when behavior is preserved or deliberately migrated.

For behavior-preserving refactors:

* characterize current output
* add or retain tests
* compare candidate and score outputs
* avoid changing constants incidentally
* confirm active call paths
* identify circular dependencies
* remove obsolete compatibility paths only when consumers are migrated

For behavior-changing refactors, follow the full evaluation process.

Do not allow “cleanup” to hide a scoring-policy change.

## Updating this rule

Update this file when durable recommendation standards change.

Do not place volatile values such as:

* exact score weights
* current engine version
* exact quality thresholds
* cache durations
* line numbers
* current table counts
* current model identifiers

in this rule.

Maintain those in source and `CLAUDE-REFERENCE.md`.

When implementation changes, update the hard-filter registry so the product always has an accurate account of what can remove a film before final selection.
