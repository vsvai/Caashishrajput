// js/careers-core.js — shared runtime for the careers module.
//
// This site is static, so there is no server-side code to call. Every rule
// (email verification, vacancy opening/closing window, one application per
// vacancy, CV ownership, admin-only access) is enforced by Postgres — see
// supabase/migrations/. This module is only responsible for talking to Supabase
// and turning database error codes into messages a visitor can act on.

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import {
  SUPABASE_URL, SUPABASE_ANON_KEY,
  CV_MAX_BYTES, CV_EXTENSIONS, CV_ACCEPT, BUCKET,
  RATE_LIMITS, OTP_RESEND_COOLDOWN_SECONDS, isConfigured
} from './careers-config.js';

export const sb = isConfigured()
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  : null;

export { CV_MAX_BYTES, CV_EXTENSIONS, CV_ACCEPT, BUCKET, RATE_LIMITS, OTP_RESEND_COOLDOWN_SECONDS, isConfigured };

/* ===========================================================================
   Errors — §33. Raw Supabase/Postgres errors never reach the visitor.
   =========================================================================== */

const CODE_MESSAGES = {
  AUTH_REQUIRED:         ['Please sign in to continue.', 'signin'],
  EMAIL_NOT_VERIFIED:    ['Please verify your email address before applying. Check your inbox for the code we sent you.', 'verify'],
  VACANCY_NOT_FOUND:     ['This position is no longer available.', 'career'],
  VACANCY_NOT_PUBLISHED: ['This position is not open for applications.', 'career'],
  VACANCY_NOT_YET_OPEN:  ['Applications for this position have not opened yet. Please check the opening date and try again later.', 'career'],
  VACANCY_CLOSED:        ['Applications for this position are now closed.', 'career'],
  DUPLICATE_APPLICATION: ['You have already applied for this position.', 'dashboard'],
  CV_MISSING:            ['Please attach your CV (PDF, DOC or DOCX).', 'cv'],
  CV_INVALID_TYPE:       ['That file type is not supported. Please upload a PDF, DOC or DOCX file.', 'cv'],
  CV_TOO_LARGE:          ['Your CV is larger than 5 MB. Please compress it and try again.', 'cv'],
  CV_NOT_OWNED:          ['We could not accept that file. Please choose your CV again.', 'cv'],
  NOT_FOUND:             ['We could not find that record.', null],
  ADMIN_REQUIRED:        ['You are not authorised to view this page.', null],
  RATE_LIMITED:          ['Too many attempts. Please wait a few minutes and try again.', null],
  VALIDATION_FAILED:     ['Please check the highlighted details and try again.', null],
  PROFILE_INCOMPLETE:    ['Please complete your applicant profile before applying.', 'dashboard']
};

// Raised SQLSTATE codes arrive as err.code; the `raise exception 'X'` text
// arrives as err.message. Match on either so wording changes cannot break us.
export function friendlyError(err) {
  if (!err) return { message: 'Something went wrong. Please try again.', code: null };

  if (err.code === 'otp_expired' || /expired or is invalid/i.test(err.message || '')) {
    return { code: 'OTP_EXPIRED', message: 'That verification code is invalid or has expired. Request a new one.', field: 'otp' };
  }
  if (err.code === 'email_not_confirmed' || /Email not confirmed/i.test(err.message || '')) {
    return { code: 'EMAIL_NOT_VERIFIED', message: CODE_MESSAGES.EMAIL_NOT_VERIFIED[0], field: 'verify' };
  }
  if (/Invalid login credentials/i.test(err.message || '')) {
    return { code: 'BAD_CREDENTIALS', message: 'That email address and password combination is not correct.', field: 'password' };
  }

  const code = (err.code && CODE_MESSAGES[err.code]) ? err.code : (CODE_MESSAGES[err.message] ? err.message : null);
  if (code) {
    const [message, action] = CODE_MESSAGES[code];
    return { code: code, message: message, action: action };
  }

  // Never surface a raw driver/Postgres message to the visitor.
  console.error('[careers] unhandled error', err);
  return {
    code: err.code || 'UNKNOWN',
    message: 'We could not complete that request. Please try again in a moment.',
    action: null
  };
}

export class CareersError extends Error {
  constructor(result) {
    super(result.message);
    this.code = result.code;
    this.action = result.action;
    this.field = result.field;
  }
}

function toCareersError(err) {
  if (err instanceof CareersError) return err;
  return new CareersError(friendlyError(err));
}

/* ===========================================================================
   Small utilities
   =========================================================================== */

export function esc(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function $(selector, scope) { return (scope || document).querySelector(selector); }
export function $$(selector, scope) { return Array.prototype.slice.call((scope || document).querySelectorAll(selector)); }

const IST = 'Asia/Kolkata';

const dateFmt = new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric', timeZone: IST });
const dateTimeFmt = new Intl.DateTimeFormat('en-IN', {
  day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  hour12: true, timeZone: IST
});

export function fmtDate(value) {
  if (!value) return '';
  const d = new Date(value);
  return isNaN(d.getTime()) ? '' : dateFmt.format(d);
}

export function fmtDateTime(value) {
  if (!value) return '';
  const d = new Date(value);
  return isNaN(d.getTime()) ? '' : dateTimeFmt.format(d) + ' IST';
}

export function rootPrefix() {
  return document.body.getAttribute('data-root') || '';
}

/* ===========================================================================
   Application status presentation (§15, §16)
   =========================================================================== */

export const STATUS_META = {
  submitted:    { label: 'Submitted',    step: 1, cls: 'st-submitted' },
  under_review: { label: 'Under Review', step: 2, cls: 'st-review' },
  shortlisted:  { label: 'Shortlisted',  step: 3, cls: 'st-shortlisted' },
  interview:    { label: 'Interview',    step: 4, cls: 'st-interview' },
  selected:     { label: 'Selected',     step: 5, cls: 'st-selected', terminal: true },
  rejected:     { label: 'Not Selected', step: 5, cls: 'st-rejected', terminal: true },
  withdrawn:    { label: 'Withdrawn',    step: 5, cls: 'st-withdrawn', terminal: true }
};

export const TIMELINE_STEPS = [
  { key: 'submitted',    label: 'Application Submitted' },
  { key: 'under_review', label: 'Under Review' },
  { key: 'shortlisted',  label: 'Shortlisted' },
  { key: 'interview',    label: 'Interview' },
  { key: 'selected',     label: 'Selected' }
];

export function statusMeta(status) {
  return STATUS_META[status] || { label: status || 'Unknown', step: 1, cls: 'st-submitted' };
}

export function statusBadge(status) {
  const m = statusMeta(status);
  return '<span class="status-badge ' + m.cls + '">' + esc(m.label) + '</span>';
}

/* ===========================================================================
   Rate limiting (§34) — the database is the authority; this just gives a
   faster, friendlier response when it refuses.
   =========================================================================== */

export async function rateLimit(action, key, limit, windowSeconds) {
  const { data, error } = await sb.rpc('consume_rate_limit', {
    p_action: action,
    p_key: key,
    p_limit: limit,
    p_window_seconds: windowSeconds
  });
  if (error) {
    // A failure to rate-limit must not silently allow abuse: fail closed.
    console.error('[careers] rate limit check failed', error);
    throw new CareersError({ code: 'RATE_LIMITED', message: CODE_MESSAGES.RATE_LIMITED[0] });
  }
  return data === true;
}

/* ===========================================================================
   Session helpers
   =========================================================================== */

export function nextTarget() {
  const params = new URLSearchParams(window.location.search);
  const next = params.get('next');
  if (!next) return '';
  // Only ever redirect within this site.
  if (/^[a-z]+:/i.test(next) || next.indexOf('//') === 0) return '';
  return next;
}

export function loginHref() {
  return rootPrefix() + 'career/login.html' + (nextTarget() ? '?next=' + encodeURIComponent(nextTarget()) : '');
}

export function registerHref() {
  return rootPrefix() + 'career/register.html' + (nextTarget() ? '?next=' + encodeURIComponent(nextTarget()) : '');
}

export function dashboardHref() {
  return rootPrefix() + 'career/dashboard.html';
}

export async function currentSession() {
  const { data, error } = await sb.auth.getSession();
  if (error) throw toCareersError(error);
  return data.session;
}

export async function currentUser() {
  const { data, error } = await sb.auth.getUser();
  if (error) throw toCareersError(error);
  return data.user;
}

/**
 * Admin authorisation (§17, §23).
 *
 * Hiding admin pages behind JavaScript is not security — it is only a courtesy.
 * The real gate is `require_admin()` inside every admin_ RPC, which reads
 * auth.users.raw_app_meta_data and rejects anyone whose role is not 'admin'.
 * That value is writable only by the service role (or the SQL editor), never by
 * the browser, so a visitor cannot promote themselves by editing app_metadata
 * in localStorage.
 *
 * Because app_metadata is read from the server on getUser(), a change takes
 * effect immediately without needing a fresh token.
 */
export async function requireAdmin() {
  const user = await currentUser();
  if (!user) {
    window.location.href = rootPrefix() + 'admin/login.html?next=' +
      encodeURIComponent(window.location.pathname + window.location.search);
    return null;
  }

  const role = user.app_metadata && user.app_metadata.role;
  if (role !== 'admin') {
    // Signed in, but not an admin. Send them back to the public careers page
    // rather than showing an empty shell.
    window.location.href = rootPrefix() + 'career/index.html';
    return null;
  }

  return user;
}

export function isAdminUser(user) {
  return !!user && !!user.app_metadata && user.app_metadata.role === 'admin';
}

/**
 * Resolves to the signed-in user, or redirects to the login page.
 * `requireVerified` additionally enforces §7: an unverified applicant cannot
 * proceed. The database enforces this too — this only improves the experience.
 */
export async function requireUser(options) {
  const opts = options || {};
  const user = await currentUser();
  if (!user) {
    window.location.href = loginHref();
    return null;
  }
  if (opts.requireVerified && !user.email_confirmed_at) {
    window.location.href = registerHref() + (window.location.search || '');
    return null;
  }
  return user;
}

/* ===========================================================================
   Vacancies
   =========================================================================== */

export async function fetchVacancyBySlug(slug) {
  if (!slug) return null;
  const { data, error } = await sb.rpc('public_get_vacancy', { p_slug: slug });
  if (error) throw toCareersError(error);
  return data || null;
}

export async function fetchVacancies() {
  const { data, error } = await sb.rpc('public_list_vacancies');
  if (error) throw toCareersError(error);
  return data || [];
}

/**
 * Single source of truth for the apply button's state, used by every page that
 * links to the form. The database re-checks all of this at submit time.
 */
export function applyState(vacancy) {
  if (!vacancy) return { canApply: false, label: 'Position Unavailable', tone: 'muted' };
  if (vacancy.is_open) return { canApply: true, label: 'Apply Now', tone: 'primary' };
  if (vacancy.status === 'published') {
    const now = Date.now();
    if (new Date(vacancy.opening_date).getTime() > now) {
      return { canApply: false, label: 'Applications Open Soon', tone: 'muted' };
    }
    return { canApply: false, label: 'Applications Closed', tone: 'muted' };
  }
  if (vacancy.status === 'closed') return { canApply: false, label: 'Applications Closed', tone: 'muted' };
  return { canApply: false, label: 'Position Unavailable', tone: 'muted' };
}

/* ===========================================================================
   CV access (§14) — short-lived signed URLs only, never a stored public URL.
   =========================================================================== */

export async function cvSignedUrl(path, expiresInSeconds) {
  const { data, error } = await sb.storage.from(BUCKET).createSignedUrl(path, expiresInSeconds || 120);
  if (error) throw toCareersError({ code: error.statusCode === 404 ? 'NOT_FOUND' : 'CV_MISSING', message: error.message });
  return data.signedUrl;
}

export async function openCv(path, expiresInSeconds) {
  const url = await cvSignedUrl(path, expiresInSeconds);
  window.open(url, '_blank', 'noopener');
}

/* ===========================================================================
   Client-side CV pre-check (§12). The database repeats all of this using
   server-side file metadata.
   =========================================================================== */

export function validateCvFile(file) {
  if (!file) return { ok: false, code: 'CV_MISSING', message: 'Please choose a CV file to upload.' };

  const name = (file.name || '').toLowerCase();
  const dot = name.lastIndexOf('.');
  const ext = dot === -1 ? '' : name.slice(dot + 1);

  if (!CV_EXTENSIONS.indexOf(ext)) {
    return { ok: false, code: 'CV_INVALID_TYPE', message: 'Unsupported file type. Please upload a PDF, DOC or DOCX file.' };
  }
  if (file.size > CV_MAX_BYTES) {
    const mb = (file.size / (1024 * 1024)).toFixed(1);
    return { ok: false, code: 'CV_TOO_LARGE', message: 'That file is ' + mb + ' MB. The limit is 5 MB — please compress it and try again.' };
  }
  if (file.size === 0) {
    return { ok: false, code: 'CV_MISSING', message: 'That file appears to be empty.' };
  }
  return { ok: true, ext: ext };
}

/* ===========================================================================
   Form feedback
   =========================================================================== */

export function alertBox(el, message, kind) {
  if (!el) return;
  el.hidden = false;
  el.className = 'form-alert form-alert-' + (kind || 'error');
  el.textContent = message;
  el.setAttribute('role', kind === 'error' ? 'alert' : 'status');
}

export function clearAlert(el) {
  if (!el) return;
  el.hidden = true;
  el.textContent = '';
}

export function fieldError(inputId, message) {
  const input = document.getElementById(inputId);
  const holder = document.getElementById(inputId + '-error');
  if (input) {
    input.setAttribute('aria-invalid', message ? 'true' : 'false');
    if (message) input.classList.add('has-error');
    else input.classList.remove('has-error');
  }
  if (holder) {
    holder.textContent = message || '';
    holder.hidden = !message;
  }
  if (message && input) {
    input.focus();
  }
}

export function setBusy(button, busy, busyLabel) {
  if (!button) return;
  if (busy) {
    button.dataset.label = button.dataset.label || button.textContent;
    button.disabled = true;
    button.textContent = busyLabel || 'Please wait…';
    button.setAttribute('aria-busy', 'true');
  } else {
    button.disabled = false;
    button.textContent = button.dataset.label || button.textContent;
    button.removeAttribute('aria-busy');
  }
}

/**
 * Shows a banner when js/careers-config.js has not been filled in yet, so a
 * half-configured deployment fails loudly instead of silently doing nothing.
 */
export function requireConfigured(container) {
  if (isConfigured()) return true;
  const host = container || document.body;
  const box = document.createElement('div');
  box.className = 'form-alert form-alert-error setup-notice';
  box.setAttribute('role', 'alert');
  box.textContent = 'The careers module is not configured yet. Add your Supabase URL and anon key to js/careers-config.js.';
  host.insertBefore(box, host.firstChild);
  return false;
}

export { toCareersError };