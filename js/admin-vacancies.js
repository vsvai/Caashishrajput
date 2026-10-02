// js/admin-vacancies.js — vacancy list, create/edit dialog, status and delete.
//
// All writes go through SECURITY DEFINER RPCs that re-check require_admin()
// server-side. Nothing here trusts the role check in JavaScript.

import {
  initAdminPage, sb, $, $$, alertBox, clearAlert, fieldError, setBusy,
  toCareersError, fmtDate, debounce
} from './admin-core.js';

const dialog = $('#vacancy-dialog');
const form = $('#vacancy-form');
const confirmDialog = $('#confirm-dialog');

let rows = [];
let search = '';
let statusFilter = '';
let pendingDelete = null;

initAdminPage('vacancies').then(function (user) {
  if (!user) return;
  wire();
  load();
});

function wire() {
  $('#new-btn').addEventListener('click', function () { openDialog(null); });

  $('#dialog-close').addEventListener('click', function () { dialog.close(); });
  $('#dialog-cancel').addEventListener('click', function () { dialog.close(); });

  $('#filter-search').addEventListener('input', debounce(function (e) {
    search = e.target.value.trim().toLowerCase();
    render();
  }, 200));

  $('#filter-status').addEventListener('change', function (e) {
    statusFilter = e.target.value;
    load();
  });

  // Title drives the slug for new vacancies only, so edits never silently
  // move an already-published page.
  $('#v-title').addEventListener('input', function () {
    if ($('#v-id').value) return;
    $('#v-slug').value = slugify($('#v-title').value);
  });

  form.addEventListener('submit', onSave);
  $('#confirm-cancel').addEventListener('click', function () { confirmDialog.close(); });
  $('#confirm-ok').addEventListener('click', onConfirmDelete);

  $('#list-body').addEventListener('click', onListClick);
}

async function load() {
  const body = $('#list-body');
  clearAlert($('#alert'));

  try {
    const { data, error } = await sb.rpc('admin_list_vacancies').single();
    if (error) throw error;
    rows = data || [];
    render();
  } catch (err) {
    body.innerHTML = '';
    alertBox($('#alert'), toCareersError(err).message, 'error');
  }
}

function render() {
  const body = $('#list-body');
  const visible = rows.filter(function (v) {
    if (statusFilter && v.status !== statusFilter) return false;
    if (!search) return true;
    return String(v.title).toLowerCase().indexOf(search) !== -1 ||
           String(v.slug).toLowerCase().indexOf(search) !== -1;
  });

  if (!visible.length) {
    body.innerHTML = rows.length
      ? '<p class="muted">No vacancies match these filters.</p>'
      : '<p class="muted">No vacancies yet. Use <strong>New vacancy</strong> to create one.</p>';
    return;
  }

  body.innerHTML =
    '<table class="data-table">' +
      '<thead><tr>' +
        '<th scope="col">Title</th>' +
        '<th scope="col">Status</th>' +
        '<th scope="col">Closes</th>' +
        '<th scope="col">Applications</th>' +
        '<th scope="col"><span class="sr-only">Actions</span></th>' +
      '</tr></thead><tbody>' +
      visible.map(function (v) {
        const id = esc(v.id);
        return '<tr>' +
          '<td><span class="who-text">' +
            '<span class="who-name">' + esc(v.title) + '</span>' +
            '<span class="who-sub">' + esc(v.slug) + '</span></span></td>' +
          '<td><span class="badge badge-' + esc(v.status) + '">' + esc(v.status) + '</span></td>' +
          '<td class="nowrap">' + fmtDate(v.closing_date) + '</td>' +
          '<td>' + (v.application_count == null ? '—' : Number(v.application_count)) + '</td>' +
          '<td class="row-actions nowrap">' +
            '<button type="button" class="btn btn-ghost btn-sm" data-action="edit" data-id="' + id + '">Edit</button>' +
            statusButton(v, id) +
            '<button type="button" class="btn btn-ghost btn-sm" data-action="delete" data-id="' + id + '">Delete</button>' +
          '</td>' +
        '</tr>';
      }).join('') +
      '</tbody></table>';
}

function statusButton(v, id) {
  const next = v.status === 'published' ? 'closed' : 'published';
  const label = v.status === 'published' ? 'Close' : 'Publish';
  return '<button type="button" class="btn btn-ghost btn-sm" data-action="status" data-id="' +
    id + '" data-status="' + next + '">' + label + '</button>';
}

function onListClick(event) {
  const button = event.target.closest('button[data-action]');
  if (!button) return;

  const id = button.getAttribute('data-id');
  const action = button.getAttribute('data-action');

  if (action === 'edit') {
    const row = rows.find(function (v) { return v.id === id; });
    if (row) openDialog(row);
    return;
  }

  if (action === 'status') {
    setStatus(id, button.getAttribute('data-status'), button);
    return;
  }

  if (action === 'delete') {
    const row = rows.find(function (v) { return v.id === id; });
    pendingDelete = id;
    $('#confirm-text').textContent = 'Delete "' + (row ? row.title : 'this vacancy') + '"?';
    confirmDialog.showModal();
  }
}

async function setStatus(id, status, button) {
  clearAlert($('#alert'));
  setBusy(button, true, '…');
  try {
    const { error } = await sb.rpc('admin_set_vacancy_status', { p_id: id, p_status: status });
    if (error) throw error;
    await load();
  } catch (err) {
    alertBox($('#alert'), toCareersError(err).message, 'error');
    setBusy(button, false);
  }
}

function openDialog(row) {
  $('#form-error').hidden = true;
  ['title', 'slug', 'location', 'employment-type', 'experience', 'salary',
   'description', 'responsibilities', 'skills', 'qualification', 'benefits',
   'opening', 'closing'].forEach(function (name) {
    fieldError('v-' + name, '');
  });

  if (row) {
    $('#dialog-title').textContent = 'Edit vacancy';
    $('#v-id').value = row.id;
    $('#v-title').value = row.title || '';
    $('#v-slug').value = row.slug || '';
    $('#v-location').value = row.location || '';
    $('#v-employment-type').value = row.employment_type || '';
    $('#v-experience').value = row.experience_requirement || '';
    $('#v-salary').value = row.stipend_or_salary || '';
    $('#v-description').value = row.description || '';
    $('#v-responsibilities').value = row.responsibilities || '';
    $('#v-skills').value = row.skills_required || '';
    $('#v-qualification').value = row.qualification || '';
    $('#v-benefits').value = row.benefits || '';
    $('#v-opening').value = dateOnly(row.opening_date);
    $('#v-closing').value = dateOnly(row.closing_date);
    $('#v-status').value = row.status || 'draft';
  } else {
    $('#dialog-title').textContent = 'New vacancy';
    $('#v-id').value = '';
    $('#v-status').value = 'draft';
    $('#v-location').value = 'Sahibabad, Ghaziabad';
    form.reset();
    $('#v-location').value = 'Sahibabad, Ghaziabad';
    // Default the window to something sensible so the common case is one click.
    $('#v-opening').value = dateOnly(new Date());
    $('#v-closing').value = dateOnly(new Date(Date.now() + 30 * 86400000));
  }

  dialog.showModal();
}

async function onSave(event) {
  event.preventDefault();
  clearAlert($('#alert'));
  const formError = $('#form-error');
  formError.hidden = true;

  const payload = {
    p_title: $('#v-title').value.trim(),
    p_slug: $('#v-slug').value.trim(),
    p_description: $('#v-description').value.trim(),
    p_location: $('#v-location').value.trim(),
    p_employment_type: $('#v-employment-type').value.trim(),
    p_experience_requirement: $('#v-experience').value.trim(),
    p_stipend_or_salary: $('#v-salary').value.trim(),
    p_responsibilities: $('#v-responsibilities').value.trim() || null,
    p_skills_required: $('#v-skills').value.trim() || null,
    p_qualification: $('#v-qualification').value.trim() || null,
    p_benefits: $('#v-benefits').value.trim() || null,
    p_opening_date: toIso($('#v-opening').value, false),
    p_closing_date: toIso($('#v-closing').value, true),
    p_status: $('#v-status').value
  };

  let invalid = false;
  if (payload.p_title.length < 3) { fieldError('v-title', 'Please enter a job title.'); invalid = true; }
  if (!payload.p_slug) { fieldError('v-slug', 'A URL slug is required.'); invalid = true; }
  if (!payload.p_description) { fieldError('v-description', 'A summary is required.'); invalid = true; }
  if (!payload.p_opening_date) { fieldError('v-opening', 'Choose an opening date.'); invalid = true; }
  if (!payload.p_closing_date) { fieldError('v-closing', 'Choose a closing date.'); invalid = true; }
  if (invalid) return;

  const saveBtn = $('#save-btn');
  setBusy(saveBtn, true, 'Saving…');

  try {
    const id = $('#v-id').value;
    const { error } = await sb.rpc('admin_upsert_vacancy', Object.assign(
      { p_id: id ? id : null },
      payload
    ));
    if (error) throw error;

    dialog.close();
    await load();
  } catch (err) {
    // The RPC reports slug collisions as VALIDATION_FAILED, which is far more
    // useful than a raw unique_violation.
    const friendly = toCareersError(err);
    formError.hidden = false;
    formError.textContent = friendly.message;
    if (/slug/i.test(friendly.message)) fieldError('v-slug', friendly.message);
  } finally {
    setBusy(saveBtn, false);
  }
}

async function onConfirmDelete() {
  if (!pendingDelete) return;
  const button = $('#confirm-ok');
  setBusy(button, true, 'Deleting…');
  try {
    const { error } = await sb.rpc('admin_delete_vacancy', { p_id: pendingDelete });
    if (error) throw error;
    confirmDialog.close();
    pendingDelete = null;
    await load();
  } catch (err) {
    confirmDialog.close();
    alertBox($('#alert'), toCareersError(err).message, 'error');
  } finally {
    setBusy(button, false);
  }
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 200);
}

// The database stores deadlines as timestamptz. A date input has no timezone,
// so a closing date is taken as the end of that day in IST — otherwise a
// vacancy would silently expire on the evening before its stated closing date.
function toIso(value, endOfDay) {
  if (!value) return null;
  const time = endOfDay ? 'T23:59:59+05:30' : 'T00:00:00+05:30';
  return value + time;
}

function dateOnly(value) {
  if (!value) return '';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '';
  // Render in IST so the admin sees the same day the deadline belongs to.
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(d);
}

function esc(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}