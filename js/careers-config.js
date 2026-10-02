// js/careers-config.js — Careers & Recruitment module configuration.
//
// ============================================================================
//  SET THIS UP ONCE
// ============================================================================
//  1. Supabase dashboard -> Project Settings -> API
//  2. Copy the Project URL and the `anon` public key into the two constants
//     below.
//  3. Run the three SQL files in supabase/migrations/ in order (SQL editor).
//
//  The `anon` key is designed to be public: it only grants what Row Level
//  Security and the SECURITY DEFINER RPCs in the migrations allow. Never put
//  the service_role key in this file — it would expose every applicant's CV.
// ============================================================================

export const SUPABASE_URL = 'https://YOUR-PROJECT-REF.supabase.co';
export const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

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