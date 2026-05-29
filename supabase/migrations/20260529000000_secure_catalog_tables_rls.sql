-- Migration: secure catalog & engine tables (RLS + least-privilege grants)
--
-- WHY: 18 public tables had RLS DISABLED while the `anon` and `authenticated`
-- roles held full DML (INSERT/UPDATE/DELETE/TRUNCATE/REFERENCES/TRIGGER). Because
-- the anon key ships in the client bundle, anyone could destroy or poison the
-- catalog + engine data (e.g. `TRUNCATE public.movies`, `public.movie_similarity`).
--
-- IMPORTANT: PostgreSQL RLS does NOT gate TRUNCATE, so enabling RLS alone is
-- insufficient — we must also REVOKE the write privileges. All writes continue to
-- flow through `service_role` (pipeline scripts in scripts/, edge functions), which
-- bypasses both RLS and these grants.
--
-- Read access preserved:
--   * 15 catalog/lookup tables  -> public read (anon + authenticated): /movies,
--     /movie/:id and browse are public routes.
--   * user_similarity           -> authenticated read only (taste-twins on the
--     auth-gated /people route; queried by UserSearchPage.jsx / usePeopleData.jsx).
--   * discovery_cursors, update_runs -> NO public access (0 references in src/;
--     touched only server-side). SELECT revoked too.
--
-- Discovered 2026-05-29. Forward-only.

begin;

-- ---------------------------------------------------------------------------
-- 1) Revoke destructive privileges from the public-facing roles on ALL 18 tables.
--    (service_role is a separate role and is unaffected.)
-- ---------------------------------------------------------------------------
revoke insert, update, delete, truncate, references, trigger on table
  public.movies, public.genres, public.movie_genres, public.people,
  public.keywords, public.movie_keywords, public.ratings_external,
  public.movie_people, public.moods, public.viewing_contexts,
  public.experience_types, public.movie_mood_scores, public.movie_cast_metadata,
  public.discover_moods, public.movie_similarity, public.user_similarity,
  public.discovery_cursors, public.update_runs
from anon, authenticated;

-- Tables the client never reads -> revoke SELECT as well (least privilege).
revoke select on table public.discovery_cursors, public.update_runs
from anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2) Enable Row Level Security on all 18 tables (row-level gate for DML/SELECT).
-- ---------------------------------------------------------------------------
alter table public.movies                enable row level security;
alter table public.genres                enable row level security;
alter table public.movie_genres          enable row level security;
alter table public.people                enable row level security;
alter table public.keywords              enable row level security;
alter table public.movie_keywords        enable row level security;
alter table public.ratings_external      enable row level security;
alter table public.movie_people          enable row level security;
alter table public.moods                 enable row level security;
alter table public.viewing_contexts      enable row level security;
alter table public.experience_types      enable row level security;
alter table public.movie_mood_scores     enable row level security;
alter table public.movie_cast_metadata   enable row level security;
alter table public.discover_moods        enable row level security;
alter table public.movie_similarity      enable row level security;
alter table public.user_similarity       enable row level security;
alter table public.discovery_cursors     enable row level security;
alter table public.update_runs           enable row level security;

-- ---------------------------------------------------------------------------
-- 3) Public read policies for catalog/lookup tables (anon + authenticated).
--    `drop policy if exists` keeps this re-runnable.
-- ---------------------------------------------------------------------------
drop policy if exists "catalog public read" on public.movies;
create policy "catalog public read" on public.movies              for select to anon, authenticated using (true);
drop policy if exists "catalog public read" on public.genres;
create policy "catalog public read" on public.genres              for select to anon, authenticated using (true);
drop policy if exists "catalog public read" on public.movie_genres;
create policy "catalog public read" on public.movie_genres        for select to anon, authenticated using (true);
drop policy if exists "catalog public read" on public.people;
create policy "catalog public read" on public.people              for select to anon, authenticated using (true);
drop policy if exists "catalog public read" on public.keywords;
create policy "catalog public read" on public.keywords            for select to anon, authenticated using (true);
drop policy if exists "catalog public read" on public.movie_keywords;
create policy "catalog public read" on public.movie_keywords      for select to anon, authenticated using (true);
drop policy if exists "catalog public read" on public.ratings_external;
create policy "catalog public read" on public.ratings_external    for select to anon, authenticated using (true);
drop policy if exists "catalog public read" on public.movie_people;
create policy "catalog public read" on public.movie_people        for select to anon, authenticated using (true);
drop policy if exists "catalog public read" on public.moods;
create policy "catalog public read" on public.moods               for select to anon, authenticated using (true);
drop policy if exists "catalog public read" on public.viewing_contexts;
create policy "catalog public read" on public.viewing_contexts    for select to anon, authenticated using (true);
drop policy if exists "catalog public read" on public.experience_types;
create policy "catalog public read" on public.experience_types    for select to anon, authenticated using (true);
drop policy if exists "catalog public read" on public.movie_mood_scores;
create policy "catalog public read" on public.movie_mood_scores   for select to anon, authenticated using (true);
drop policy if exists "catalog public read" on public.movie_cast_metadata;
create policy "catalog public read" on public.movie_cast_metadata for select to anon, authenticated using (true);
drop policy if exists "catalog public read" on public.discover_moods;
create policy "catalog public read" on public.discover_moods      for select to anon, authenticated using (true);
drop policy if exists "catalog public read" on public.movie_similarity;
create policy "catalog public read" on public.movie_similarity    for select to anon, authenticated using (true);

-- ---------------------------------------------------------------------------
-- 4) user_similarity: authenticated read only (auth-gated /people feature).
-- ---------------------------------------------------------------------------
drop policy if exists "similarity authenticated read" on public.user_similarity;
create policy "similarity authenticated read" on public.user_similarity for select to authenticated using (true);

-- discovery_cursors & update_runs: intentionally NO policy -> RLS denies all
-- anon/authenticated access. Reached only via service_role.

commit;

-- ===========================================================================
-- VERIFICATION (run separately, read-only, after applying):
--
-- -- (a) RLS now enabled on all 18?
-- select tablename, rowsecurity
-- from pg_tables
-- where schemaname = 'public'
--   and tablename in ('movies','genres','movie_genres','people','keywords',
--     'movie_keywords','ratings_external','movie_people','moods','viewing_contexts',
--     'experience_types','movie_mood_scores','movie_cast_metadata','discover_moods',
--     'movie_similarity','user_similarity','discovery_cursors','update_runs')
-- order by tablename;
--
-- -- (b) anon/authenticated should now have only SELECT (catalog) or nothing.
-- select table_name, grantee, string_agg(privilege_type, ', ' order by privilege_type)
-- from information_schema.role_table_grants
-- where table_schema = 'public' and grantee in ('anon','authenticated')
--   and table_name in ('movies','user_similarity','discovery_cursors','update_runs')
-- group by table_name, grantee order by table_name, grantee;
-- ===========================================================================
