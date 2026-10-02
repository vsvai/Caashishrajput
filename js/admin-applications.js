// js/admin-applications.js — filterable, paginated application review.
//
// CVs are opened through a short-lived signed URL minted by
// admin_get_application_signed_url(), never by guessing a path. Admin notes are
// internal; the note written to the history row is the only thing the applicant
// ever sees in their timeline.

import {
  initAdminPage, sb, PAGE_SIZE, cvSignedUrl, $, $$, alertBox, clearAlert, setBusy,
  toCareersError, fmtDate, fmtDateTime, initials, debounce
} from './admin-core.js';

const dialog = $('#app-dialog');
const STATUSES = ['submitted', 'under_review', 'shortlisted', 'interview', 'selected', 'rejected', 'withdrawn'];

const filters = {
  q: '', vacancy_id: null, status: '', experience_type: null,
  date_from: null, date_to: null
};

let offset = 0;
let total = 0;
let current = null;      // the application open in the dialog
let currentCvPath = null;

initAdminPage('applications').then(function (user) {
  if (!user) return;
  wire();
  seedQuery();
  loadVacancyOptions();
  load();
});

function wire() {
  $('#filter-search').addEventListener('input', debounce(function (e) {
    filters.q = e.target.value.trim();
    offset = 0;
    load();
  }, 300));

  $('#filter-vacancy').addEventListener('change', function (e) {
    filters.vacancy_id = e.target.value || null;
    offset = 0;
    load();
  });

  $('#filter-status').addEventListener('change', function (e) {
    filters.status = e.target.value;
    offset = 0;
    load();
  });

  $('#filter-from').addEventListener('change', function (e) {
    filters.date_from = e.target.value || null;
    offset = 0;
    load();
  });

  $('#filter-to').addEventListener('change', function (e) {
    filters.date_to = e.target.value || null;
    offset = 0;
    load();
  });

  $('#reset-btn').addEventListener('click', function () {
    filters.q = ''; filters.vacancy_id = null; filters.status = '';
    filters.date_from = null; filters.date_to = null;
    offset = 0;
    $('#filter-search').value = '';
    $('#filter-status').value = '';
    $('#filter-vacancy').value = '';
    $('#filter-from').value = '';
    $('#filter-to').value = '';
    load();
  });

  $('#prev-btn').addEventListener('click', function () {
    offset = Math.max(0, offset - PAGE_SIZE);
    load();
  });

  $('#next-btn').addEventListener('click', function () {
    offset += PAGE_SIZE;
    load();
  });

  $('#list-body').addEventListener('click', function (e) {
    const button = e.target.closest('button[data-action="open"]');
    if (button) openDialog(button.getAttribute('data-id'));
  });

  $('#app-close').addEventListener('click', function () { dialog.close(); });
  $('#app-cancel').addEventListener('click', function () { dialog.close(); });
  $('#app-save').addEventListener('click', onSave);
  $('#app-delete').addEventListener('click', onDelete);
  $('#app-body').addEventListener('click', function (e) {
    if (e.target.closest('#cv-btn')) downloadCv();
  });

  dialog.addEventListener('close', function () { current = null; currentCvPath = null; });
}

function seedQuery() {
  // Supports the deep link from the overview page.
  const q = new URLSearchParams(window.location.search).get('q');
  if (q) { filters.q = q; $('#filter-search').value = q; }
}

async function loadVacancyOptions() {
  try {
    const { data, error } = await sb.rpc('admin_vacancy_options').single();
    if (error) throw error;
    const select = $('#filter-vacancy');
    (data || []).forEach(function (v) {
      const option = document.createElement('option');
      option.value = v.id;
      option.textContent = v.title;
      select.appendChild(option);
    });
  } catch (err) {
    alertBox($('#alert'), toCareersError(err).message, 'error');
  }
}

async function load() {
  const body = $('#list-body');
  clearAlert($('#alert'));

  try {
    const { data, error } = await sb.rpc('admin_list_applications', {
      p_search: filters.q || null,
      p_vacancy_id: filters.vacancy_id,
      p_status: filters.status || null,
      p_experience_type: filters.experience_type,
      p_date_from: filters.date_from,
      p_date_to: filters.date_to,
      p_sort: 'applied_at',
      p_dir: 'desc',
      p_limit: PAGE_SIZE,
      p_offset: offset
    }).single();
    if (error) throw error;

    total = (data && data.total) || 0;
    render(data.rows || []);
    renderPager();
  } catch (err) {
    body.innerHTML = '';
    alertBox($('#alert'), toCareersError(err).message, 'error');
  }
}

function render(rows) {
  const body = $('#list-body');

  if (!rows.length) {
    body.innerHTML = '<p class="muted">No applications match these filters.</p>';
    return;
  }

  body.innerHTML =
    '<table class="data-table">' +
      '<thead><tr>' +
        '<th scope="col">Applicant</th>' +
        '<th scope="col">Vacancy</th>' +
        '<th scope="col">Experience</th>' +
        '<th scope="col">Status</th>' +
        '<th scope="col">Applied</th>' +
        '<th scope="col"><span class="sr-only">Actions</span></th>' +
      '</tr></thead><tbody>' +
      rows.map(function (r) {
        return '<tr>' +
          '<td><span class="who">' +
            '<span class="who-avatar" aria-hidden="true">' + initials(r.full_name) + '</span>' +
            '<span class="who-text"><span class="who-name">' + esc(r.full_name) + '</span>' +
            '<span class="who-sub">' + esc(r.email) + '</span></span></span></td>' +
          '<td>' + esc(r.vacancy_title) + '</td>' +
          '<td class="nowrap">' + esc(String(r.experience_type || '').replace(/_/g, ' ')) +
            (r.experience_years == null ? '' : ' · ' + esc(String(r.experience_years))) + '</td>' +
          '<td><span class="badge badge-' + esc(r.status) + '">' + esc(r.status.replace(/_/g, ' ')) + '</span></td>' +
          '<td class="nowrap">' + fmtDate(r.applied_at) + '</td>' +
          '<td class="nowrap"><button type="button" class="btn btn-ghost btn-sm" data-action="open" data-id="' +
            esc(r.id) + '">Review</button></td>' +
        '</tr>';
      }).join('') +
      '</tbody></table>';
}

function renderPager() {
  const pager = $('#pager');
  const from = total === 0 ? 0 : offset + 1;
  const to = Math.min(offset + PAGE_SIZE, total);

  pager.hidden = total === 0;
  $('#pager-text').textContent = from + '–' + to + ' of ' + total;
  $('#prev-btn').disabled = offset === 0;
  $('#next-btn').disabled = to >= total;
}

async function openDialog(id) {
  const body = $('#app-body');
  body.innerHTML = '<p class="muted">Loading…</p>';
  dialog.showModal();

  try {
    const { data, error } = await sb.rpc('admin_get_application', { p_id: id }).single();
    if (error) throw error;
    current = data;
    currentCvPath = data.cv_path;
    renderDetail(data);
  } catch (err) {
    body.innerHTML = '';
    body.appendChild(errorNode(toCareersError(err).message));
    dialog.close();
  }
}

function renderDetail(app) {
  const v = app.vacancy || {};

  $('#app-title').textContent = app.full_name + ' — ' + (v.title || 'Vacancy');

  const history = (app.history || []).map(function (h) {
    const changed = h.old_status === h.new_status ? 'Note added' :
      String(h.old_status).replace(/_/g, ' ') + ' → ' + String(h.new_status).replace(/_/g, ' ');
    return '<li class="timeline-item">' +
      '<p class="timeline-title">' + esc(changed) + '</p>' +
      '<p class="timeline-meta">' + fmtDateTime(h.changed_at) + '</p>' +
      (h.note ? '<p class="timeline-body">' + esc(h.note) + '</p>' : '') +
    '</li>';
  }).join('');

  $('#app-body').innerHTML =
    '<dl class="detail-grid">' +
      row('Email', app.email) +
      row('Mobile', app.mobile) +
      row('Current employer', app.current_employer) +
      row('Experience', String(app.experience_type || '').replace(/_/g, ' ') +
        (app.experience_years == null ? '' : ' · ' + app.experience_years)) +
      row('Vacancy', v.title) +
      row('Applied', app.applied_at_ist || fmtDateTime(app.applied_at)) +
      row('Last update', app.updated_at_ist || fmtDateTime(app.updated_at)) +
    '</dl>' +

    '<div class="detail-block">' +
      '<h3>Cover letter</h3>' +
      '<p class="detail-prose">' + (app.cover_letter ? esc(app.cover_letter) : '<em>Not provided</em>') + '</p>' +
    '</div>' +

    '<div class="detail-block">' +
      '<h3>Curriculum vitae</h3>' +
      '<p class="who-sub">' + esc(app.cv_file_name || '—') + '</p>' +
      '<button type="button" class="btn btn-ghost" id="cv-btn">Open CV</button>' +
      '<p class="field-hint">Opens with a short-lived signed link. Never share it.</p>' +
    '</div>' +

    '<div class="detail-block">' +
      '<div class="form-group">' +
        '<label for="d-status">Status</label>' +
        '<select id="d-status">' +
          STATUSES.map(function (s) {
            return '<option value="' + s + '"' + (s === app.status ? ' selected' : '') + '>' +
              s.replace(/_/g, ' ') + '</option>';
          }).join('') +
        '</select>' +
      '</div>' +

      '<div class="form-group">' +
        '<label for="d-visible">Note visible to applicant</label>' +
        '<textarea id="d-visible" rows="2" maxlength="2000" ' +
          'placeholder="Shown in their timeline alongside the status change"></textarea>' +
        '<p class="field-hint">Leave blank if the change needs no explanation.</p>' +
      '</div>' +

      '<div class="form-group">' +
        '<label for="d-notes">Internal notes</label>' +
        '<textarea id="d-notes" rows="4" maxlength="8000">' + esc(app.admin_notes || '') + '</textarea>' +
        '<p class="field-hint">Never shown to the applicant. Stored with the application.</p>' +
      '</div>' +
    '</div>' +

    '<div class="detail-block">' +
      '<h3>History</h3>' +
      (history ? '<ul class="timeline">' + history + '</ul>' : '<p class="muted">No history yet.</p>') +
    '</div>';
}

function row(label, value) {
  return '<div class="detail-item"><dt>' + esc(label) + '</dt><dd>' +
    (value ? esc(String(value)) : '—') + '</dd></div>';
}

// No RPC is needed: the "applicants read own cv or admins read any cv" storage
// policy already lets an admin call createSignedUrl directly. The admin role is
// re-checked server-side inside that policy, so this cannot be bypassed.
async function downloadCv() {
  const button = $('#cv-btn');
  clearAlert($('#alert'));

  if (!currentCvPath) {
    alertBox($('#alert'), 'This application has no CV attached.', 'error');
    return;
  }

  setBusy(button, true, 'Opening…');
  try {
    const url = await cvSignedUrl(currentCvPath, 120);
    window.open(url, '_blank', 'noopener');
  } catch (err) {
    alertBox($('#alert'), toCareersError(err).message, 'error');
  } finally {
    setBusy(button, false);
  }
}

async function onSave() {
  if (!current) return;
  const button = $('#app-save');
  setBusy(button, true, 'Saving…');
  clearAlert($('#alert'));

  try {
    const { error } = await sb.rpc('admin_update_application', {
      p_application_id: current.id,
      p_status: $('#d-status').value,
      p_admin_notes: $('#d-notes').value,
      p_visible_note: $('#d-visible').value,
      p_clear_note: false
    });
    if (error) throw error;

    $('#d-visible').value = '';
    await load();
    await openDialog(current.id);
  } catch (err) {
    alertBox($('#alert'), toCareersError(err).message, 'error');
  } finally {
    setBusy(button, false);
  }
}

async function onDelete() {
  if (!current) return;
  const name = current.full_name;
  if (!window.confirm('Delete the application from ' + name + '? The stored CV is removed too. This cannot be undone.')) return;

  const button = $('#app-delete');
  setBusy(button, true, 'Deleting…');
  try {
    const { error } = await sb.rpc('admin_delete_application', { p_application_id: current.id });
    if (error) throw error;
    dialog.close();
    await load();
  } catch (err) {
    alertBox($('#alert'), toCareersError(err).message, 'error');
  } finally {
    setBusy(button, false);
  }
}

function errorNode(message) {
  const p = document.createElement('p');
  p.className = 'form-alert';
  p.textContent = message;
  return p;
}

function esc(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}