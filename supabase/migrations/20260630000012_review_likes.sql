-- /DNA social profile — review likes (a member "likes" another member's film review).
--
-- ⚠️ NOT YET APPLIED TO ANY REMOTE ENVIRONMENT. File created locally for review. No fabricated
--    seed rows — counts start at 0 and grow only from real likes.
--
-- A review is a user_ratings row with a non-empty review_text, identified by (review_owner_id,
-- movie_id). Cross-user like COUNTS are read only through the gated SECURITY DEFINER function
-- get_dna_social_counts; the base table is owner-only-visible via RLS. Self-likes are blocked.

create table if not exists public.review_likes (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  review_owner_id uuid not null references auth.users(id) on delete cascade,
  movie_id        integer not null,
  created_at      timestamptz not null default now(),
  unique (user_id, review_owner_id, movie_id),
  constraint review_likes_no_self check (user_id <> review_owner_id)
);

create index if not exists review_likes_owner_movie_idx on public.review_likes (review_owner_id, movie_id);

alter table public.review_likes enable row level security;

create policy "review_likes_select_own" on public.review_likes
  for select using ((select auth.uid()) = user_id);
create policy "review_likes_insert_own" on public.review_likes
  for insert with check ((select auth.uid()) = user_id and user_id <> review_owner_id);
create policy "review_likes_delete_own" on public.review_likes
  for delete using ((select auth.uid()) = user_id);

revoke all on public.review_likes from anon;
grant select, insert, delete on public.review_likes to authenticated;
