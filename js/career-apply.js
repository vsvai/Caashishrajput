// js/career-apply.js — application submission (§9-§13).
//
// Two-phase, because Postgres cannot accept a file upload inside a transaction
// alongside the application row:
//   1. begin_cv_upload()  -> the database mints the application id and the exact
//                            storage path, and re-checks that the vacancy is open
//                            and that this user has not already applied
//   2. storage upload     -> to that exact path
//   3. submit_application()-> re-verifies the vacancy window, ownership of the
//                            object, its real size and MIME, then writes the row
//
// Every check in step 1 and step 3 is repeated server-side. Nothing here is
// trusted; the browser only exists to give immediate feedback.

import {
  sb, BUCKET, CV_ACCEPT, CV_MAX_BYTES, CV_EXTENSIONS,
  $, esc, alertBox, clearAlert, fieldError, setBusy, requireConfigured,
  requireUser, fetchVacancyBySlug, applyState, validateCvFile,
  cvSignedUrl, fmtDate, toCareersError
} from './careers-core.js';

const state = $('#state');
const alert = $('#alert');
const form = $('#apply-form');
const success = $('#success');
const submitBtn = $('#submit-btn');

const cvInput = $('#cv');
const cvDrop = $('#cv-drop');
const cvChip = $('#cv-chip');
const cvName = $('#cv-name');
const cvSize = $('#cv-size');
const cvRemove = $('#cv-remove');
const cvProgress = $('#cv-progress');
const cvProgressBar = $('#cv-progress-bar');

let vacancy = null;
let selectedFile = null;

cvInput.setAttribute('accept', CV_ACCEPT);

const slug = new URLSearchParams(window.location.search).get('slug') || '';

if (!requireConfigured()) {
  state.hidden = true;
} else if (!slug) {
  showFatal('No position selected', 'Please choose a position from the careers page and try again.');
} else {
  init();
}

async function init() {
  try {
    // Fetch the vacancy first so an unknown/closed slug never shows a form.
    vacancy = await fetchVacancyBySlug(slug);
    if (!vacancy) {
      showFatal('Position not available', 'That position no longer exists. Please browse the current vacancies.');
      return;
    }

    document.title = 'Apply — ' + vacancy.title + ' | CA Ashish Rajput';
    $('#apply-title').textContent = 'Apply — ' + vacancy.title;
    $('#apply-subtitle').textContent = vacancy.location + ' · ' + vacancy.employment_type;

    renderSummary();

    const openness = applyState(vacancy);
    if (!openness.canApply) {
      // Still allow a signed-in user to see their existing application instead
      // of a dead end.
      state.hidden = true;
      renderClosed(openness.label);
      return;
    }

    // §7 + §9: must be signed in and verified before we accept a CV.
    const user = await requireUser({ requireVerified: true });
    if (!user) return;

    state.hidden = true;
    form.hidden = false;
    await fillProfile(user);
  } catch (err) {
    const friendly = toCareersError(err);
    showFatal('We could not load this position', friendly.message);
  }
}

function renderSummary() {
  const rows = [
    ['Location', vacancy.location],
    ['Employment type', vacancy.employment_type],
    ['Experience', vacancy.experience_requirement],
    ['Applications close', vacancy.closing_date ? fmtDate(vacancy.closing_date) : '']
  ].filter(function (r) { return r[1]; });

  $('#apply-summary').innerHTML =
    '<h2 class="form-section-title">' + esc(vacancy.title) + '</h2>' +
    '<dl class="definition-list">' +
    rows.map(function (r) {
      return '<div><dt>' + esc(r[0]) + '</dt><dd>' + esc(r[1]) + '</dd></div>';
    }).join('') +
    '</dl>';
}

function renderClosed(label) {
  const box = document.createElement('div');
  box.className = 'empty-state';
  box.innerHTML =
    '<h2 class="form-section-title">' + esc(label) + '</h2>' +
    '<p>Applications for this position are not being accepted right now.</p>' +
    '<div class="form-actions">' +
    '<a href="index.html" class="btn btn-primary">See open positions</a>' +
    '<a href="dashboard.html" class="btn btn-ghost">My applications</a>' +
    '</div>';
  $('#state').parentNode.insertBefore(box, form);
  form.hidden = true;
}

async function fillProfile(user) {
  try {
    const { data, error } = await sb.rpc('get_my_profile');
    if (error) return;
    if (data) {
      $('#full_name').value = data.full_name || '';
      $('#mobile').value = data.mobile || '';
    }
  } catch (e) {
    // Non-fatal: the candidate can still fill the fields in.
  }
  $('#email').value = user.email || '';
}

/* ---------- CV selection ---------- */
cvDrop.addEventListener('click', function () { cvInput.click(); });

cvInput.addEventListener('change', function () {
  if (cvInput.files && cvInput.files[0]) setFile(cvInput.files[0]);
});

cvRemove.addEventListener('click', function () {
  setFile(null);
});

// Drag and drop, progressive enhancement only.
['dragenter', 'dragover'].forEach(function (type) {
  cvDrop.addEventListener(type, function (e) {
    e.preventDefault();
    cvDrop.classList.add('is-dragover');
  });
});
['dragleave', 'drop'].forEach(function (type) {
  cvDrop.addEventListener(type, function (e) {
    e.preventDefault();
    cvDrop.classList.remove('is-dragover');
  });
});
cvDrop.addEventListener('drop', function (e) {
  const files = e.dataTransfer && e.dataTransfer.files;
  if (files && files[0]) setFile(files[0]);
});

function setFile(file) {
  selectedFile = null;
  fieldError('cv', '');

  if (!file) {
    cvChip.hidden = true;
    cvDrop.hidden = false;
    cvInput.value = '';
    return;
  }

  // §12 pre-check. The database repeats all of this against the real object.
  const check = validateCvFile(file);
  if (!check.ok) {
    cvDrop.hidden = false;
    cvChip.hidden = true;
    cvInput.value = '';
    fieldError('cv', check.message);
    return;
  }

  selectedFile = file;
  cvName.textContent = file.name;
  cvSize.textContent = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
  cvDrop.hidden = true;
  cvChip.hidden = false;
}

/* ---------- submit ---------- */
form.addEventListener('submit', onSubmit);

async function onSubmit(event) {
  event.preventDefault();
  clearAlert(alert);
  ['full_name', 'mobile', 'email', 'cv', 'cover_letter'].forEach(function (id) { fieldError(id, ''); });
  document.getElementById('consent-error').hidden = true;

  const fullName = $('#full_name').value.trim();
  const mobile = $('#mobile').value.trim();
  const email = $('#email').value.trim();
  const cover = $('#cover_letter').value.trim();
  const consent = $('#consent').checked;

  let invalid = false;
  if (fullName.length < 2) { fieldError('full_name', 'Please enter your full name.'); invalid = true; }
  if (!/^\+?[0-9]{10,15}$/.test(mobile)) { fieldError('mobile', 'Please enter a valid mobile number.'); invalid = true; }
  if (!email) { fieldError('email', 'Please enter your email address.'); invalid = true; }
  if (!selectedFile) { fieldError('cv', 'Please attach your CV (PDF, DOC or DOCX).'); invalid = true; }
  if (!consent) {
    const holder = document.getElementById('consent-error');
    holder.textContent = 'Please confirm before submitting.';
    holder.hidden = false;
    invalid = true;
  }
  if (invalid) return;

  setBusy(submitBtn, true, 'Submitting…');

  let applicationId = null;

  try {
    // ---- phase 1: ask the database for an id + path -------------------------
    const { data: ticket, error: beginError } = await sb.rpc('begin_cv_upload', {
      p_vacancy_id: vacancy.id,
      p_filename: selectedFile.name
    });
    if (beginError) throw beginError;

    applicationId = ticket.application_id;
    const path = ticket.path;

    // ---- phase 2: upload to the exact path the database dictated -----------
    setProgress(5);
    const { error: uploadError } = await sb.storage
      .from(BUCKET)
      .upload(path, selectedFile, {
        cacheControl: '3600',
        contentType: selectedFile.type || 'application/octet-stream',
        upsert: false
      });
    if (uploadError) {
      throw { code: 'CV_MISSING', message: 'We could not upload your CV. Please check your connection and try again.' };
    }
    setProgress(70);

    // ---- phase 3: commit the application row ------------------------------
    const { data: result, error: submitError } = await sb.rpc('submit_application', {
      p_application_id: applicationId,
      p_vacancy_id: vacancy.id,
      p_cv_path: path,
      p_cover_letter: cover || null
    });
    if (submitError) throw submitError;
    setProgress(100);

    const ref = (result && result.reference) || applicationId.slice(0, 8).toUpperCase();
    form.hidden = true;
    success.hidden = false;
    $('#success-ref').textContent = 'Your reference number is ' + ref + '.';
    success.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (err) {
    const friendly = toCareersError(err);

    // Duplicate applications are common and easy to fix: point at the dashboard.
    if (friendly.code === 'DUPLICATE_APPLICATION') {
      alertBox(alert, friendly.message, 'error');
      const link = document.createElement('a');
      link.href = 'dashboard.html';
      link.textContent = 'Go to my applications';
      alert.appendChild(document.createElement(' '));
      alert.appendChild(link);
      return;
    }

    if (friendly.code === 'AUTH_REQUIRED' || friendly.code === 'EMAIL_NOT_VERIFIED') {
      window.location.href = 'login.html?next=' + encodeURIComponent(window.location.pathname + window.location.search);
      return;
    }

    if (friendly.field) fieldError(friendly.field, '');
    if (friendly.code && friendly.code.indexOf('CV_') === 0) {
      setFile(null);
      fieldError('cv', friendly.message);
    }
    alertBox(alert, friendly.message, 'error');
    alert.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  } finally {
    setBusy(submitBtn, false);
    setProgress(0);
  }
}

function setProgress(pct) {
  if (!pct) { cvProgress.hidden = true; return; }
  cvProgress.hidden = false;
  cvProgressBar.style.width = pct + '%';
  cvProgressBar.setAttribute('aria-valuenow', String(pct));
}

function showFatal(heading, message) {
  state.hidden = true;
  form.hidden = true;
  const box = document.createElement('div');
  box.className = 'empty-state';
  box.innerHTML =
    '<h2 class="form-section-title">' + esc(heading) + '</h2>' +
    '<p>' + esc(message) + '</p>' +
    '<div class="form-actions"><a href="index.html" class="btn btn-primary">See open positions</a></div>';
  state.parentNode.insertBefore(box, state.nextSibling);
  state.remove();
}