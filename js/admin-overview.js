// js/admin-overview.js — admin landing page: counts + the latest applications.

import {
  initAdminPage, sb, $, alertBox, clearAlert, toCareersError, fmtDate, initials
} from './admin-core.js';

initAdminPage('overview').then(function (user) {
  if (!user) return;
  load();
});

async function load() {
  const alert = $('#alert');
  const body = $('#recent-body');
  clearAlert(alert);

  try {
    const [vacancies, applications] = await Promise.all([
      sb.rpc('admin_list_vacancies').single(),
      sb.rpc('admin_list_applications', {
        p_sort: 'applied_at',
        p_dir: 'desc',
        p_limit: 5,
        p_offset: 0
      }).single()
    ]);

    if (vacancies.error) throw vacancies.error;
    if (applications.error) throw applications.error;

    const rows = vacancies.data || [];
    $('#stat-published').textContent = rows.filter(function (v) { return v.status === 'published'; }).length;
    $('#stat-draft').textContent     = rows.filter(function (v) { return v.status === 'draft'; }).length;
    $('#stat-closed').textContent    = rows.filter(function (v) { return v.status === 'closed' || v.status === 'archived'; }).length;

    const total = (applications.data && applications.data.total) || 0;
    $('#stat-apps').textContent = total;

    renderRecent((applications.data && applications.data.rows) || []);
  } catch (err) {
    body.innerHTML = '';
    alertBox(alert, toCareersError(err).message, 'error');
  }
}

function renderRecent(rows) {
  const body = $('#recent-body');

  if (!rows.length) {
    body.innerHTML = '<p class="muted">No applications yet.</p>';
    return;
  }

  body.innerHTML =
    '<table class="data-table">' +
      '<caption class="sr-only">Five most recent applications</caption>' +
      '<thead><tr>' +
        '<th scope="col">Applicant</th>' +
        '<th scope="col">Vacancy</th>' +
        '<th scope="col">Status</th>' +
        '<th scope="col">Applied</th>' +
        '<th scope="col"><span class="sr-only">Actions</span></th>' +
      '</tr></thead><tbody>' +
      rows.map(function (r) {
        return '<tr>' +
          '<td><span class="who"><span class="who-avatar" aria-hidden="true">' + initials(r.full_name) + '</span>' +
            '<span class="who-text"><span class="who-name">' + esc(r.full_name) + '</span>' +
            '<span class="who-sub">' + esc(r.email) + '</span></span></span></td>' +
          '<td>' + esc(r.vacancy_title) + '</td>' +
          '<td><span class="badge badge-' + esc(r.status) + '">' + esc(r.status.replace(/_/g, ' ')) + '</span></td>' +
          '<td class="nowrap">' + fmtDate(r.applied_at) + '</td>' +
          '<td class="nowrap"><a class="btn btn-ghost btn-sm" href="applications.html?q=' +
            encodeURIComponent(r.email) + '">Open</a></td>' +
        '</tr>';
      }).join('') +
      '</tbody></table>';
}

function esc(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}