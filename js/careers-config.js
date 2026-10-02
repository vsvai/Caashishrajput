// js/careers-config.js — Careers & Recruitment module configuration.
//
// ============================================================================
//  STATUS: credentials set. Migrations still need to be run.
// ============================================================================
//  DONE
//    1. Project URL and publishable key filled in below.
//    2. Auth email provider confirmed enabled (mailer_autoconfirm is false, so
//       the six-digit confirmation code is required).
//
//  STILL TODO — without this the pages show a setup notice:
//    3. Run the three SQL files in supabase/migrations/ in order, then promote
//       your own account with the raw_app_meta_data update in
//       CAREERS-MODULE.md §1.5.
//
//  The publishable key below is designed to be public: it grants only what Row
//  Level Security and the SECURITY DEFINER RPCs in the migrations allow, and
//  those policies are the real security boundary. Never put a secret or
//  service_role key in this file — it bypasses RLS and would expose every
//  applicant's CV.
// ============================================================================

export const SUPABASE_URL = 'https://npcpucisiabntaryccnt.supabase.co';

// The publishable (`sb_publishable_`) key, safe to ship: it only grants what
// Row Level Security allows. Never put a secret/service_role key in this file.
export const SUPABASE_ANON_KEY = 'sb_publishable_eFbi4n6rT5aRKqu1Rb5lrQ_8xrIG07N';

// CV rules. The database enforces the same limits independently
// (begin_cv_upload / submit_application), so changing these only changes the
// early, friendly feedback in the browser.
export const CV_MAX_BYTES = 5 * 1024 * 1024; // 5 MB
export const CV_EXTENSIONS = ['pdf', 'doc', 'docx'];
export const CV_ACCEPT = '.pdf,.doc,.docx,application/pdf,' +
  'application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document';

// Rate limits, mirrored from consume_rate_limit() calls in the migrations.
export const RATE_LIMITS = {
  register: { limit: 5, windowSeconds: 3600 },
  otpResend: { limit: 5, windowSeconds: 3600 },
  login: { limit: 10, windowSeconds: 900 }
};

// OTP resend cooldown enforced in the UI, in addition to the server limit.
export const OTP_RESEND_COOLDOWN_SECONDS = 60;

export const BUCKET = 'cvs';

// Google may index /career and vacancy pages, but never anything that shows a
// signed-in person's data.
export const SEO = {
  siteName: 'Ashish Jayalata & Associates',
  baseUrl: 'https://caashishrajput.com'
};

export function isConfigured() {
  return SUPABASE_URL.indexOf('YOUR-PROJECT-REF') === -1 &&
    SUPABASE_ANON_KEY.indexOf('YOUR_SUPABASE_ANON_KEY') === -1;
}