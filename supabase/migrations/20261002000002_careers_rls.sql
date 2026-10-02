-- =============================================================================
-- Careers & Recruitment — Phase 2: Row Level Security, helpers and RPCs
--
-- ACCESS MODEL
-- ------------
-- caashishrajput.com is a static site. There is no application server, so the
-- browser talks to Supabase directly with the *anon* key. Every rule in the
-- specification must therefore be enforced by Postgres itself.
--
-- This migration deliberately uses the strictest workable posture:
--
--   * RLS is enabled on every table (defence in depth).
--   * `anon` and `authenticated` are granted NO direct privileges on any
--     careers table. RLS alone cannot hide a column, so `applications.admin_notes`
--     could not be protected by a row policy — denying table access outright and
--     routing every read/write through SECURITY DEFINER functions solves it.
--   * Each RPC re-checks identity and business rules, and raises one of the
--     machine-readable error codes below. The UI maps codes to friendly text, so
--     raw database errors never reach a visitor.
--
-- ERROR CODES (SQLSTATE, surfaced to the UI for message mapping)
--   AJA001 auth_required             AJA009 cv_invalid_type
--   AJA002 email_not_verified        AJA010 cv_too_large
--   AJA003 vacancy_not_found         AJA011 cv_not_owned
--   AJA004 vacancy_not_published     AJA012 not_found        (IDOR-safe generic)
--   AJA005 vacancy_not_yet_open      AJA013 admin_required
--   AJA006 vacancy_closed            AJA014 rate_limited
--   AJA007 duplicate_application     AJA015 validation_failed
--   AJA008 cv_missing                AJA016 profile_incomplete
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Lock the tables down
-- -----------------------------------------------------------------------------
alter table public.vacancies                 enable row level security;
alter table public.applicant_profiles        enable row level security;
alter table public.applications              enable row level security;
alter table public.application_status_history enable row level security;
alter table public.rate_limit_events         enable row level security;

revoke all on public.vacancies                  from anon, authenticated;
revoke all on public.applicant_profiles         from anon, authenticated;
revoke all on public.applications               from anon, authenticated;
revoke all on public.application_status_history from anon, authenticated;
revoke all on public.rate_limit_events          from anon, authenticated;

-- -----------------------------------------------------------------------------
-- 2. Shared helpers
-- -----------------------------------------------------------------------------

-- An administrator is a Supabase user whose raw_app_meta_data carries
-- role = 'admin'. Set it once in the Supabase dashboard (Authentication ->
-- Users -> ... -> Raw app meta data), or with the service-role key:
--   supabase.auth.admin.updateUserById('<uid>', {
--     app_metadata: { role: 'admin' }
--   })
-- Note this is app_metadata, not user_metadata: users cannot write their own.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(
    (
      select (u.raw_app_meta_data ->> 'role') = 'admin'
      from auth.users u
      where u.id = auth.uid()
    ),
    false
  );
$$;

-- Returns the caller's uid, or raises. Also enforces §7: an unverified email
-- may browse but may not apply.
create or replace function public.require_applicant()
returns uuid
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'AUTH_REQUIRED' using errcode = 'AJA001';
  end if;

  if not exists (
    select 1 from auth.users where id = v_uid and email_confirmed_at is not null
  ) then
    raise exception 'EMAIL_NOT_VERIFIED' using errcode = 'AJA002';
  end if;

  return v_uid;
end;
$$;

create or replace function public.require_admin()
returns uuid
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_admin() then
    raise exception 'ADMIN_REQUIRED' using errcode = 'AJA013';
  end if;
  return auth.uid();
end;
$$;

-- §5 — the single source of truth for "can this vacancy accept applications?".
-- Deliberately expressed only in terms of server-side now(), never a value
-- supplied by the browser.
create or replace function public.vacancy_is_open(p_vacancy public.vacancies)
returns boolean
language sql
-- STABLE, not IMMUTABLE: the result depends on now(). Declaring it immutable
-- lets the planner constant-fold the answer at plan time, so a cached plan
-- could keep reporting a vacancy as open after its closing date has passed.
stable
set search_path = public, pg_temp
as $$
  select p_vacancy.status = 'published'
     and now() >= p_vacancy.opening_date
     and now() <= p_vacancy.closing_date;
$$;

-- Raises the precise reason a vacancy is not accepting applications, so the UI
-- can distinguish "not yet open" from "closed".
create or replace function public.assert_vacancy_open(p_vacancy public.vacancies)
returns void
language plpgsql
-- STABLE for the same reason as vacancy_is_open(): it reads now() and raises
-- when the window has passed.
stable
set search_path = public, pg_temp
as $$
begin
  if p_vacancy.id is null then
    raise exception 'VACANCY_NOT_FOUND' using errcode = 'AJA003';
  end if;

  if p_vacancy.status in ('draft', 'archived') then
    raise exception 'VACANCY_NOT_PUBLISHED' using errcode = 'AJA004';
  end if;

  if p_vacancy.status = 'closed' then
    raise exception 'VACANCY_CLOSED' using errcode = 'AJA006';
  end if;

  if now() < p_vacancy.opening_date then
    raise exception 'VACANCY_NOT_YET_OPEN' using errcode = 'AJA005';
  end if;

  if now() > p_vacancy.closing_date then
    raise exception 'VACANCY_CLOSED' using errcode = 'AJA006';
  end if;
end;
$$;

-- =============================================================================
-- 3. Rate limiting (§34) — no paid service, plain table + advisory lock
-- =============================================================================
create or replace function public.consume_rate_limit(
  p_action          text,
  p_key             text,
  p_limit           integer,
  p_window_seconds  integer
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_hash    text := md5(coalesce(p_key, 'anonymous'));
  v_lock    bigint := hashtext(v_hash || ':' || p_action);
  v_recent  integer;
begin
  if p_limit <= 0 or p_window_seconds <= 0 then
    raise exception 'VALIDATION_FAILED' using errcode = 'AJA015';
  end if;

  -- Serialise concurrent attempts against the same bucket so a burst of
  -- parallel requests cannot slip past the counter.
  perform pg_advisory_xact_lock(v_lock);

  select count(*)::integer
  into v_recent
  from public.rate_limit_events
  where action = p_action
    and key_hash = v_hash
    and created_at > now() - make_interval(secs => p_window_seconds);

  if v_recent >= p_limit then
    return false;
  end if;

  insert into public.rate_limit_events (action, key_hash) values (p_action, v_hash);
  return true;
end;
$$;

revoke all on function public.consume_rate_limit(text, text, integer, integer) from public;

-- =============================================================================
-- 4. Profile provisioning
-- =============================================================================
-- A profile row is created the moment the auth account is created, so the
-- applicant email always comes from the (to-be-verified) auth account and can
-- never be set independently by the applicant (§8).
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_experience_type text := lower(coalesce(new.raw_user_meta_data ->> 'experience_type', 'fresher'));
  v_years           numeric;
begin
  if v_experience_type not in ('fresher', 'experienced') then
    v_experience_type := 'fresher';
  end if;

  if v_experience_type = 'experienced' then
    v_years := nullif(new.raw_user_meta_data ->> 'experience_years', '')::numeric;
    if v_years is null or v_years <= 0 then
      -- Fall back to fresher rather than failing sign-up on bad metadata; the
      -- applicant corrects this in their profile before applying.
      v_experience_type := 'fresher';
      v_years := null;
    end if;
  else
    v_experience_type := 'fresher';
    v_years := null;
  end if;

  insert into public.applicant_profiles (
    user_id, full_name, mobile, email, experience_type, experience_years, current_employer
  )
  values (
    new.id,
    left(coalesce(nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''), 'Applicant'), 120),
    regexp_replace(coalesce(new.raw_user_meta_data ->> 'mobile', ''), '\D', '', 'g'),
    coalesce(new.email, ''),
    v_experience_type,
    v_years,
    nullif(btrim(coalesce(new.raw_user_meta_data ->> 'current_employer', '')), '')
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- =============================================================================
-- 5. Public, unauthenticated vacancy reads
-- =============================================================================

-- Listing for /career. Draft and archived vacancies are never returned.
-- A vacancy whose window has passed is still returned (status 'closed' or a
-- published row past its closing date) so the page stays transparent for SEO.
create or replace function public.public_list_vacancies()
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', v.id,
        'title', v.title,
        'slug', v.slug,
        'location', v.location,
        'employment_type', v.employment_type,
        'experience_requirement', v.experience_requirement,
        'stipend_or_salary', v.stipend_or_salary,
        'opening_date', v.opening_date,
        'closing_date', v.closing_date,
        'status', v.status,
        'is_open', public.vacancy_is_open(v),
        'opens_on', (v.opening_date at time zone 'Asia/Kolkata')::date,
        'closes_on', (v.closing_date at time zone 'Asia/Kolkata')::date,
        'closes_at_ist', to_char(v.closing_date at time zone 'Asia/Kolkata', 'DD Mon YYYY, HH24:MI')
      )
      order by public.vacancy_is_open(v) desc, v.closing_date desc, v.title asc
    ),
    '[]'::jsonb
  )
  from public.vacancies v
  where v.status in ('published', 'closed');
$$;

-- Detail for /career/[slug].
create or replace function public.public_get_vacancy(p_slug text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v public.vacancies;
begin
  if p_slug is null or btrim(p_slug) = '' then
    return null;
  end if;

  select * into v from public.vacancies where slug = btrim(p_slug);

  if v.id is null or v.status in ('draft', 'archived') then
    return null;
  end if;

  return jsonb_build_object(
    'id', v.id,
    'title', v.title,
    'slug', v.slug,
    'description', v.description,
    'location', v.location,
    'employment_type', v.employment_type,
    'experience_requirement', v.experience_requirement,
    'stipend_or_salary', v.stipend_or_salary,
    'responsibilities', v.responsibilities,
    'skills_required', v.skills_required,
    'qualification', v.qualification,
    'benefits', v.benefits,
    'opening_date', v.opening_date,
    'closing_date', v.closing_date,
    'status', v.status,
    'is_open', public.vacancy_is_open(v),
    'opens_at_ist', to_char(v.opening_date at time zone 'Asia/Kolkata', 'DD Mon YYYY, HH24:MI'),
    'closes_at_ist', to_char(v.closing_date at time zone 'Asia/Kolkata', 'DD Mon YYYY, HH24:MI'),
    'closes_on', (v.closing_date at time zone 'Asia/Kolkata')::date,
    'updated_at', v.updated_at
  );
end;
$$;

-- -----------------------------------------------------------------------------
-- Grants: the only things an anonymous visitor may execute.
-- -----------------------------------------------------------------------------
revoke all on function public.public_list_vacancies() from public;
revoke all on function public.public_get_vacancy(text) from public;
grant execute on function public.public_list_vacancies() to anon, authenticated;
grant execute on function public.public_get_vacancy(text) to anon, authenticated;
grant execute on function public.is_admin() to authenticated;

-- =============================================================================
-- 6. Applicant-facing RPCs
-- =============================================================================

-- ---- profile ---------------------------------------------------------------
create or replace function public.get_my_profile()
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := public.require_applicant();
  v_profile public.applicant_profiles;
  v_email_verified boolean;
begin
  select email_confirmed_at is not null into v_email_verified
  from auth.users where id = v_uid;

  select * into v_profile from public.applicant_profiles where user_id = v_uid;

  if v_profile.id is null then
    return jsonb_build_object('email_verified', v_email_verified, 'exists', false);
  end if;

  return jsonb_build_object(
    'exists', true,
    'id', v_profile.id,
    'full_name', v_profile.full_name,
    'mobile', v_profile.mobile,
    'email', v_profile.email,
    'experience_type', v_profile.experience_type,
    'experience_years', v_profile.experience_years,
    'current_employer', v_profile.current_employer,
    'email_verified', v_email_verified,
    -- Mirrors the PROFILE_INCOMPLETE test in submit_application(), so the UI
    -- warns before the applicant uploads a CV they cannot submit.
    'is_complete', (
      char_length(btrim(coalesce(v_profile.full_name, ''))) >= 2
      and v_profile.mobile ~ '^\+?[0-9]{10,15}$'
    ),
    'created_at', v_profile.created_at
  );
end;
$$;

-- The applicant may correct their own details, but `email` is deliberately not
-- a parameter: it always mirrors the authenticated account (§8).
create or replace function public.upsert_my_profile(
  p_full_name        text,
  p_mobile           text,
  p_experience_type  text,
  p_experience_years numeric,
  p_current_employer text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid        uuid := public.require_applicant();
  v_name       text := left(btrim(coalesce(p_full_name, '')), 120);
  v_mobile     text := regexp_replace(coalesce(p_mobile, ''), '[^0-9+]', '', 'g');
  v_exp_type   text := lower(btrim(coalesce(p_experience_type, '')));
  v_years      numeric;
  v_employer   text := nullif(left(btrim(coalesce(p_current_employer, '')), 150), '');
begin
  if char_length(v_name) < 2 then
    raise exception 'VALIDATION_FAILED: full_name' using errcode = 'AJA015';
  end if;

  if v_exp_type not in ('fresher', 'experienced') then
    raise exception 'VALIDATION_FAILED: experience_type' using errcode = 'AJA015';
  end if;

  if v_exp_type = 'fresher' then
    v_years := null;
  else
    v_years := p_experience_years;
    if v_years is null or v_years <= 0 or v_years > 60 then
      raise exception 'VALIDATION_FAILED: experience_years' using errcode = 'AJA015';
    end if;
  end if;

  if v_mobile !~ '^\+?[0-9]{10,15}$' then
    raise exception 'VALIDATION_FAILED: mobile' using errcode = 'AJA015';
  end if;

  insert into public.applicant_profiles as p (
    user_id, full_name, mobile, email, experience_type, experience_years, current_employer
  )
  values (
    v_uid, v_name, v_mobile, (select u.email from auth.users u where u.id = v_uid),
    v_exp_type::public.experience_type, v_years, v_employer
  )
  on conflict (user_id) do update
    set full_name        = excluded.full_name,
        mobile           = excluded.mobile,
        email            = excluded.email,
        experience_type  = excluded.experience_type,
        experience_years = excluded.experience_years,
        current_employer = excluded.current_employer,
        updated_at       = now()
  where p.user_id = v_uid;

  return public.get_my_profile();
end;
$$;

-- ---- applications ----------------------------------------------------------

-- Dashboard list. Never includes admin_notes.
create or replace function public.list_my_applications()
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', a.id,
        'vacancy_id', a.vacancy_id,
        'vacancy_title', v.title,
        'vacancy_slug', v.slug,
        -- Named to match the admin/list shape used by the dashboard renderer.
        'vacancy_location', v.location,
        'vacancy_employment_type', v.employment_type,
        'vacancy_closing_date', v.closing_date,
        'status', a.status,
        'applied_at', a.applied_at,
        'updated_at', a.updated_at,
        'cv_path', a.cv_path,
        -- The applicant's own cover note, so they can see what they submitted.
        'cover_letter', a.cover_letter,
        -- Admin notes are deliberately absent (§16, §19).
        'status_history', coalesce((
          select jsonb_agg(
            jsonb_build_object(
              'status', h.new_status,
              'changed_at', h.changed_at,
              'note', h.applicant_visible_note,
              'is_current', h.new_status = a.status
            ) order by h.changed_at
          )
          from public.application_status_history h
          where h.application_id = a.id
        ), '[]'::jsonb)
      )
      order by a.applied_at desc
    ),
    '[]'::jsonb
  )
  from public.applications a
  join public.vacancies v on v.id = a.vacancy_id
  where a.applicant_id = public.require_applicant();
$$;

-- Single application for the applicant timeline. Ownership is enforced here,
-- and a non-owned id produces the same generic AJA012 as a missing row, so the
-- endpoint cannot be used to probe for valid application ids (§23, IDOR).
create or replace function public.get_my_application(p_application_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid  uuid := public.require_applicant();
  v_app  public.applications;
  v_vac  public.vacancies;
  v_hist jsonb;
begin
  if p_application_id is null then
    raise exception 'NOT_FOUND' using errcode = 'AJA012';
  end if;

  select * into v_app
  from public.applications
  where id = p_application_id and applicant_id = v_uid;

  if v_app.id is null then
    raise exception 'NOT_FOUND' using errcode = 'AJA012';
  end if;

  select * into v_vac from public.vacancies where id = v_app.vacancy_id;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'new_status', h.new_status,
        'changed_at', h.changed_at,
        'note', h.applicant_visible_note
      )
      order by h.changed_at asc, h.id asc
    ),
    '[]'::jsonb
  ) into v_hist
  from public.application_status_history h
  where h.application_id = v_app.id;

  return jsonb_build_object(
    'id', v_app.id,
    'vacancy_title', v_vac.title,
    'vacancy_slug', v_vac.slug,
    'location', v_vac.location,
    'employment_type', v_vac.employment_type,
    'status', v_app.status,
    'applied_at', v_app.applied_at,
    'updated_at', v_app.updated_at,
    'full_name', v_app.full_name,
    'email', v_app.email,
    'mobile', v_app.mobile,
    'experience_type', v_app.experience_type,
    'experience_years', v_app.experience_years,
    'current_employer', v_app.current_employer,
    'cover_letter', v_app.cover_letter,
    'cv_path', v_app.cv_path,
    'cv_file_name', split_part(v_app.cv_path, '/', 4),
    'history', v_hist
  );
end;
$$;

-- ---- CV upload: step 1, reserve a path -------------------------------------
-- Every precondition that gates an application is checked *before* the browser
-- is allowed to spend bandwidth on an upload.
create or replace function public.begin_cv_upload(
  p_vacancy_id uuid,
  p_filename   text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid     uuid := public.require_applicant();
  v_vac     public.vacancies;
  v_app_id  uuid := gen_random_uuid();
  v_name    text;
begin
  if not public.consume_rate_limit('cv_upload', v_uid::text, 20, 3600) then
    raise exception 'RATE_LIMITED' using errcode = 'AJA014';
  end if;

  select * into v_vac from public.vacancies where id = p_vacancy_id;
  if v_vac.id is null then
    raise exception 'VACANCY_NOT_FOUND' using errcode = 'AJA003';
  end if;
  public.assert_vacancy_open(v_vac);

  if exists (
    select 1 from public.applications
    where vacancy_id = p_vacancy_id and applicant_id = v_uid
  ) then
    raise exception 'DUPLICATE_APPLICATION' using errcode = 'AJA007';
  end if;

  -- Sanitise server-side: the browser's filename is never trusted or reused.
  v_name := regexp_replace(coalesce(p_filename, 'cv'), '[^A-Za-z0-9._-]', '_', 'g');
  v_name := left(v_name, 80);
  if v_name !~* '\.(pdf|doc|docx)$' then
    raise exception 'CV_INVALID_TYPE' using errcode = 'AJA009';
  end if;

  -- §13 path: cvs/{applicant_user_id}/{application_id}/{generated_filename}
  return jsonb_build_object(
    'application_id', v_app_id,
    'path', 'cvs/' || v_uid::text || '/' || v_app_id::text || '/' || v_name,
    'max_bytes', 5242880
  );
end;
$$;

-- ---- application submission: step 2 ---------------------------------------
create or replace function public.submit_application(
  p_application_id uuid,
  p_vacancy_id     uuid,
  p_cv_path        text,
  p_cover_letter   text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid        uuid := public.require_applicant();
  v_vac        public.vacancies;
  v_profile    public.applicant_profiles;
  v_obj        record;
  v_cover      text := nullif(left(btrim(coalesce(p_cover_letter, '')), 4000), '');
  v_expected   text;
  v_mime       text;
  v_ext        text;
begin
  if not public.consume_rate_limit('application_submit', v_uid::text, 10, 3600) then
    raise exception 'RATE_LIMITED' using errcode = 'AJA014';
  end if;

  -- Re-check the vacancy now, not just at upload time. §5 / §29.
  select * into v_vac from public.vacancies where id = p_vacancy_id;
  if v_vac.id is null then
    raise exception 'VACANCY_NOT_FOUND' using errcode = 'AJA003';
  end if;
  public.assert_vacancy_open(v_vac);

  select * into v_profile from public.applicant_profiles where user_id = v_uid;
  if v_profile.id is null
     or char_length(btrim(coalesce(v_profile.full_name, ''))) < 2
     or v_profile.mobile !~ '^\+?[0-9]{10,15}$' then
    raise exception 'PROFILE_INCOMPLETE' using errcode = 'AJA016';
  end if;

  -- §10 duplicate guard (the unique constraint below is the real guarantee).
  if exists (
    select 1 from public.applications
    where vacancy_id = p_vacancy_id and applicant_id = v_uid
  ) then
    raise exception 'DUPLICATE_APPLICATION' using errcode = 'AJA007';
  end if;

  -- §12 / §13: the CV must exist, be owned by this applicant, sit at the
  -- reserved path for *this* application id, and satisfy type + size limits.
  -- Size and MIME are read from storage metadata, i.e. server-side facts, not
  -- from anything the browser claims.
  v_expected := 'cvs/' || v_uid::text || '/' || p_application_id::text || '/';

  if p_cv_path is null or left(p_cv_path, length(v_expected)) <> v_expected then
    raise exception 'CV_NOT_OWNED' using errcode = 'AJA011';
  end if;

  v_ext := lower(regexp_replace(p_cv_path, '^.*\.', ''));
  if v_ext not in ('pdf', 'doc', 'docx') then
    raise exception 'CV_INVALID_TYPE' using errcode = 'AJA009';
  end if;

  select o.id, o.name, coalesce((o.metadata ->> 'size')::bigint, 0) as size,
         lower(o.metadata ->> 'mimetype') as mimetype
  into v_obj
  from storage.objects o
  where o.bucket_id = 'cvs' and o.name = p_cv_path;

  if v_obj.id is null then
    raise exception 'CV_MISSING' using errcode = 'AJA008';
  end if;

  if v_obj.size <= 0 then
    raise exception 'CV_MISSING' using errcode = 'AJA008';
  end if;

  if v_obj.size > 5242880 then
    raise exception 'CV_TOO_LARGE' using errcode = 'AJA010';
  end if;

  v_mime := v_obj.mimetype;
  -- Require the declared MIME type to be plausible for the extension. Browsers
  -- report .doc as octet-stream, so those generic types are tolerated, but a
  -- PDF declared as an image is rejected.
  if not (
       (v_ext = 'pdf'  and v_mime in ('application/pdf', 'application/octet-stream', 'application/x-pdf'))
    or (v_ext = 'doc'  and v_mime in ('application/msword', 'application/x-msword',
                                      'application/octet-stream', 'application/vnd.ms-word'))
    or (v_ext = 'docx' and v_mime in ('application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                                      'application/zip', 'application/octet-stream'))
  ) then
    raise exception 'CV_INVALID_TYPE' using errcode = 'AJA009';
  end if;

  -- Contact and experience data are copied from the verified profile, so an
  -- applicant cannot submit an application under someone else's identity (§23).
  insert into public.applications (
    id, vacancy_id, applicant_id,
    full_name, email, mobile, experience_type, experience_years, current_employer,
    cover_letter, cv_path, status
  )
  values (
    p_application_id, p_vacancy_id, v_uid,
    v_profile.full_name, v_profile.email, v_profile.mobile,
    v_profile.experience_type, v_profile.experience_years, v_profile.current_employer,
    v_cover, p_cv_path, 'submitted'
  );

  -- Open the timeline explicitly. Without this the applicant's progress list
  -- starts empty, because the applications row only stores the *current* status.
  insert into public.application_status_history (
    application_id, old_status, new_status, changed_by, applicant_visible_note
  )
  values (
    p_application_id, null, 'submitted', v_uid, 'Application received.'
  );

  return jsonb_build_object(
    'application_id', p_application_id,
    'status', 'submitted',
    'vacancy_title', v_vac.title,
    'vacancy_slug', v_vac.slug
  );
end;
$$;

-- Applicants may withdraw their own application; they may do nothing else.
create or replace function public.withdraw_my_application(p_application_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := public.require_applicant();
  v_old public.application_status;
begin
  -- Capture the status BEFORE the update. Reading it afterwards recorded
  -- 'withdrawn -> withdrawn' and destroyed the real previous status.
  select a.status into v_old
  from public.applications a
  where a.id = p_application_id and a.applicant_id = v_uid;

  if v_old is null then
    raise exception 'NOT_FOUND' using errcode = 'AJA012';
  end if;

  if v_old in ('selected', 'rejected', 'withdrawn') then
    raise exception 'VALIDATION_FAILED: status is final and cannot be withdrawn'
      using errcode = 'AJA015';
  end if;

  update public.applications
  set status = 'withdrawn'
  where id = p_application_id and applicant_id = v_uid;

  insert into public.application_status_history (
    application_id, old_status, new_status, changed_by, applicant_visible_note
  )
  values (
    p_application_id, v_old, 'withdrawn', v_uid,
    'You withdrew this application.'
  );

  return jsonb_build_object('id', p_application_id, 'status', 'withdrawn');
end;
$$;

-- =============================================================================
-- 7. The guard trigger — the last line of defence for §5
-- =============================================================================
-- Even if table privileges were ever granted by mistake, no application row can
-- be inserted outside the opening/closing window, for another applicant, with
-- a mismatched email, or without a CV.
create or replace function public.guard_application_insert()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_vac public.vacancies;
  v_uid uuid := auth.uid();
begin
  select * into v_vac from public.vacancies where id = new.vacancy_id;
  public.assert_vacancy_open(v_vac);

  if v_uid is not null and new.applicant_id <> v_uid then
    raise exception 'NOT_FOUND' using errcode = 'AJA012';
  end if;

  if new.email is distinct from (select u.email from auth.users u where u.id = new.applicant_id) then
    raise exception 'VALIDATION_FAILED: email' using errcode = 'AJA015';
  end if;

  if new.cv_path is null
     or new.cv_path !~ ('^cvs/' || new.applicant_id::text || '/' || new.id::text || '/') then
    raise exception 'CV_NOT_OWNED' using errcode = 'AJA011';
  end if;

  return new;
end;
$$;

create trigger applications_guard_insert
  before insert on public.applications
  for each row execute function public.guard_application_insert();

-- =============================================================================
-- 8. Admin RPCs — §30: authorisation is decided here, in the database, not by
--    hiding a route in the frontend.
-- =============================================================================

create or replace function public.admin_list_vacancies()
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', v.id,
        'title', v.title,
        'slug', v.slug,
        'location', v.location,
        'employment_type', v.employment_type,
        'status', v.status,
        'opening_date', v.opening_date,
        'closing_date', v.closing_date,
        'is_open', public.vacancy_is_open(v),
        'application_count', (
          select count(*)::integer from public.applications a where a.vacancy_id = v.id
        ),
        'created_at', v.created_at
      )
      order by v.created_at desc
    ),
    '[]'::jsonb
  )
  from public.vacancies v
  where public.require_admin() is not null;
$$;

create or replace function public.admin_get_vacancy(p_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v public.vacancies;
begin
  perform public.require_admin();
  select * into v from public.vacancies where id = p_id;
  if v.id is null then
    raise exception 'NOT_FOUND' using errcode = 'AJA012';
  end if;
  return to_jsonb(v);
end;
$$;

create or replace function public.admin_upsert_vacancy(
  p_id                    uuid default null,
  p_title                 text,
  p_slug                  text,
  p_description           text,
  p_location              text,
  p_employment_type       text default null,
  p_experience_requirement text default null,
  p_stipend_or_salary     text default null,
  p_responsibilities      text default null,
  p_skills_required       text default null,
  p_qualification         text default null,
  p_benefits              text default null,
  p_opening_date          timestamptz,
  p_closing_date          timestamptz,
  p_status                text default 'draft'
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_id       uuid;
  v_slug     text := lower(regexp_replace(trim(coalesce(p_slug, '')), '[^A-Za-z0-9]+', '-', 'g'));
  v_status   text := lower(trim(coalesce(p_status, 'draft')));
  v_holder   public.vacancies%rowtype;
begin
  perform public.require_admin();

  if v_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' then
    raise exception 'VALIDATION_FAILED: slug' using errcode = 'AJA015';
  end if;

  if v_status not in ('draft', 'published', 'closed', 'archived') then
    raise exception 'VALIDATION_FAILED: status' using errcode = 'AJA015';
  end if;

  if p_opening_date is null or p_closing_date is null or p_closing_date <= p_opening_date then
    raise exception 'VALIDATION_FAILED: closing_date must be after opening_date' using errcode = 'AJA015';
  end if;

  if char_length(btrim(coalesce(p_title, ''))) < 3 then
    raise exception 'VALIDATION_FAILED: title' using errcode = 'AJA015';
  end if;

  -- The two cases must not share one statement. An INSERT ... ON CONFLICT
  -- (slug) that ignores p_id silently CREATES a second vacancy when the slug is
  -- changed, leaving every application attached to the original row.

  if p_id is not null then
    -- ---- update an existing vacancy -------------------------------------
    if not exists (select 1 from public.vacancies where id = p_id) then
      raise exception 'VACANCY_NOT_FOUND' using errcode = 'AJA003';
    end if;

    -- Refuse a slug that another vacancy already owns, rather than failing
    -- later with a raw unique_violation the UI cannot explain.
    if exists (select 1 from public.vacancies where slug = v_slug and id <> p_id) then
      raise exception 'VALIDATION_FAILED: slug "%" is already used by another vacancy', v_slug
        using errcode = 'AJA015';
    end if;

    update public.vacancies
    set title                  = left(btrim(p_title), 200),
        slug                   = v_slug,
        description            = coalesce(p_description, ''),
        location               = left(btrim(coalesce(p_location, 'Sahibabad, Ghaziabad')), 150),
        employment_type        = left(coalesce(p_employment_type, ''), 80),
        experience_requirement = left(coalesce(p_experience_requirement, ''), 200),
        stipend_or_salary      = left(coalesce(p_stipend_or_salary, ''), 150),
        responsibilities       = p_responsibilities,
        skills_required        = p_skills_required,
        qualification          = p_qualification,
        benefits               = p_benefits,
        opening_date           = p_opening_date,
        closing_date           = p_closing_date,
        status                 = v_status::public.vacancy_status,
        updated_at             = now()
    where id = p_id
    returning id into v_id;
  else
    -- ---- create, or deliberately reuse an existing slug ------------------
    select * into v_holder from public.vacancies where slug = v_slug for update;

    if v_holder.id is null then
      insert into public.vacancies (
        title, slug, description, location, employment_type, experience_requirement,
        stipend_or_salary, responsibilities, skills_required, qualification, benefits,
        opening_date, closing_date, status
      )
      values (
        left(btrim(p_title), 200), v_slug, coalesce(p_description, ''),
        left(btrim(coalesce(p_location, 'Sahibabad, Ghaziabad')), 150),
        left(coalesce(p_employment_type, ''), 80),
        left(coalesce(p_experience_requirement, ''), 200),
        left(coalesce(p_stipend_or_salary, ''), 150), p_responsibilities, p_skills_required,
        p_qualification, p_benefits, p_opening_date, p_closing_date,
        v_status::public.vacancy_status
      )
      returning id into v_id;
    else
      update public.vacancies
      set title                  = left(btrim(p_title), 200),
          description            = coalesce(p_description, ''),
          location               = left(btrim(coalesce(p_location, 'Sahibabad, Ghaziabad')), 150),
          employment_type        = left(coalesce(p_employment_type, ''), 80),
          experience_requirement = left(coalesce(p_experience_requirement, ''), 200),
          stipend_or_salary      = left(coalesce(p_stipend_or_salary, ''), 150),
          responsibilities       = p_responsibilities,
          skills_required        = p_skills_required,
          qualification          = p_qualification,
          benefits               = p_benefits,
          opening_date           = p_opening_date,
          closing_date           = p_closing_date,
          status                 = v_status::public.vacancy_status,
          updated_at             = now()
      where id = v_holder.id
      returning id into v_id;
    end if;
  end if;

  if v_id is null then
    raise exception 'VALIDATION_FAILED: could not save vacancy' using errcode = 'AJA015';
  end if;

  return public.admin_get_vacancy(v_id);
end;
$$;

create or replace function public.admin_set_vacancy_status(p_id uuid, p_status text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_status text := lower(trim(coalesce(p_status, '')));
begin
  perform public.require_admin();

  if v_status not in ('draft', 'published', 'closed', 'archived') then
    raise exception 'VALIDATION_FAILED: status' using errcode = 'AJA015';
  end if;

  update public.vacancies set status = v_status::public.vacancy_status where id = p_id;

  if not found then
    raise exception 'NOT_FOUND' using errcode = 'AJA012';
  end if;

  return public.admin_get_vacancy(p_id);
end;
$$;

create or replace function public.admin_duplicate_vacancy(p_id uuid, p_new_slug text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_source public.vacancies;
  v_slug   text := lower(regexp_replace(trim(coalesce(p_new_slug, '')), '[^A-Za-z0-9]+', '-', 'g'));
  v_copy   uuid;
begin
  perform public.require_admin();

  select * into v_source from public.vacancies where id = p_id;
  if v_source.id is null then
    raise exception 'NOT_FOUND' using errcode = 'AJA012';
  end if;

  if v_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' then
    raise exception 'VALIDATION_FAILED: slug' using errcode = 'AJA015';
  end if;

  -- A duplicate always starts life as a draft so it cannot silently accept
  -- applications.
  insert into public.vacancies (
    title, slug, description, location, employment_type, experience_requirement,
    stipend_or_salary, responsibilities, skills_required, qualification, benefits,
    opening_date, closing_date, status
  )
  select
    title, v_slug, description, location, employment_type, experience_requirement,
    stipend_or_salary, responsibilities, skills_required, qualification, benefits,
    now(), greatest(closing_date, now() + interval '30 days'), 'draft'
  from public.vacancies where id = p_id
  returning id into v_copy;

  return public.admin_get_vacancy(v_copy);
end;
$$;

-- Deletes a vacancy only when nothing depends on it. Otherwise the admin is
-- told to archive it, so existing applications are never orphaned (§29).
create or replace function public.admin_delete_vacancy(p_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_count integer;
begin
  perform public.require_admin();

  select count(*)::integer into v_count
  from public.applications where vacancy_id = p_id;

  if v_count > 0 then
    raise exception 'VALIDATION_FAILED: vacancy has ' || v_count || ' application(s); archive it instead'
      using errcode = 'AJA015';
  end if;

  delete from public.vacancies where id = p_id;

  if not found then
    raise exception 'NOT_FOUND' using errcode = 'AJA012';
  end if;

  return jsonb_build_object('deleted', true);
end;
$$;

-- Filtered, sorted, paginated application table for /admin/applications (§18).
create or replace function public.admin_list_applications(
  p_search          text default null,
  p_vacancy_id      uuid default null,
  p_status          text default null,
  p_experience_type text default null,
  p_date_from       date default null,
  p_date_to         date default null,
  p_sort            text default 'applied_at',
  p_dir             text default 'desc',
  p_limit           integer default 25,
  p_offset          integer default 0
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_rows   jsonb;
  v_total  integer;
  v_search text := nullif(btrim(coalesce(p_search, '')), '');
begin
  perform public.require_admin();

  p_limit := least(greatest(coalesce(p_limit, 25), 1), 200);
  p_offset := greatest(coalesce(p_offset, 0), 0);

  select count(*)::integer into v_total
  from public.applications a
  join public.vacancies v on v.id = a.vacancy_id
  where (p_vacancy_id is null or a.vacancy_id = p_vacancy_id)
    and (p_status is null or a.status::text = p_status)
    and (p_experience_type is null or a.experience_type::text = p_experience_type)
    and (p_date_from is null or (a.applied_at at time zone 'Asia/Kolkata')::date >= p_date_from)
    and (p_date_to   is null or (a.applied_at at time zone 'Asia/Kolkata')::date <= p_date_to)
    and (
      v_search is null
      or a.full_name  ilike '%' || v_search || '%'
      or a.email      ilike '%' || v_search || '%'
      or a.mobile     ilike '%' || v_search || '%'
      or v.title      ilike '%' || v_search || '%'
      or a.cv_path    ilike '%' || v_search || '%'
    );

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', a.id,
        'full_name', a.full_name,
        'email', a.email,
        'mobile', a.mobile,
        'experience_type', a.experience_type,
        'experience_years', a.experience_years,
        'current_employer', a.current_employer,
        'status', a.status,
        'applied_at', a.applied_at,
        'updated_at', a.updated_at,
        'applied_on_ist', to_char(a.applied_at at time zone 'Asia/Kolkata', 'DD Mon YYYY'),
        'cv_path', a.cv_path,
        'cv_file_name', split_part(a.cv_path, '/', 4),
        'has_internal_note', (a.admin_notes is not null and btrim(a.admin_notes) <> ''),
        'vacancy_id', v.id,
        'vacancy_title', v.title,
        'vacancy_slug', v.slug,
        'location', v.location,
        'employment_type', v.employment_type,
        'cover_letter', a.cover_letter
      )
      order by
        case when p_sort = 'full_name' and p_dir = 'asc'  then a.full_name end asc nulls last,
        case when p_sort = 'full_name' and p_dir = 'desc' then a.full_name end desc nulls last,
        case when p_sort = 'status'   and p_dir = 'asc'  then a.status::text end asc nulls last,
        case when p_sort = 'status'   and p_dir = 'desc' then a.status::text end desc nulls last,
        case when p_sort = 'vacancy'  and p_dir = 'asc'  then v.title end asc nulls last,
        case when p_sort = 'vacancy'  and p_dir = 'desc' then v.title end desc nulls last,
        case when p_sort = 'applied_at' and p_dir <> 'asc' then a.applied_at end desc nulls last,
        case when p_sort = 'applied_at' and p_dir = 'asc'  then a.applied_at end asc nulls last,
        a.applied_at desc,
        a.id
      limit p_limit offset p_offset
    ),
    '[]'::jsonb
  ) into v_rows
  from public.applications a
  join public.vacancies v on v.id = a.vacancy_id
  where (p_vacancy_id is null or a.vacancy_id = p_vacancy_id)
    and (p_status is null or a.status::text = p_status)
    and (p_experience_type is null or a.experience_type::text = p_experience_type)
    and (p_date_from is null or (a.applied_at at time zone 'Asia/Kolkata')::date >= p_date_from)
    and (p_date_to   is null or (a.applied_at at time zone 'Asia/Kolkata')::date <= p_date_to)
    and (
      v_search is null
      or a.full_name ilike '%' || v_search || '%'
      or a.email     ilike '%' || v_search || '%'
      or a.mobile    ilike '%' || v_search || '%'
      or v.title     ilike '%' || v_search || '%'
      or a.cv_path   ilike '%' || v_search || '%'
    );

  return jsonb_build_object(
    'total', v_total,
    'limit', p_limit,
    'offset', p_offset,
    'rows', v_rows
  );
end;
$$;

create or replace function public.admin_get_application(p_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_app  public.applications;
  v_vac  public.vacancies;
  v_hist jsonb;
begin
  perform public.require_admin();

  select * into v_app from public.applications where id = p_id;
  if v_app.id is null then
    raise exception 'NOT_FOUND' using errcode = 'AJA012';
  end if;

  select * into v_vac from public.vacancies where id = v_app.vacancy_id;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'old_status', h.old_status,
        'new_status', h.new_status,
        'changed_at', h.changed_at,
        'changed_by', h.changed_by,
        'note', h.applicant_visible_note
      )
      order by h.changed_at asc, h.id asc
    ),
    '[]'::jsonb
  ) into v_hist
  from public.application_status_history h
  where h.application_id = v_app.id;

  return jsonb_build_object(
    'id', v_app.id,
    'full_name', v_app.full_name,
    'email', v_app.email,
    'mobile', v_app.mobile,
    'experience_type', v_app.experience_type,
    'experience_years', v_app.experience_years,
    'current_employer', v_app.current_employer,
    'status', v_app.status,
    'admin_notes', v_app.admin_notes,
    'cover_letter', v_app.cover_letter,
    'cv_path', v_app.cv_path,
    'cv_file_name', split_part(v_app.cv_path, '/', 4),
    'applied_at', v_app.applied_at,
    'applied_at_ist', to_char(v_app.applied_at at time zone 'Asia/Kolkata', 'DD Mon YYYY, HH24:MI'),
    'updated_at', v_app.updated_at,
    'updated_at_ist', to_char(v_app.updated_at at time zone 'Asia/Kolkata', 'DD Mon YYYY, HH24:MI'),
    'vacancy', jsonb_build_object(
      'id', v_vac.id, 'title', v_vac.title, 'slug', v_vac.slug,
      'location', v_vac.location, 'employment_type', v_vac.employment_type,
      'stipend_or_salary', v_vac.stipend_or_salary,
      'closing_date', v_vac.closing_date, 'status', v_vac.status
    ),
    'history', v_hist
  );
end;
$$;

-- Status change + internal note + applicant-visible note, written as one
-- audited unit (§17, §19).
create or replace function public.admin_update_application(
  p_application_id uuid,
  p_status         text default null,
  p_admin_notes    text default null,
  p_visible_note   text default null,
  p_clear_note     boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_admin    uuid := public.require_admin();
  v_app      public.applications;
  v_status   text := lower(trim(coalesce(p_status, '')));
  v_valid    text[] := array['submitted','under_review','shortlisted','interview','selected','rejected','withdrawn'];
begin
  select * into v_app from public.applications where id = p_application_id;
  if v_app.id is null then
    raise exception 'NOT_FOUND' using errcode = 'AJA012';
  end if;

  if v_status <> '' and not (v_status = any (v_valid)) then
    raise exception 'VALIDATION_FAILED: status' using errcode = 'AJA015';
  end if;

  -- Notes can be saved without touching the status, and vice versa.
  if p_clear_note then
    update public.applications
    set admin_notes = null
    where id = p_application_id;
  elsif p_admin_notes is not null then
    update public.applications
    set admin_notes = left(p_admin_notes, 8000)
    where id = p_application_id;
  end if;

  if v_status <> '' and v_status <> v_app.status::text then
    update public.applications
    set status = v_status::public.application_status
    where id = p_application_id;

    insert into public.application_status_history (
      application_id, old_status, new_status, changed_by, applicant_visible_note
    ) values (
      p_application_id, v_app.status, v_status::public.application_status, v_admin,
      nullif(left(trim(coalesce(p_visible_note, '')), 2000), '')
    );
  elsif v_status = '' and p_visible_note is not null and trim(coalesce(p_visible_note, '')) <> '' then
    -- A note added without a status change still deserves an audit row.
    insert into public.application_status_history (
      application_id, old_status, new_status, changed_by, applicant_visible_note
    ) values (
      p_application_id, v_app.status, v_app.status, v_admin,
      left(trim(p_visible_note), 2000)
    );
  end if;

  return public.admin_get_application(p_application_id);
end;
$$;

-- Removes the CV object and the application together.
  --
  -- NOTE ON STORAGE: deleting the storage.objects row is what makes the object
  -- unreachable through the storage API. Supabase's storage backend removes the
  -- underlying blob via the objects delete hook. If you ever find orphaned files
  -- after a delete, audit with:
  --
  --   select name from storage.objects
  --   where bucket_id = 'cvs'
  --     and name not in (select cv_path from public.applications);
  --
create or replace function public.admin_delete_application(p_application_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_path text;
begin
  perform public.require_admin();

  select cv_path into v_path from public.applications where id = p_application_id;
  if v_path is null then
    raise exception 'NOT_FOUND' using errcode = 'AJA012';
  end if;

  delete from storage.objects
  where bucket_id = 'cvs' and name = v_path;

  delete from public.applications where id = p_application_id;

  return jsonb_build_object('deleted', true);
end;
$$;

create or replace function public.admin_vacancy_options()
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(
    jsonb_agg(
      jsonb_build_object('id', v.id, 'title', v.title, 'slug', v.slug, 'status', v.status)
      order by v.title
    ),
    '[]'::jsonb
  )
  from public.vacancies v
  where public.require_admin() is not null;
$$;

-- =============================================================================
-- 9. Execute grants
-- =============================================================================
-- Only the explicitly listed functions are reachable. Everything else stays
-- closed to anon / authenticated.
grant execute on function public.require_applicant() to authenticated;
grant execute on function public.consume_rate_limit(text, text, integer, integer) to anon, authenticated;

grant execute on function public.get_my_profile()      to authenticated;
grant execute on function public.upsert_my_profile(text, text, text, numeric, text) to authenticated;
grant execute on function public.list_my_applications() to authenticated;
grant execute on function public.get_my_application(uuid) to authenticated;
grant execute on function public.begin_cv_upload(uuid, text) to authenticated;
grant execute on function public.submit_application(uuid, uuid, text, text) to authenticated;
grant execute on function public.withdraw_my_application(uuid) to authenticated;

grant execute on function public.admin_list_vacancies() to authenticated;
grant execute on function public.admin_get_vacancy(uuid) to authenticated;
grant execute on function public.admin_upsert_vacancy(uuid, text, text, text, text, text, text, text, text, text, text, text, timestamptz, timestamptz, text) to authenticated;
grant execute on function public.admin_set_vacancy_status(uuid, text) to authenticated;
grant execute on function public.admin_duplicate_vacancy(uuid, text) to authenticated;
grant execute on function public.admin_delete_vacancy(uuid) to authenticated;
grant execute on function public.admin_vacancy_options() to authenticated;
grant execute on function public.admin_list_applications(text, uuid, text, text, date, date, text, text, integer, integer) to authenticated;
grant execute on function public.admin_get_application(uuid) to authenticated;
grant execute on function public.admin_update_application(uuid, text, text, text, boolean) to authenticated;
grant execute on function public.admin_delete_application(uuid) to authenticated;

-- The guard trigger, helper predicates and admin guard stay internal.
revoke execute on function public.guard_application_insert() from public;
revoke execute on function public.require_admin() from public, anon, authenticated;
revoke execute on function public.handle_new_auth_user() from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;
revoke execute on function public.assert_vacancy_open(public.vacancies) from public, anon, authenticated;
revoke execute on function public.vacancy_is_open(public.vacancies) from public, anon, authenticated;