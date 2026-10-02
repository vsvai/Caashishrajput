-- =============================================================================
-- Careers & Recruitment — Phase 3: private CV storage bucket + policies
--
-- §12/§13/§14: CVs are personal data, so the bucket is private, uploads are
-- scoped to the owner's own folder, and nothing is ever exposed via a
-- permanent public URL. Admins read CVs through short-lived signed URLs, which
-- only work for a signed-in principal that passes the SELECT policy below.
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'cvs',
  'cvs',
  false,                       -- private: no public URLs, ever
  5242880,                     -- 5 MB (§12)
  array[
    'application/pdf',
    'application/msword',
    'application/x-msword',
    'application/vnd.ms-word',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/zip',
    'application/octet-stream'
  ]::text[]
)
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- -----------------------------------------------------------------------------
-- Policies (scoped strictly to bucket_id = 'cvs')
-- -----------------------------------------------------------------------------

-- Applicants may upload into their own folder only: cvs/{their own uid}/...
-- The second path segment is the application id reserved by begin_cv_upload();
-- submit_application() re-checks the full path and the server-side file metadata.
create policy "applicants upload own cv"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'cvs'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
    and lower(storage.extension(name)) in ('pdf', 'doc', 'docx')
  );

-- Read access: the owner, or an administrator. This is what makes createSignedUrl
-- work for a CV and what stops one applicant reading another's CV (§22).
create policy "applicants read own cv or admins read any cv"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'cvs'
    and (
      (storage.foldername(name))[1] = (select auth.uid()::text)
      or public.is_admin()
    )
  );

-- Replace-in-place is confined to the owner's folder.
create policy "applicants update own cv"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'cvs'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  )
  with check (
    bucket_id = 'cvs'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

-- Delete: the owner may remove their own file (used to clean up an upload that
-- failed validation). Administrators may remove any file — that is how
-- admin_delete_application() clears the CV.
create policy "applicants or admins delete cv"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'cvs'
    and (
      (storage.foldername(name))[1] = (select auth.uid()::text)
      or public.is_admin()
    )
  );

-- -----------------------------------------------------------------------------
-- Housekeeping
-- -----------------------------------------------------------------------------
-- Uploaded CVs of rejected applications are personal data. Schedule this from
-- the Supabase SQL editor (or pg_cron) once the retention window suits you:
--
--   select cron.schedule('purge-rejected-cvs', '17 3 * * *', $$
--     delete from storage.objects o
--     using public.applications a
--     where o.bucket_id = 'cvs'
--       and o.name = a.cv_path
--       and a.status = 'rejected'
--       and a.updated_at < now() - interval '90 days';
--   $$);
--
-- Note: storage.objects rows are removed by the Storage API in normal use; the
-- above is intended for a periodic audit and should be paired with a Storage
-- API cleanup job if you enable object deletion.
-- =============================================================================