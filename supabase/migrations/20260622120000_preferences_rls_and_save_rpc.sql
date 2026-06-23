-- Preferences redesign — correctness migration.
--
--   A. user_preferences owner-only RLS. Verified against the live production
--      catalog: RLS is ALREADY enabled and every existing policy is owner-only
--      (auth.uid() = user_id), established by prior live hardening. This section
--      therefore ASSERTS that owner-only protection is in force and only
--      ESTABLISHES it as a fail-safe when an environment is missing it — it does
--      NOT add redundant policies where owner-only policies already exist, and
--      does not touch existing grants beyond keeping anon locked out.
--   B. A single transactional, owner-scoped save RPC with optimistic-concurrency
--      detection — the old /preferences Save was a 4-step client sequence with no
--      atomicity and no concurrency control (lost genres / clobbered unrelated
--      settings / lost concurrent writes). The new client has no direct-write
--      fallback and requires this RPC.
--
-- It does NOT change any table shape and does NOT rewrite user data.

-- =====================================================================
-- A. Assert (and fail-safe establish) owner-only RLS for user_preferences
-- =====================================================================
do $$
declare
  v_rls boolean;
  v_has_policy boolean;
begin
  if not exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'user_preferences'
  ) then
    raise exception 'user_preferences table not found — aborting';
  end if;

  select relrowsecurity into v_rls from pg_class where oid = 'public.user_preferences'::regclass;
  select exists (select 1 from pg_policy where polrelid = 'public.user_preferences'::regclass) into v_has_policy;

  if not v_rls then
    alter table public.user_preferences enable row level security;
  end if;

  -- Only create the canonical owner-only policies when NONE exist (fresh env).
  -- Production already has owner-only policies, so this block is skipped there.
  if not v_has_policy then
    create policy "user_preferences_select_own" on public.user_preferences
      for select using ((select auth.uid()) = user_id);
    create policy "user_preferences_insert_own" on public.user_preferences
      for insert with check ((select auth.uid()) = user_id);
    create policy "user_preferences_update_own" on public.user_preferences
      for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
    create policy "user_preferences_delete_own" on public.user_preferences
      for delete using ((select auth.uid()) = user_id);
    grant select, insert, update, delete on table public.user_preferences to authenticated;
  end if;

  -- Keep anon locked out regardless (idempotent; no-op when already revoked).
  revoke all on table public.user_preferences from anon;

  -- Final assertion: owner-only RLS must be in force.
  if not (select relrowsecurity from pg_class where oid = 'public.user_preferences'::regclass)
     or not exists (select 1 from pg_policy where polrelid = 'public.user_preferences'::regclass) then
    raise exception 'user_preferences is not owner-RLS protected — aborting';
  end if;
end $$;

-- =====================================================================
-- B. Transactional save RPC — save_user_preferences_v2
-- =====================================================================
-- Owner-derived (auth.uid()), optimistic-concurrency via expected updated_at,
-- atomic genre replacement + prefs merge + cache invalidation. Rolls back on
-- any failure (a plpgsql function body is one transaction).
--
-- Error contract (SQLSTATE surfaced to the client via PostgREST):
--   PT409 -> stale expected_updated_at (conflict)
--   PT400 -> validation failure
--   PT401 -> unauthenticated

create or replace function public.save_user_preferences_v2(
  p_expected_updated_at timestamptz,
  p_genre_ids integer[],
  p_prefs_patch jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_uid uuid := (select auth.uid());
  v_allowed_keys text[] := array[
    'moodWeights','avoidGenres','trustedDirectors','mutedDirectors',
    'runtimeFloor','runtimeCap','boundaries','subtitles','spoilerTier','languages'
  ];
  v_mood_keys text[] := array[
    'tense','tender','slow-burn','cerebral','bittersweet','cozy','dark-comic','hopeful','mythic'
  ];
  v_boundary_keys text[] := array['graphic','sexual','animals','noise'];
  v_subtitle_enum text[] := array['never','sometimes','always-welcome'];
  v_spoiler_enum text[] := array['brief','standard','detailed'];
  v_lang_catalog text[] := array[
    'English','Korean','Japanese','French','Spanish','Italian','German','Mandarin',
    'Cantonese','Hindi','Portuguese','Russian','Arabic','Turkish','Persian','Swedish',
    'Danish','Norwegian','Polish','Dutch','Thai','Vietnamese'
  ];
  v_key text;
  v_existing_settings jsonb;
  v_existing_prefs jsonb;
  v_next_prefs jsonb;
  v_row_updated_at timestamptz;
  v_has_row boolean;
  v_new_updated_at timestamptz;
  v_arr jsonb;
  v_el jsonb;
  v_num numeric;
  v_floor numeric;
  v_cap numeric;
  v_trusted text[];
  v_muted text[];
  v_genre_count integer;
  v_avoid_ids integer[];
  v_avoid_unknown integer;
  -- Authoritative TMDB genre id set — mirrors src/features/preferences/data.js GENRES.
  v_genre_ids integer[] := array[28, 12, 16, 35, 80, 99, 18, 10751, 14, 36, 27, 10402, 9648, 10749, 878, 53];
begin
  -- 1. Auth
  if v_uid is null then
    raise exception 'unauthenticated' using errcode = 'PT401';
  end if;

  -- Serialize concurrent saves for this user. FOR UPDATE locks nothing when the
  -- settings row does not exist yet, so two first-time saves could otherwise both
  -- pass the conflict gate; an xact advisory lock closes that window.
  perform pg_advisory_xact_lock(hashtext(v_uid::text));

  -- 6/16. Patch must be a JSON object with only allowed keys
  if p_prefs_patch is null or jsonb_typeof(p_prefs_patch) <> 'object' then
    raise exception 'invalid prefs patch' using errcode = 'PT400';
  end if;
  for v_key in select jsonb_object_keys(p_prefs_patch) loop
    if not (v_key = any(v_allowed_keys)) then
      raise exception 'unexpected prefs key: %', v_key using errcode = 'PT400';
    end if;
  end loop;

  -- preferred genre ids: distinct, positive, bounded
  if p_genre_ids is null then p_genre_ids := array[]::integer[]; end if;
  v_genre_count := array_length(p_genre_ids, 1);
  if v_genre_count is not null then
    if v_genre_count > 40 then
      raise exception 'too many preferred genres' using errcode = 'PT400';
    end if;
    if exists (select 1 from unnest(p_genre_ids) g where g <= 0) then
      raise exception 'invalid genre id' using errcode = 'PT400';
    end if;
    if (select count(*) from (select distinct unnest(p_genre_ids)) d) <> v_genre_count then
      raise exception 'duplicate preferred genres' using errcode = 'PT400';
    end if;
    -- Must be known catalog genres (user_preferences.genre_id FK → genres.id).
    if exists (select 1 from unnest(p_genre_ids) g where not (g = any(v_genre_ids))) then
      raise exception 'unknown preferred genre' using errcode = 'PT400';
    end if;
  end if;

  -- moodWeights: allowlisted keys, finite 0..1
  if p_prefs_patch ? 'moodWeights' then
    if jsonb_typeof(p_prefs_patch->'moodWeights') <> 'object' then
      raise exception 'invalid moodWeights' using errcode = 'PT400';
    end if;
    for v_key in select jsonb_object_keys(p_prefs_patch->'moodWeights') loop
      if not (v_key = any(v_mood_keys)) then
        raise exception 'invalid mood key: %', v_key using errcode = 'PT400';
      end if;
      if jsonb_typeof(p_prefs_patch->'moodWeights'->v_key) <> 'number' then
        raise exception 'invalid mood value' using errcode = 'PT400';
      end if;
      v_num := (p_prefs_patch->'moodWeights'->>v_key)::numeric;
      if v_num < 0 or v_num > 1 then
        raise exception 'mood value out of range' using errcode = 'PT400';
      end if;
    end loop;
  end if;

  -- avoidGenres: bounded array of known labels; collect ids for overlap check
  if p_prefs_patch ? 'avoidGenres' then
    v_arr := p_prefs_patch->'avoidGenres';
    if jsonb_typeof(v_arr) <> 'array' then
      raise exception 'invalid avoidGenres' using errcode = 'PT400';
    end if;
    if jsonb_array_length(v_arr) > 40 then
      raise exception 'too many avoided genres' using errcode = 'PT400';
    end if;
    -- Map avoid labels -> ids with the SAME authoritative label set the client/engine
    -- use. The genres table stores 'Science Fiction' but the app labels TMDB 878 as
    -- 'Sci-Fi', so a genres-table join would silently miss it (breaking the overlap
    -- guard). Reject any unknown label (PT400), then check overlap on ids.
    select array_agg(m.id) filter (where m.id is not null),
           count(*) filter (where m.id is null)
      into v_avoid_ids, v_avoid_unknown
    from jsonb_array_elements_text(v_arr) as x(val)
    left join (values
      ('action', 28), ('adventure', 12), ('animation', 16), ('comedy', 35), ('crime', 80),
      ('documentary', 99), ('drama', 18), ('family', 10751), ('fantasy', 14), ('history', 36),
      ('horror', 27), ('music', 10402), ('mystery', 9648), ('romance', 10749), ('sci-fi', 878),
      ('thriller', 53)
    ) as m(label, id) on m.label = lower(btrim(x.val));
    if coalesce(v_avoid_unknown, 0) > 0 then
      raise exception 'unknown avoided genre' using errcode = 'PT400';
    end if;
    if v_avoid_ids is not null and p_genre_ids && v_avoid_ids then
      raise exception 'genre cannot be both preferred and avoided' using errcode = 'PT400';
    end if;
  end if;

  -- directors: bounded arrays, trimmed length-limited, no trusted/muted overlap
  if p_prefs_patch ? 'trustedDirectors' then
    if jsonb_typeof(p_prefs_patch->'trustedDirectors') <> 'array'
       or jsonb_array_length(p_prefs_patch->'trustedDirectors') > 50 then
      raise exception 'invalid trustedDirectors' using errcode = 'PT400';
    end if;
  end if;
  if p_prefs_patch ? 'mutedDirectors' then
    if jsonb_typeof(p_prefs_patch->'mutedDirectors') <> 'array'
       or jsonb_array_length(p_prefs_patch->'mutedDirectors') > 50 then
      raise exception 'invalid mutedDirectors' using errcode = 'PT400';
    end if;
  end if;
  for v_el in select * from jsonb_array_elements(coalesce(p_prefs_patch->'trustedDirectors','[]'::jsonb))
              union all
              select * from jsonb_array_elements(coalesce(p_prefs_patch->'mutedDirectors','[]'::jsonb))
  loop
    if jsonb_typeof(v_el) <> 'string' or length(btrim(v_el #>> '{}')) = 0 or length(v_el #>> '{}') > 120 then
      raise exception 'invalid director name' using errcode = 'PT400';
    end if;
  end loop;
  select array_agg(lower(btrim(x.val))) into v_trusted
    from jsonb_array_elements_text(coalesce(p_prefs_patch->'trustedDirectors','[]'::jsonb)) as x(val);
  select array_agg(lower(btrim(x.val))) into v_muted
    from jsonb_array_elements_text(coalesce(p_prefs_patch->'mutedDirectors','[]'::jsonb)) as x(val);
  if v_trusted is not null and v_muted is not null and v_trusted && v_muted then
    raise exception 'director cannot be both trusted and muted' using errcode = 'PT400';
  end if;

  -- runtime: finite, bounded, cap >= floor + 5
  if p_prefs_patch ? 'runtimeFloor' then
    if jsonb_typeof(p_prefs_patch->'runtimeFloor') <> 'number' then
      raise exception 'invalid runtimeFloor' using errcode = 'PT400';
    end if;
    v_floor := (p_prefs_patch->>'runtimeFloor')::numeric;
    if v_floor < 60 or v_floor > 240 then
      raise exception 'runtimeFloor out of range' using errcode = 'PT400';
    end if;
  end if;
  if p_prefs_patch ? 'runtimeCap' then
    if jsonb_typeof(p_prefs_patch->'runtimeCap') <> 'number' then
      raise exception 'invalid runtimeCap' using errcode = 'PT400';
    end if;
    v_cap := (p_prefs_patch->>'runtimeCap')::numeric;
    if v_cap < 60 or v_cap > 240 then
      raise exception 'runtimeCap out of range' using errcode = 'PT400';
    end if;
  end if;
  if v_floor is not null and v_cap is not null and v_cap < v_floor + 5 then
    raise exception 'runtime cap must exceed floor by at least 5' using errcode = 'PT400';
  end if;

  -- boundaries: allowlisted boolean keys
  if p_prefs_patch ? 'boundaries' then
    if jsonb_typeof(p_prefs_patch->'boundaries') <> 'object' then
      raise exception 'invalid boundaries' using errcode = 'PT400';
    end if;
    for v_key in select jsonb_object_keys(p_prefs_patch->'boundaries') loop
      if not (v_key = any(v_boundary_keys)) then
        raise exception 'invalid boundary key: %', v_key using errcode = 'PT400';
      end if;
      if jsonb_typeof(p_prefs_patch->'boundaries'->v_key) <> 'boolean' then
        raise exception 'invalid boundary value' using errcode = 'PT400';
      end if;
    end loop;
  end if;

  -- subtitle / spoiler enums
  if p_prefs_patch ? 'subtitles' and not ((p_prefs_patch->>'subtitles') = any(v_subtitle_enum)) then
    raise exception 'invalid subtitles' using errcode = 'PT400';
  end if;
  if p_prefs_patch ? 'spoilerTier' and not ((p_prefs_patch->>'spoilerTier') = any(v_spoiler_enum)) then
    raise exception 'invalid spoilerTier' using errcode = 'PT400';
  end if;

  -- languages: known catalogue, bounded
  if p_prefs_patch ? 'languages' then
    if jsonb_typeof(p_prefs_patch->'languages') <> 'array'
       or jsonb_array_length(p_prefs_patch->'languages') > 30 then
      raise exception 'invalid languages' using errcode = 'PT400';
    end if;
    if exists (
      select 1 from jsonb_array_elements_text(p_prefs_patch->'languages') as x(val)
      where not (x.val = any(v_lang_catalog))
    ) then
      raise exception 'invalid language' using errcode = 'PT400';
    end if;
  end if;

  -- 7. Lock the current settings row (if any) for concurrency control
  select settings, updated_at into v_existing_settings, v_row_updated_at
  from public.user_settings
  where user_id = v_uid
  for update;
  v_has_row := found;

  -- 8. Optimistic concurrency: expected must match the locked row.
  if v_has_row then
    if p_expected_updated_at is null
       or v_row_updated_at is distinct from p_expected_updated_at then
      raise exception 'preferences changed elsewhere' using errcode = 'PT409';
    end if;
  else
    -- No row yet: caller must not claim a prior timestamp.
    if p_expected_updated_at is not null then
      raise exception 'preferences changed elsewhere' using errcode = 'PT409';
    end if;
    v_existing_settings := '{}'::jsonb;
  end if;

  -- 11. Merge: preserve all unrelated settings + unknown prefs keys.
  -- NOTE: jsonb || is a shallow (top-level) merge. moodWeights and boundaries are
  -- sent as COMPLETE objects by the client (buildSavePayload), so they are
  -- full-replace fields here, not deep-merged. Unrelated TOP-LEVEL prefs keys
  -- (daypart, subscriptions, and any unknown keys) are preserved.
  v_existing_prefs := coalesce(v_existing_settings->'prefs', '{}'::jsonb);
  v_next_prefs := v_existing_prefs || p_prefs_patch;  -- patch overrides only its keys
  v_existing_settings := jsonb_set(
    coalesce(v_existing_settings, '{}'::jsonb), '{prefs}', v_next_prefs, true
  );

  -- 9. Atomic genre replacement (inside this function's single transaction).
  delete from public.user_preferences where user_id = v_uid;
  if v_genre_count is not null and v_genre_count > 0 then
    insert into public.user_preferences (user_id, genre_id, excluded)
    select v_uid, g, false from unnest(p_genre_ids) as g;
  end if;

  -- 10. Upsert settings (owner-scoped).
  insert into public.user_settings (user_id, settings)
  values (v_uid, v_existing_settings)
  on conflict (user_id) do update set settings = excluded.settings;

  -- 12. Invalidate the cached recommendation profile in the same transaction.
  update public.user_profiles_computed set computed_at = null where user_id = v_uid;

  -- 13. Return the newly persisted timestamp (updated_at trigger has fired).
  select updated_at into v_new_updated_at from public.user_settings where user_id = v_uid;
  return jsonb_build_object('updated_at', v_new_updated_at);
end;
$$;

-- 4/5. Least privilege: authenticated only.
revoke all on function public.save_user_preferences_v2(timestamptz, integer[], jsonb) from public;
revoke all on function public.save_user_preferences_v2(timestamptz, integer[], jsonb) from anon;
grant execute on function public.save_user_preferences_v2(timestamptz, integer[], jsonb) to authenticated;

comment on function public.save_user_preferences_v2(timestamptz, integer[], jsonb) is
  'Owner-scoped (auth.uid()) transactional save for /preferences: optimistic-concurrency via expected updated_at (PT409 on conflict), validated prefs patch (PT400), atomic genre replacement + prefs merge + profile-cache invalidation. Preserves unrelated settings and unknown prefs keys.';
