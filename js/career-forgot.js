// js/career-forgot.js — password reset request and "forgot user ID" lookup.
//
// The user ID is the email address. The lookup form tells a visitor whether an
// account exists for an address they type; it never lists or reveals anything
// else. Both calls are throttled in the database.

import {
  sb, RATE_LIMITS, $, alertBox, clearAlert, fieldError, setBusy, requireConfigured,
  toCareersError, rateLimit, emailHasAccount, registerHref
} from './careers-core.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const resetForm = $('#reset-form');
const lookupForm = $('#lookup-form');
const alert = $('#alert');
const lookupAlert = $('#lookup-alert');

if (!requireConfigured()) {
  resetForm.hidden = true;
  lookupForm.hidden = true;
} else {
  resetForm.addEventListener('submit', onReset);
  lookupForm.addEventListener('submit', onLookup);
}

function readEmail(id) {
  fieldError(id, '');
  const email = $('#' + id).value.trim().toLowerCase();
  if (!email) { fieldError(id, 'Please enter your email address.'); return null; }
  if (!EMAIL_RE.test(email)) { fieldError(id, 'Please enter a valid email address.'); return null; }
  return email;
}

function noAccount(box, email) {
  alertBox(box, 'No account is registered with ' + email + '. ', 'error');
  const link = document.createElement('a');
  link.href = registerHref();
  link.textContent = 'Create an account';
  box.appendChild(link);
  box.appendChild(document.createTextNode(' or check the spelling.'));
}

async function onReset(event) {
  event.preventDefault();
  clearAlert(alert);
  const email = readEmail('email');
  if (!email) return;
  const btn = $('#submit-btn');
  setBusy(btn, true, 'Sending…');
  try {
    const allowed = await rateLimit('otp_resend', 'reset:' + email, RATE_LIMITS.otpResend.limit, RATE_LIMITS.otpResend.windowSeconds);
    if (!allowed) {
      alertBox(alert, 'Too many requests. Please wait a few minutes and try again.', 'error');
      return;
    }
    if (!(await emailHasAccount(email))) {
      noAccount(alert, email);
      return;
    }
    const redirectTo = new URL('reset-password.html', window.location.href).href;
    const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: redirectTo });
    if (error) throw error;
    alertBox(alert, 'We have emailed a password reset link to ' + email + '. Check your inbox and spam folder; the link works for a limited time.', 'success');
  } catch (err) {
    alertBox(alert, toCareersError(err).message, 'error');
  } finally {
    setBusy(btn, false);
  }
}

async function onLookup(event) {
  event.preventDefault();
  clearAlert(lookupAlert);
  const email = readEmail('lookup-email');
  if (!email) return;
  const btn = $('#lookup-btn');
  setBusy(btn, true, 'Checking…');
  try {
    if (await emailHasAccount(email)) {
      alertBox(lookupAlert, 'Yes, an account exists for ' + email + '. That is your user ID. ', 'success');
      const link = document.createElement('a');
      link.href = 'login.html';
      link.textContent = 'Sign in';
      lookupAlert.appendChild(link);
      lookupAlert.appendChild(document.createTextNode(', or reset your password above if you have forgotten it.'));
    } else {
      noAccount(lookupAlert, email);
    }
  } catch (err) {
    alertBox(lookupAlert, toCareersError(err).message, 'error');
  } finally {
    setBusy(btn, false);
  }
}
