-- =============================================================================
-- Careers & Recruitment — Phase 1: schema
-- Project: caashishrajput.com (Ashish Jayalata & Associates)
--
-- Creates the four core tables, their constraints, indexes and triggers.
-- RLS policies and RPCs live in the next two migration files.
--
-- Timezone note: every deadline is stored as `timestamptz` (absolute instant),
-- so comparisons against now() are correct regardless of the visitor's
-- timezone. The practice operates in Asia/Kolkata (IST); rendering helpers
-- below format dates in IST for display.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Enumerated types
-- -----------------------------------------------------------------------------
create type public.vacancy_status as enum ('draft', 'published', 'closed', 'archived');

create type public.application_status as enum (
  'submitted',
  'under_review',
  'shortlisted',
  'interview',
  'selected',
  'rejected',
  'withdrawn'
);

create type public.experience_type as enum ('fresher', 'experienced');

-- -----------------------------------------------------------------------------
-- updated_at maintenance
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- =============================================================================
-- vacancies
-- =============================================================================
create table public.vacancies (
  id                     uuid primary key default gen_random_uuid(),

  title                  text not null,
  slug                   text not null,
  description            text not null,
  location               text not null,
  employment_type        text,
  experience_requirement text,
  stipend_or_salary      text,
  responsibilities       text,
  skills_required        text,
  qualification          text,
  benefits               text,

  -- Application window. Always stored as an absolute instant.
  opening_date           timestamptz not null,
  closing_date           timestamptz not null,

  status                 public.vacancy_status not null default 'draft',
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),

  constraint vacancies_title_ck
    check (char_length(btrim(title)) between 3 and 200),

  -- Lowercase, hyphen separated, no leading/trailing/double hyphens.
  constraint vacancies_slug_ck
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),

  constraint vacancies_slug_len_ck
    check (char_length(slug) between 2 and 120),

  -- A vacancy must always have a positive application window (§25).
  constraint vacancies_window_ck
    check (closing_date > opening_date),

  -- A published or closed vacancy must be publicly visible, so it must have
  -- a description and a location.
  constraint vacancies_public_fields_ck
    check (
      status in ('draft', 'archived')
      or (char_length(btrim(description)) > 0 and char_length(btrim(location)) > 0)
    )
);

create unique index vacancies_slug_key on public.vacancies (slug);
create index vacancies_status_idx on public.vacancies (status);
-- Supports the public listing ("published, soonest closing first").
create index vacancies_public_listing_idx on public.vacancies (status, closing_date desc);

comment on table public.vacancies is
  'Recruitment vacancies. Applications are accepted only while status = published AND now() BETWEEN opening_date AND closing_date.';

create trigger vacancies_set_updated_at
  before update on public.vacancies
  for each row execute function public.set_updated_at();

-- =============================================================================
-- applicant_profiles
-- =============================================================================
create table public.applicant_profiles (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null unique,
  full_name         text not null,
  mobile            text not null,
  email             text not null,
  experience_type   public.experience_type not null,
  experience_years  numeric(3,1),
  current_employer  text,

  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  constraint applicant_profiles_user_id_fk
    foreign key (user_id) references auth.users (id) on delete cascade,

  constraint applicant_profiles_full_name_ck
    check (char_length(btrim(full_name)) between 2 and 120),

  -- Indian 10-digit mobile, optionally with a +91 / 0 prefix and separators
  -- stripped at the RPC layer before it reaches here.
  constraint applicant_profiles_mobile_ck
    check (mobile ~ '^\+?[0-9]{10,15}$'),

  constraint applicant_profiles_email_ck
    check (position('@' in email) > 1),

  -- §25: fresher => no/zero years, experienced => more than zero years.
  constraint applicant_profiles_experience_ck
    check (
      (
        experience_type = 'fresher'
        and (experience_years is null or experience_years = 0)
      )
      or (
        experience_type = 'experienced'
        and experience_years is not null
        and experience_years > 0
        and experience_years <= 60
      )
    )
);

create unique index applicant_profiles_user_id_key on public.applicant_profiles (user_id);

comment on table public.applicant_profiles is
  'One profile per authenticated Supabase user. Populated by a trigger on auth.users so the email always originates from the verified auth account (§8).';

create trigger applicant_profiles_set_updated_at
  before update on public.applicant_profiles
  for each row execute function public.set_updated_at();

-- =============================================================================
-- applications
-- =============================================================================
create table public.applications (
  id                 uuid primary key default gen_random_uuid(),
  vacancy_id         uuid not null,
  applicant_id       uuid not null,

  -- Denormalised snapshot of the profile at the moment of applying, so a later
  -- profile edit never rewrites history (§9).
  full_name          text not null,
  email              text not null,
  mobile             text not null,
  experience_type    public.experience_type not null,
  experience_years   numeric(3,1),
  current_employer   text,

  cover_letter       text,

  -- Storage object name inside the private `cvs` bucket (§13).
  -- Format: cvs/{applicant_user_id}/{application_id}/{generated_filename}
  cv_path            text not null,

  status             public.application_status not null default 'submitted',

  -- Internal only. Never returned to applicants by any RPC (§16, §19, §22).
  admin_notes        text,

  applied_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),

  constraint applications_vacancy_fk
    foreign key (vacancy_id) references public.vacancies (id) on delete restrict,

  constraint applications_applicant_fk
    foreign key (applicant_id) references auth.users (id) on delete restrict,

  -- §10: one application per applicant per vacancy. Database-level guarantee,
  -- so it also holds under concurrent/racing submissions.
  constraint applications_one_per_vacancy unique (vacancy_id, applicant_id),

  constraint applications_full_name_ck
    check (char_length(btrim(full_name)) between 2 and 120),

  constraint applications_mobile_ck
    check (mobile ~ '^\+?[0-9]{10,15}$'),

  constraint applications_email_ck
    check (position('@' in email) > 1),

  constraint applications_experience_ck
    check (
      (
        experience_type = 'fresher'
        and (experience_years is null or experience_years = 0)
      )
      or (
        experience_type = 'experienced'
        and experience_years is not null
        and experience_years > 0
        and experience_years <= 60
      )
    ),

  -- §12: a CV is mandatory.
  constraint applications_cv_path_ck
    check (
      cv_path is not null
      and char_length(cv_path) between 20 and 400
      and lower(cv_path) ~ '^cvs/'
    ),

  -- Keep the cover letter short so it cannot be abused as free storage.
  constraint applications_cover_letter_ck
    check (cover_letter is null or char_length(cover_letter) <= 4000),

  constraint applications_admin_notes_ck
    check (admin_notes is null or char_length(admin_notes) <= 8000)
);

create index applications_vacancy_idx on public.applications (vacancy_id);
create index applications_applicant_idx on public.applications (applicant_id, applied_at desc);
create index applications_status_idx on public.applications (status);
create index applications_applied_at_idx on public.applications (applied_at desc);
-- Supports the admin "filter by vacancy + status" table.
create index applications_vacancy_status_idx on public.applications (vacancy_id, status);

comment on table public.applications is
  'Job applications. Row-level access is granted only through RPCs so that admin_notes can never leak to applicants.';

create trigger applications_set_updated_at
  before update on public.applications
  for each row execute function public.set_updated_at();

-- =============================================================================
-- application_status_history
-- =============================================================================
create table public.application_status_history (
  id                     uuid primary key default gen_random_uuid(),
  application_id         uuid not null,
  old_status             public.application_status,
  new_status             public.application_status not null,
  changed_by             uuid,
  changed_at             timestamptz not null default now(),

  -- Shown to the applicant in their status timeline (§17).
  applicant_visible_note text,

  constraint application_status_history_application_fk
    foreign key (application_id) references public.applications (id) on delete cascade,

  constraint application_status_history_changed_by_fk
    foreign key (changed_by) references auth.users (id) on delete set null,

  constraint application_status_history_note_ck
    check (applicant_visible_note is null or char_length(applicant_visible_note) <= 2000)
);

create index application_status_history_application_idx
  on public.application_status_history (application_id, changed_at);

comment on table public.application_status_history is
  'Append-only audit trail of application status changes. Rows are written only by admin RPCs.';

-- =============================================================================
-- rate_limit_events — basic abuse protection without any paid service (§34)
-- =============================================================================
create table public.rate_limit_events (
  id          bigint generated always as identity primary key,
  action      text not null,
  -- md5 of the caller-supplied bucket key (an auth uid, or a lower-cased email
  -- address for pre-login flows). md5 is used purely as a stable grouping key
  -- for rate limiting; it is not relied on for anything security-sensitive.
  key_hash    text not null,
  created_at  timestamptz not null default now(),

  constraint rate_limit_events_action_ck
    check (action in ('otp_resend', 'application_submit', 'cv_upload', 'login_attempt', 'register_attempt'))
);

create index rate_limit_events_lookup_idx
  on public.rate_limit_events (action, key_hash, created_at desc);

comment on table public.rate_limit_events is
  'Rate-limiting ledger. Written and read exclusively by check_rate_limit() / record_rate_limit_event().';