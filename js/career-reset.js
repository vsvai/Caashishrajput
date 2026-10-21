// js/career-reset.js — choose a new password after following the emailed link.
//
// The link from Supabase signs the visitor in with a short-lived recovery
// session (detectSessionInUrl is on), which is what authorises updateUser().

import {
  sb, $, alertBox, clearAlert, fieldError, setBusy, requireConfigured, toCareersError
} from './careers-core.js';

const form = $('#newpass-form');
const alert = $('#alert');
const wait = $('#reset-wait');

if (!requireConfigured()) {
  wait.hidden = true;
} else {
  init();
}

async function init() {
  const toggle = $('#password-toggle');
  toggle.addEventListener('click', function () {
    const field = $('#password');
    const showing = field.type === 'text';
    field.type = showing ? 'password' : 'text';
    toggle.textContent = showing ? 'Show' : 'Hide';
    toggle.setAttribute('aria-pressed', showing ? 'false' : 'true');
  });
  form.addEventListener('submit', onSubmit);

  let ready = false;
  function showForm() {
    if (ready) return;
    ready = true;
    wait.hidden = true;
    form.hidden = false;
    $('#password').focus();
  }

  sb.auth.onAuthStateChange(function (event) {
    if (event === 'PASSWORD_RECOVERY') showForm();
  });

  // The recovery session may already be in place before the listener attached.
  const hasLinkParams = /type=recovery|access_token|code=/.test(window.location.hash + window.location.search);
  setTimeout(async function () {
    if (ready) return;
    const { data } = await sb.auth.getSession();
    if (data && data.session && hasLinkParams) { showForm(); return; }
    wait.hidden = true;
    alertBox(alert, 'This password reset link is invalid or has expired. Please request a new one.', 'error');
  }, 2000);
}

async function onSubmit(event) {
  event.preventDefault();
  clearAlert(alert);
  fieldError('password', '');
  fieldError('confirm', '');
  const password = $('#password').value;
  const confirm = $('#confirm').value;
  let invalid = false;
  if (password.length < 8) { fieldError('password', 'Your password must be at least 8 characters.'); invalid = true; }
  else if (confirm !== password) { fieldError('confirm', 'The two passwords do not match.'); invalid = true; }
  if (invalid) return;

  const btn = $('#submit-btn');
  setBusy(btn, true, 'Saving…');
  try {
    const { error } = await sb.auth.updateUser({ password: password });
    if (error) throw error;
    await sb.auth.signOut();
    form.hidden = true;
    $('#reset-foot').hidden = true;
    alertBox(alert, 'Your password has been changed. ', 'success');
    const link = document.createElement('a');
    link.href = 'login.html';
    link.textContent = 'Sign in with your new password';
    alert.appendChild(link);
    alert.appendChild(document.createTextNode('.'));
  } catch (err) {
    alertBox(alert, toCareersError(err).message, 'error');
  } finally {
    setBusy(btn, false);
  }
}
