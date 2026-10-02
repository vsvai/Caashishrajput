// js/career-dashboard.js — applicant dashboard (§15, §16).
//
// Read-only view of the signed-in applicant's own rows. list_my_applications()
// is a SECURITY DEFINER function filtered on auth.uid(), so a visitor cannot
// reach another applicant's CV path or reference number by editing the URL.
// Signed URLs are issued on demand and expire in two minutes (§14).

import {
  sb,
  $, $$, esc, alertBox, clearAlert, requireConfigured,
  requireUser, statusBadge, statusMeta, TIMELINE_STEPS,
  fmtDate, fmtDateTime, openCv, toCareersError
} from './careers-core.js';

const dashboard = $('#dashboard');
const list = $('#applications');
const empty = $('#empty');
const alert = $('#alert');

if (!requireConfigured()) {
  list.remove();
} else {
  init();
}

async function init() {
  let user;
  try {
    user = await requireUser({ requireVerified: true });
  } catch (err) {
    const friendly = toCareersError(err);
    list.innerHTML = '<div class="empty-state"><p>' + esc(friendly.message) + '</p></div>';
    return;
  }
  if (!user) return; // requireUser redirected

  $('#hero-email').textContent = user.email || '';

  $('#signout-btn').addEventListener('click', signOut);

  await Promise.all([renderProfile(), renderApplications()]);

  dashboard.hidden = false;
}

async function renderProfile() {
  try {
    const { data, error } = await sb.rpc('get_my_profile');
    if (error) return;

    if (!data) {
      $('#profile-box').innerHTML =
        '<p class="text-small muted">Your profile is not complete yet.</p>' +
        '<a href="register.html" class="btn btn-ghost btn-sm btn-block">Complete profile</a>';
      return;
    }

    const rows = [
      ['Name', data.full_name],
      ['Mobile', data.mobile],
      ['Experience', data.experience_type === 'fresher'
        ? 'Fresher'
        : 'Experienced (' + (data.experience_years || '?') + ' yrs)'],
      ['Current employer', data.current_employer]
    ].filter(function (r) { return r[1]; });

    $('#profile-box').innerHTML = '<dl class="profile-grid">' +
      rows.map(function (r) {
        return '<div><dt>' + esc(r[0]) + '</dt><dd>' + esc(r[1]) + '</dd></div>';
      }).join('') +
      '</dl>' +
      (data.is_complete ? '' : '<p class="form-hint">Adding your experience helps us review your application faster.</p>');
  } catch (e) {
    /* profile is optional context; do not block the page */
  }
}

async function renderApplications() {
  let rows = [];
  try {
    const { data, error } = await sb.rpc('list_my_applications');
    if (error) throw error;
    rows = data || [];
  } catch (err) {
    const friendly = toCareersError(err);
    list.innerHTML = '<div class="empty-state"><p>' + esc(friendly.message) + '</p></div>';
    return;
  }

  if (!rows.length) {
    list.remove();
    empty.hidden = false;
    return;
  }

  list.innerHTML = rows.map(renderCard).join('');
  bindCardActions(list);
}

function renderCard(app) {
  const meta = statusMeta(app.status);
  const step = meta.step || 1;

  return '' +
    '<article class="application-card" data-application-id="' + esc(app.id) + '">' +
      '<div class="application-head">' +
        '<div>' +
          '<h3><a href="' + esc(app.vacancy_slug) + '.html">' + esc(app.vacancy_title) + '</a></h3>' +
          '<p class="application-meta">' +
            '<span>' + esc(app.vacancy_location) + '</span>' +
            (app.vacancy_employment_type ? ' &middot; <span>' + esc(app.vacancy_employment_type) + '</span>' : '') +
          '</p>' +
        '</div>' +
        statusBadge(app.status) +
      '</div>' +

      '<dl class="application-facts">' +
        '<div><dt>Reference</dt><dd class="mono">' + esc(app.id.slice(0, 8).toUpperCase()) + '</dd></div>' +
        '<div><dt>Applied on</dt><dd>' + esc(fmtDate(app.applied_at)) + '</dd></div>' +
        '<div><dt>Last updated</dt><dd>' + esc(fmtDateTime(app.updated_at)) + '</dd></div>' +
        (app.vacancy_closing_date
          ? '<div><dt>Position closes</dt><dd>' + esc(fmtDate(app.vacancy_closing_date)) + '</dd></div>'
          : '') +
      '</dl>' +

      timelineHtml(app, step, meta.terminal) +

      (app.cover_letter
        ? '<details class="application-cover"><summary>Your cover note</summary><p>' + esc(app.cover_letter) + '</p></details>'
        : '') +

      '<div class="application-actions">' +
        (app.cv_path
          ? '<button type="button" class="btn btn-ghost btn-sm" data-action="cv" data-path="' + esc(app.cv_path) + '">View my CV</button>'
          : '') +
        (canWithdraw(app.status)
          ? '<button type="button" class="btn btn-danger btn-sm" data-action="withdraw" data-id="' + esc(app.id) + '">Withdraw application</button>'
          : '') +
        '<a class="btn btn-ghost btn-sm" href="' + esc(app.vacancy_slug) + '.html">View position</a>' +
      '</div>' +
    '</article>';
}

function timelineHtml(app, step, terminal) {
  const history = {};
  (app.status_history || []).forEach(function (h) { history[h.status] = h; });

  const steps = TIMELINE_STEPS.map(function (s, i) {
    // The practice stopped at some step. Mark everything up to and including it
    // as reached; selected is the one terminal state that is also a "success".
    const reached = i + 1 <= step;

    let cls = '';
    if (app.status === 'selected' && s.key === 'selected') cls = 'is-terminal-positive';
    else if (app.status === 'rejected' && s.key === 'selected') cls = 'is-terminal-negative';
    else if (reached && history[s.key] && history[s.key].is_current) cls = 'is-current';
    else if (reached) cls = 'is-done';

    const entry = history[s.key];

    // Selected/Not Selected are drawn as terminal states, not as a passed step.
    const label = (app.status === 'rejected' && s.key === 'selected') ? 'Not Selected' : s.label;

    return '<li class="' + cls + '">' +
      '<span class="step-label">' + esc(label) + '</span>' +
      (entry
        ? '<span class="step-meta">' + esc(fmtDateTime(entry.changed_at)) +
          (entry.note ? ' &middot; ' + esc(entry.note) : '') + '</span>'
        : '') +
      '</li>';
  }).join('');

  let extra = '';
  if (app.status === 'withdrawn') {
    const entry = history.withdrawn;
    extra = '<li class="is-terminal-negative">' +
      '<span class="step-label">Withdrawn</span>' +
      '<span class="step-meta">' +
        (entry ? esc(fmtDateTime(entry.changed_at)) : esc(fmtDateTime(app.updated_at))) +
      '</span></li>';
  }

  return '<ol class="timeline">' + steps + extra + '</ol>';
}

function canWithdraw(status) {
  // Once the practice has moved the application to a decision, withdrawing it
  // would only confuse the record.
  return ['submitted', 'under_review'].indexOf(status) !== -1;
}

function bindCardActions(scope) {
  $$('[data-action]', scope).forEach(function (btn) {
    btn.addEventListener('click', async function () {
      const action = btn.getAttribute('data-action');

      if (action === 'cv') {
        clearAlert(alert);
        btn.disabled = true;
        try {
          // Two minutes is enough to open and read a CV, short enough that a
          // leaked link is not useful later.
          await openCv(btn.getAttribute('data-path'), 120);
        } catch (err) {
          alertBox(alert, toCareersError(err).message, 'error');
        } finally {
          btn.disabled = false;
        }
        return;
      }

      if (action === 'withdraw') {
        const appId = btn.getAttribute('data-id');
        if (!window.confirm('Withdraw this application? This cannot be undone, and you would need to apply again if the position is still open.')) return;

        btn.disabled = true;
        clearAlert(alert);
        try {
          const { error } = await sb.rpc('withdraw_my_application', { p_application_id: appId });
          if (error) throw error;
          alertBox(alert, 'Your application has been withdrawn.', 'success');
          await renderApplications();
        } catch (err) {
          alertBox(alert, toCareersError(err).message, 'error');
          btn.disabled = false;
        }
      }
    });
  });
}

async function signOut() {
  const btn = $('#signout-btn');
  btn.disabled = true;
  try {
    await sb.auth.signOut();
    window.location.href = 'index.html';
  } catch (err) {
    alertBox(alert, toCareersError(err).message, 'error');
    btn.disabled = false;
  }
}