# Film File social-content & privacy policy (F5.6)

**Status:** current · implementation-specific · **not legal advice or final privacy approval.**
**Scope:** the `/movie/:id` Film File social-proof surfaces — `Friends Loved` and `Taste Twin` — as rendered by `SocialContext` (`src/features/movie/components/SocialContext.jsx`). This records the rule applied in F5.6; it does not change any query, hook, similarity calculation, or stored data.

## Friends Loved — identified presentation is permitted

- **Data source:** `useFriendsLoved` reads the current user's `user_follows` (who *they* follow), then those followed users' `user_ratings` for this film (`rating ≥ 8`), including `user_ratings.review_text`.
- **Truth:** the rating and the review text are **real `user_ratings` content** authored by real users. Friends without a note still contribute honestly to the rating summary; no fabricated fallback note is ever shown.
- **Why identity is allowed:** the relationship is an **explicit follow** initiated by the current user. Showing a followed user's name, avatar, rating, and note is consistent with that intentional, user-initiated relationship.
- **Empty behaviour:** self-hides when there are no qualifying followed-user ratings.
- **Presentation (F5.6):** a compact "{n} {person/people} you follow loved this" summary + an avatar stack + real notes rendered inline inside the single collapsed disclosure (the old nested *See their notes / Hide notes* toggle was removed — the outer disclosure is the one toggle). Avatar images use `alt=""` because the name is adjacent.

## Taste Twin — anonymised presentation

- **Data source:** `useTasteTwin` selects, from `user_similarity` (profile-level overall similarity), the highest-similarity user who has rated *this* film, and returns their real `user_ratings.rating` + `user_ratings.review_text` + `rated_at`, plus `name`, `avatar_url`, and a UUID-derived avatar colour.
- **Truth that is kept verbatim:** the **rating, the review text, the watched/rated date, and the exact `overall_similarity` value** are real and unchanged. The similarity number is **overall profile similarity, not film-specific agreement** — it is labelled `"{n}% overall taste similarity"`.
- **Identity is hidden on the Film File.** The current schema and hooks contain **no explicit public-profile, public-review, or taste-twin-visibility/consent field**. A taste twin is a *stranger* surfaced by an algorithm (unlike a follow, which the user chose). Therefore the Film File:
  - does **not** display the twin's name,
  - does **not** display the twin's avatar URL,
  - does **not** display identity-derived initials,
  - does **not** use the UUID-derived identity colour,
  - includes **no accessible label/alt text containing their name**.
  - uses the neutral label **"A taste twin"** + a generic, identity-free, `aria-hidden` glyph.
- **The review is real.** When a note exists it is shown verbatim and framed as a real user note (quotation styling is appropriate because it *is* real user-authored text). It is **never** labelled "generated." When no note exists, the honest rating-only fallback ("No note yet — just the rating.") is preserved.
- **Re-identification is a future, explicit decision.** Surfacing the twin's identity here requires a deliberate product/privacy decision **and an enforceable eligibility field/policy** (e.g. an opt-in public-review / public-taste-twin flag), checked by the hook or schema.

## "New to you" deferral (exploration tail)

The old Director Shelf showed a `NEW TO YOU` badge whenever the user had **no rating row** for a film. "No rating" is **not** a genuine seen/unseen signal (a user may have watched a film without rating it), so the badge could mislead. F5.6 **drops `NEW TO YOU`** and keeps only the real `{n}★ YOU` rating badge. Re-introducing a seen/unseen badge requires a genuinely **history-backed** field; deferred.

## General rules applied

- **Cross-user-readable RLS is NOT treated as consent.** That `user_ratings` is intentionally cross-user-readable enables the feature; it does not authorise exposing a stranger's *identity* in this context.
- **Generated text must never be presented as real user content**, and **real user text must never be labelled generated.** (Friends/Twin notes are real; the FeelFlick impressions in Decision Evidence are clearly labelled generated — see F5.3.)
- **Sparse social data self-hides.** No social placeholder, no fabricated review, no "no reviews yet" filler — both `SocialContext` and the friends/twin sub-blocks self-hide when empty.
- **Presentation-only anonymisation.** The hooks' returned identity data is not altered or overwritten; the Film File simply does not render it.
