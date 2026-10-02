// js/career-login.js — candidate sign-in (§6).
//
// Password sign-in only. Email OTP sign-in is deliberately NOT offered here:
// adding a second factor means two ways to fail, and the applicant only needs
// to prove they own the mailbox once, at registration, to keep the CV and
// application rows tied to a verified identity.

import {
  sb, RATE_LIMITS, isConfigured,
  $, alertBox, clearAlert, fieldError, setBusy, requireConfigured,
  currentUser, nextTarget, toCareersError, rateLimit
} from './careers-core.js';

const form = $('#login-form');
const alert = $('#alert');
const emailInput = $('#email');
const passwordInput = $('#password');
const submitBtn = $('#submit-btn');

if (!requireConfigured()) {
  form.hidden = true;
} else {
  init();
}

function init() {
  // Already signed in? Skip the form.
  currentUser().then(function (user) {
    if (user) redirectAfterAuth(user);
  }).catch(function () { /* fall through to the form */ });

  form.addEventListener('submit', onSubmit);

  const toggle = $('#password-toggle');
  toggle.addEventListener('click', function () {
    const showing = passwordInput.type === 'text';
    passwordInput.type = showing ? 'password' : 'text';
    toggle.textContent = showing ? 'Show' : 'Hide';
    toggle.setAttribute('aria-label', showing ? 'Show password' : 'Hide password');
    toggle.setAttribute('aria-pressed', showing ? 'false' : 'true');
    passwordInput.focus();
  });
}

async function onSubmit(event) {
  event.preventDefault();
  clearAlert(alert);
  fieldError('email', '');
  fieldError('password', '');

  const email = emailInput.value.trim().toLowerCase();
  const password = passwordInput.value;

  let invalid = false;
  if (!email) { fieldError('email', 'Please enter your email address.'); invalid = true; }
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { fieldError('email', 'Please enter a valid email address.'); invalid = true; }
  if (!password) { fieldError('password', 'Please enter your password.'); invalid = true; }
  if (invalid) return;

  setBusy(submitBtn, true, 'Signing in…');

  try {
    // §34: fail fast on repeated attempts. The same limit is enforced again
    // server-side, so this only saves the visitor a round trip.
    // 'login_attempt' must match rate_limit_events_action_ck exactly; an unknown
    // action is rejected by the CHECK constraint and would break sign-in.
    const allowed = await rateLimit(
      'login_attempt', email, RATE_LIMITS.login.limit, RATE_LIMITS.login.windowSeconds
    );
    if (!allowed) {
      alertBox(alert, 'Too many sign-in attempts. Please wait a few minutes and try again.', 'error');
      return;
    }

    const { data, error } = await sb.auth.signInWithPassword({ email: email, password: password });
    if (error) throw error;

    const user = data.user;
    if (!user) {
      alertBox(alert, 'We could not sign you in. Please try again.', 'error');
      return;
    }

    // §7: an unverified applicant is sent back to the OTP step rather than
    // being shown the dashboard.
    if (!user.email_confirmed_at) {
      window.location.href = 'register.html?verify=' + encodeURIComponent(email) +
        (nextTarget() ? '&next=' + encodeURIComponent(nextTarget()) : '');
      return;
    }

    redirectAfterAuth(user);
  } catch (err) {
    const friendly = toCareersError(err);
    alertBox(alert, friendly.message, 'error');
    if (friendly.field === 'password') fieldError('password', '');
    if (friendly.field === 'email') fieldError('email', '');
    passwordInput.select();
  } finally {
    setBusy(submitBtn, false);
  }
}

function redirectAfterAuth(user) {
  const next = nextTarget();
  if (next) { window.location.href = next; return; }

  // Admins have no business in the applicant dashboard.
  const role = (user.app_metadata && user.app_metadata.role) || null;
  if (role === 'admin') {
    window.location.href = '../admin/index.html';
    return;
  }
  window.location.href = 'dashboard.html';
}