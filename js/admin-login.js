// js/admin-login.js — administrator sign-in (§17).
//
// Deliberately separate from the candidate sign-in: an admin lands in the admin
// area, and a candidate lands in their dashboard. The role is read from
// app_metadata, which only the service role can write.

import {
  $, alertBox, clearAlert, fieldError, setBusy, requireConfigured,
  currentUser, isAdminUser, nextTarget, rootPrefix, toCareersError, rateLimit
} from './careers-core.js';

const form = $('#admin-login-form');
const alert = $('#alert');
const submitBtn = $('#submit-btn');

if (!requireConfigured()) {
  form.hidden = true;
} else {
  init();
}

function init() {
  currentUser().then(function (user) {
    if (isAdminUser(user)) redirectAfterAuth();
  }).catch(function () { /* stay on the form */ });

  form.addEventListener('submit', onSubmit);

  const toggle = $('#password-toggle');
  toggle.addEventListener('click', function () {
    const showing = $('#password').type === 'text';
    $('#password').type = showing ? 'password' : 'text';
    toggle.textContent = showing ? 'Show' : 'Hide';
    toggle.setAttribute('aria-label', showing ? 'Show password' : 'Hide password');
    toggle.setAttribute('aria-pressed', showing ? 'false' : 'true');
    $('#password').focus();
  });
}

async function onSubmit(event) {
  event.preventDefault();
  clearAlert(alert);
  fieldError('email', '');
  fieldError('password', '');

  const email = $('#email').value.trim().toLowerCase();
  const password = $('#password').value;

  let invalid = false;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { fieldError('email', 'Please enter a valid email address.'); invalid = true; }
  if (!password) { fieldError('password', 'Please enter your password.'); invalid = true; }
  if (invalid) return;

  setBusy(submitBtn, true, 'Signing in…');

  try {
    // Shares the login_attempt bucket with the candidate sign-in: both are
    // password guesses against Supabase Auth, so one shared budget is
    // what actually slows an attacker down.
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

    // Password alone is not authority. Without the admin role we refuse here,
    // and require_admin() would refuse again inside every admin_ RPC.
    if (!isAdminUser(user)) {
      await sb.auth.signOut();
      alertBox(alert, 'That account does not have administrator access.', 'error');
      return;
    }

    redirectAfterAuth();
  } catch (err) {
    const friendly = toCareersError(err);
    alertBox(alert, friendly.message, 'error');
    $('#password').select();
  } finally {
    setBusy(submitBtn, false);
  }
}

function redirectAfterAuth() {
  const next = nextTarget();
  window.location.href = next || (rootPrefix() ? rootPrefix() + 'admin/index.html' : 'index.html');
}