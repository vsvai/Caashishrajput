// js/career-register.js — account creation and email verification (§5, §7, §8).
//
// Three steps in one page, because bouncing between pages mid-signup loses
// state on a static site:
//   1. details  -> signUp() with metadata the DB trigger uses to prefill the profile
//   2. verify   -> verifyOtp() against the emailed 6-digit code
//   3. profile  -> upsert_my_profile()
//
// Email is only ever considered verified by Supabase. The database re-checks
// email_confirmed_at on every protected call, so skipping step 2 gains nothing.

import {
  sb, RATE_LIMITS, OTP_RESEND_COOLDOWN_SECONDS,
  $, $$, alertBox, clearAlert, fieldError, setBusy, requireConfigured,
  currentUser, nextTarget, rootPrefix, toCareersError, rateLimit
} from './careers-core.js';

const alert = $('#alert');
const stepper = $('#stepper');

const registerForm = $('#register-form');
const otpForm = $('#otp-form');
const profileForm = $('#profile-form');
const signinSwitch = $('#signin-switch');

const submitBtn = $('#submit-btn');
const otpSubmitBtn = $('#otp-submit-btn');
const profileSubmitBtn = $('#profile-submit-btn');
const resendBtn = $('#resend-btn');
const otpTarget = $('#otp-target');
const resendNote = $('#resend-note');
const yearsRow = $('#years-row');

let pendingEmail = '';
let cooldownTimer = null;

if (!requireConfigured()) {
  registerForm.hidden = true;
} else {
  init();
}

function init() {
  registerForm.addEventListener('submit', onRegister);
  otpForm.addEventListener('submit', onVerify);
  profileForm.addEventListener('submit', onSaveProfile);
  resendBtn.addEventListener('click', onResend);
  otpTarget.addEventListener('click', focusOtp);

  $$('input[name="experience_type"]').forEach(function (input) {
    input.addEventListener('change', onExperienceTypeChange);
  });

  const toggle = $('#password-toggle');
  toggle.addEventListener('click', function () {
    const showing = $('#password').type === 'text';
    $('#password').type = showing ? 'password' : 'text';
    toggle.textContent = showing ? 'Show' : 'Hide';
    toggle.setAttribute('aria-label', showing ? 'Show password' : 'Hide password');
    toggle.setAttribute('aria-pressed', showing ? 'false' : 'true');
    $('#password').focus();
  });

  // Reached from login.html when an unverified user tries to sign in, or when
  // the confirmation link lands with ?verify=<email>.
  const params = new URLSearchParams(window.location.search);
  const prefill = params.get('verify');
  if (prefill) {
    pendingEmail = prefill.trim().toLowerCase();
    $('#email').value = pendingEmail;
    showStep(2);
    // The account already exists at this point; only the code is outstanding.
    startResendCooldown();
  }

  // Already signed in and verified? Go straight to the dashboard.
  currentUser().then(function (user) {
    if (user && user.email_confirmed_at) finish();
    else if (user) { showStep(2); otpTarget.focus(); }
  }).catch(function () { /* stay on step 1 */ });
}

/* ---------- step 1: account ---------- */
async function onRegister(event) {
  event.preventDefault();
  clearAlert(alert);
  ['full_name', 'mobile', 'email', 'password', 'confirm_password'].forEach(function (id) {
    fieldError(id, '');
  });

  const fullName = $('#full_name').value.trim();
  const mobile = $('#mobile').value.trim();
  const email = $('#email').value.trim().toLowerCase();
  const password = $('#password').value;
  const confirm = $('#confirm_password').value;

  let invalid = false;
  if (fullName.length < 2) { fieldError('full_name', 'Please enter your full name.'); invalid = true; }

  // Matched to the CHECK constraint applicant_profiles_mobile_ck so the browser
  // and the database agree on what a mobile number is.
  const digits = mobile.replace(/[^\d]/g, '');
  if (!/^\+?[0-9]{10,15}$/.test(mobile) || digits.length < 10) {
    fieldError('mobile', 'Please enter a valid mobile number (10 to 15 digits).');
    invalid = true;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { fieldError('email', 'Please enter a valid email address.'); invalid = true; }
  if (password.length < 8) { fieldError('password', 'Your password must be at least 8 characters.'); invalid = true; }
  if (confirm !== password) { fieldError('confirm_password', 'The two passwords do not match.'); invalid = true; }
  if (invalid) return;

  setBusy(submitBtn, true, 'Creating account…');

  try {
    const allowed = await rateLimit(
      // 'register_attempt' per rate_limit_events_action_ck.
      'register_attempt', email, RATE_LIMITS.register.limit, RATE_LIMITS.register.windowSeconds
    );
    if (allowed !== true) {
      alertBox(alert, 'Too many signup attempts from this address. Please try again later.', 'error');
      return;
    }

    const { data, error } = await sb.auth.signUp({
      email: email,
      password: password,
      options: {
        // Prefills applicant_profiles via handle_new_auth_user().
        data: { full_name: fullName, mobile: mobile }
      }
    });
    if (error) {
      // Someone who already registered is sent to verification, not to a
      // "this email is taken" dead end.
      if (/already registered|already been registered/i.test(error.message || '')) {
        pendingEmail = email;
        showStep(2);
        startResendCooldown();
        alertBox(alert, 'That email address is already registered. Enter the verification code we sent you, or reset your password.', 'info');
        return;
      }
      throw error;
    }

    // Supabase may return no session when email confirmation is required.
    pendingEmail = email;
    showStep(2);
    startResendCooldown();

    if (data.session && data.user && data.user.email_confirmed_at) {
      // Confirmation is disabled in this project — nothing to verify.
      pendingEmail = '';
      showStep(3);
      return;
    }

    alertBox(alert, 'We have sent a 6-digit code to ' + email + '. It is valid for 60 minutes.', 'success');
  } catch (err) {
    const friendly = toCareersError(err);
    alertBox(alert, friendly.message, 'error');
    if (friendly.field) fieldError(friendly.field, friendly.message);
  } finally {
    setBusy(submitBtn, false);
  }
}

/* ---------- step 2: verify ---------- */
async function onVerify(event) {
  event.preventDefault();
  clearAlert(alert);
  fieldError('otp', '');

  const code = $('#otp').value.trim();
  if (!/^[0-9]{6}$/.test(code)) {
    fieldError('otp', 'Please enter the 6-digit code from your email.');
    return;
  }

  setBusy(otpSubmitBtn, true, 'Verifying…');

  try {
    const { error } = await sb.auth.verifyOtp({
      email: pendingEmail,
      token: code,
      type: 'email'
    });
    if (error) throw error;

    alertBox(alert, 'Email verified. Please complete your profile to finish.', 'success');
    await loadProfile();
    showStep(3);
  } catch (err) {
    const friendly = toCareersError(err);
    fieldError('otp', friendly.message);
  } finally {
    setBusy(otpSubmitBtn, false);
  }
}

async function onResend() {
  clearAlert(alert);
  if (!pendingEmail) {
    alertBox(alert, 'Please enter your email address on the first step.', 'error');
    showStep(1);
    return;
  }

  setBusy(resendBtn, true, 'Sending…');
  try {
    const allowed = await rateLimit(
      'otp_resend', pendingEmail, RATE_LIMITS.otpResend.limit, RATE_LIMITS.otpResend.windowSeconds
    );
    if (!allowed) {
      alertBox(alert, 'You have requested several codes already. Please wait before requesting another.', 'error');
      return;
    }

    const { error } = await sb.auth.resend({ type: 'signup', email: pendingEmail });
    if (error) throw error;

    alertBox(alert, 'A new code has been sent to ' + pendingEmail + '.', 'success');
    startResendCooldown();
  } catch (err) {
    const friendly = toCareersError(err);
    // Never reveal whether an address is registered.
    if (/not found|not registered/i.test(friendly.message)) {
      alertBox(alert, 'If that address has an account, a new code is on its way.', 'info');
      return;
    }
    alertBox(alert, friendly.message, 'error');
  } finally {
    setBusy(resendBtn, false);
  }
}

function startResendCooldown() {
  if (cooldownTimer) clearInterval(cooldownTimer);
  let left = OTP_RESEND_COOLDOWN_SECONDS;
  resendBtn.disabled = true;
  paintCooldown(left);

  cooldownTimer = setInterval(function () {
    left -= 1;
    if (left <= 0) {
      clearInterval(cooldownTimer);
      cooldownTimer = null;
      resendBtn.disabled = false;
      resendNote.textContent = 'If the code does not arrive, check your spam folder or resend it.';
      return;
    }
    paintCooldown(left);
  }, 1000);

  function paintCooldown(n) {
    resendNote.textContent = 'You can request another code in ' + n + ' second' + (n === 1 ? '' : 's') + '.';
  }
}

/* ---------- step 3: profile ---------- */
async function loadProfile() {
  const { data, error } = await sb.rpc('get_my_profile');
  if (error) return;
  if (!data) return;

  $('#profile_full_name').value = data.full_name || '';
  if (data.mobile) $('#mobile').value = data.mobile;

  const type = data.experience_type || 'fresher';
  const radio = $('input[name="experience_type"][value="' + type + '"]');
  if (radio) radio.checked = true;

  if (type === 'experienced' && data.experience_years != null) {
    $('#experience_years').value = data.experience_years;
  }
  $('#current_employer').value = data.current_employer || '';

  onExperienceTypeChange();
}

async function onSaveProfile(event) {
  event.preventDefault();
  clearAlert(alert);
  ['profile_full_name', 'experience_years'].forEach(function (id) { fieldError(id, ''); });

  const fullName = $('#profile_full_name').value.trim();
  const mobile = $('#mobile').value.trim();
  const experienceType = ($('input[name="experience_type"]:checked') || {}).value || 'fresher';
  const yearsRaw = $('#experience_years').value.trim();
  const employer = $('#current_employer').value.trim();

  let invalid = false;
  if (fullName.length < 2) { fieldError('profile_full_name', 'Please enter your full name.'); invalid = true; }

  let years = null;
  if (experienceType === 'experienced') {
    years = Number(yearsRaw);
    if (!yearsRaw || isNaN(years) || years <= 0 || years > 60) {
      fieldError('experience_years', 'Please enter your years of experience (between 0 and 60).');
      invalid = true;
    }
  }
  if (invalid) return;

  setBusy(profileSubmitBtn, true, 'Saving…');

  try {
    const { data, error } = await sb.rpc('upsert_my_profile', {
      p_full_name: fullName,
      p_mobile: mobile,
      p_experience_type: experienceType,
      p_experience_years: years,
      p_current_employer: employer || null
    });
    if (error) throw error;

    alertBox(alert, 'Profile saved. Redirecting…', 'success');
    finish();
  } catch (err) {
    const friendly = toCareersError(err);
    // The RPC raises 'VALIDATION_FAILED: <field>' — map that back to the input
    // so the applicant sees which box needs attention, not just a banner.
    // experience_type is omitted: both radio values are valid, so the RPC
    // cannot reject it.
    const fieldMatch = /VALIDATION_FAILED:\s*([a-z_]+)/i.exec(err.message || '');
    if (fieldMatch) {
      const map = {
        full_name: 'profile_full_name',
        experience_years: 'experience_years',
        mobile: 'mobile'
      };
      const id = map[fieldMatch[1]];
      if (id === 'mobile') {
        fieldError('mobile', 'Please enter a valid mobile number.');
      } else if (id) {
        fieldError(id, 'Please check this field.');
      }
    }
    alertBox(alert, friendly.message, 'error');
  } finally {
    setBusy(profileSubmitBtn, false);
  }
}

function onExperienceTypeChange() {
  const experienced = ($('input[name="experience_type"]:checked') || {}).value === 'experienced';
  yearsRow.hidden = !experienced;
  $('#experience_years').required = experienced;
}

/* ---------- shared ---------- */
function showStep(n) {
  registerForm.hidden = n !== 1;
  otpForm.hidden = n !== 2;
  profileForm.hidden = n !== 3;
  signinSwitch.hidden = n !== 3;

  $$('.stepper-step', stepper).forEach(function (el) {
    const s = Number(el.getAttribute('data-step'));
    el.classList.toggle('is-active', s === n);
    el.classList.toggle('is-done', s < n);
  });

  otpTarget.textContent = pendingEmail ? pendingEmail : '';
  if (n === 1) $('#full_name').focus();
  if (n === 2) focusOtp();
  if (n === 3) $('#profile_full_name').focus();
}

function focusOtp() { $('#otp').focus(); }

function finish() {
  const next = nextTarget();
  window.location.href = next || (rootPrefix() ? rootPrefix() + 'career/dashboard.html' : 'dashboard.html');
}