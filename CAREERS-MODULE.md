# Careers & Recruitment Module

How the careers module on caashishrajput.com is put together, how to publish a
vacancy, and what has to be done before it works.

- **Stack:** static HTML/CSS/vanilla JS pages, Supabase Auth, Postgres with
  Row Level Security, and a private Storage bucket for CVs.
- **Content pipeline:** vacancies are Markdown sources rendered to static HTML
  at build time. The database is the source of truth for who can apply to what.
- **Browser code never holds a privileged key.** Only the `anon` key ships, and
  it is inert without the RLS policies in the migrations.

---

## 1. First-time setup

### 1.1 Supabase project

Create a project at supabase.com if you do not have one. Two things you will
need from it: the project URL and the `anon` public key.

### 1.2 Run the migrations

Open **SQL Editor** and run these three files in order. Order matters: the
schema exists before the RLS functions reference it, and the storage policies
reference `public.is_admin()`.

| Order | File |
|---|---|
| 1 | `supabase/migrations/20261002000001_careers_schema.sql` |
| 2 | `supabase/migrations/20261002000002_careers_rls.sql` |
| 3 | `supabase/migrations/20261002000003_careers_storage.sql` |

Each file is self-contained and safe to re-run.

### 1.3 Add the credentials

Edit the two constants at the top of `js/careers-config.js`:

```js
export const SUPABASE_URL = 'https://YOUR-PROJECT-REF.supabase.co';
export const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
```

Then push. Until both are real, every page shows a "not configured" notice and
no form will submit.

### 1.4 Enable email OTP

Supabase → **Authentication → Providers → Email**. Make sure email sign-in is
on. The default confirmation template contains `{{ .Token }}`, which is what
delivers the six-digit code. If you customised the template and removed it,
registration will not verify anybody.

### 1.5 Create the admin user

Sign up normally through `career/register.html`, then grant the role in the SQL
editor:

```sql
update auth.users
   set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
                         || '{"role":"admin"}'::jsonb
 where email = 'you@example.com';
```

That user is now redirected to `/admin/` after signing in, and every `admin_`
RPC accepts them.

**Why `raw_app_meta_data` and not `user_metadata`?** `user_metadata` is writable
by the browser — a visitor could set `role: admin` on themselves and every
client-side check would pass. `raw_app_meta_data` is only writable with the
service role, so it cannot be forged. The client-side check in
`requireAdmin()` is a convenience; the real gate is `require_admin()` inside
each RPC.

---

## 2. Publishing a vacancy

### 2.1 Create a source

```bash
npm run careers:new -- article-assistant "Article Assistant"
```

Writes `careers/_published/article-assistant.md`. Drafts go in `careers/drafts/`.

### 2.2 Review it

```bash
npm run careers:preview -- article-assistant
```

Writes a temp HTML file and prints any validation warnings — title and
description length, missing dates, a closing date before the opening date.

### 2.3 Publish

```bash
npm run careers:publish -- article-assistant
```

Writes `career/article-assistant.html`, updates `career/index.html` with the new
card, and updates `sitemap.xml`.

If `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set in the environment the
script also upserts the vacancy. **If they are not set it prints the exact
`select public.admin_upsert_vacancy(...)` call to paste into the SQL editor.**
That is the expected path for this repo — no secrets live in the repository.

### 2.4 Other commands

```bash
npm run careers:rebuild   # regenerate career/index.html and sitemap.xml
npm run careers:list      # show published vacancies and drafts
```

### 2.5 Slugs

The slug is the public filename: `career/article-assistant.html` is served at
`/career/article-assistant`. Changing a slug on a live vacancy breaks existing
links and any shared applications, so the admin form shows a warning and only
auto-generates slugs for new vacancies.

---

## 3. Routes

| Page | Purpose |
|---|---|
| `/career/` | Public vacancy list. Indexable. |
| `/career/<slug>.html` | Public vacancy detail with `JobPosting` JSON-LD. Indexable. |
| `/career/login.html` | Candidate sign-in. `noindex`. |
| `/career/register.html` | Registration and OTP verification. `noindex`. |
| `/career/apply.html` | CV upload and application. `noindex`. |
| `/career/dashboard.html` | Applicant's own applications. `noindex`. |
| `/admin/login.html` | Admin sign-in. `noindex`. |
| `/admin/` | Overview and counts. `noindex`. |
| `/admin/vacancies.html` | Create, edit, publish, close. `noindex`. |
| `/admin/applications.html` | Review, shortlist, update status. `noindex`. |

Extensionless aliases live in `_redirects` for Netlify and Cloudflare. **GitHub
Pages ignores `_redirects`**, so `.html` is the canonical form everywhere and
the module works on both without configuration.

---

## 4. Security model

This is the part worth reading before changing anything.

**Server-side authority.** Every read and write goes through a `SECURITY
DEFINER` function that calls `require_admin()` or `require_applicant()` first.
The grants at the end of the RLS migration expose only those listed functions;
helpers, guard triggers and admin predicates are revoked from `anon` and
`authenticated`.

**Vacancy windows.** `submit_application()` calls `assert_vacancy_open()`, which
reads `now()` server-side. A stale browser tab cannot apply to a closed role, and
clock skew on the client is irrelevant.

**CVs.** The bucket is private. Uploads are constrained to
`cvs/{user_id}/...`, and the SELECT policy allows only the owner or an admin. No
public URL is ever stored. Every read is a 2-minute signed URL minted on demand.

**Status history.** Applicants can only see events for their own rows, and only
the applicant-visible note — internal notes are never included in
`list_my_applications()`.

**Rate limiting.** `consume_rate_limit()` writes to `rate_limit_events` and the
browser calls it through `rateLimit()` in `careers-core.js`, which **fails
closed** on error. Actions are constrained by a CHECK constraint to
`otp_resend`, `application_submit`, `cv_upload`, `login_attempt`,
`register_attempt` — an unrecognised action is rejected, so adding one means
migrating the constraint too.

**Custom errors.** The migrations raise SQLSTATE codes `AJA001`–`AJA016` plus
readable `VALIDATION_FAILED:` messages. `friendlyError()` maps them to
applicant-facing text, so no raw Postgres error reaches a visitor.

---

## 5. Verification

```bash
npm run seo:validate
```

Checks every page for valid JSON-LD, exactly one H1, title and description
length, internal link integrity, and sitemap consistency.

Two things it deliberately does not do:

- It skips title and description *length* rules on `noindex` pages. Those exist
  to shape a search snippet, and the auth and admin screens never appear in
  results. Their `noindex` status, title, H1 and JSON-LD are still verified.
- It reports pre-existing `blog/*.html` title and description problems. These
  predate this module and are unrelated to it.

**Not covered:** anything requiring a live database. Auth, OTP, CV upload,
signed URLs, RLS and Storage are untested until real credentials exist. After
deploying, register → verify → upload a CV → apply is the path worth walking
first.

---

## 6. Housekeeping

CVs are personal data. Rejected applications in particular should not be kept
indefinitely. A `pg_cron` job for retention is sketched at the bottom of
`supabase/migrations/20261002000003_careers_storage.sql`.

To find orphaned files:

```sql
select name from storage.objects
 where bucket_id = 'cvs'
   and name not in (select cv_path from public.applications);
```