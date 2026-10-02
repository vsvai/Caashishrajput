// js/career-index.js — renders the vacancy list on /career.
//
// Vacancies come from public_list_vacancies(), which only ever returns rows the
// database considers public. Opening and closing state is computed server-side,
// so the Apply button here is a convenience — submit_application() re-checks
// everything regardless of what this page shows.

import {
  sb, fetchVacancies, applyState, esc, fmtDate, isConfigured, requireConfigured,
  currentUser, alertBox
} from './careers-core.js';

const listEl = document.getElementById('vacancy-list');
const closedEl = document.getElementById('closed-list');

function tagFor(vacancy) {
  if (vacancy.status === 'closed') return '<span class="tag tag-closed">Applications Closed</span>';
  if (vacancy.is_open) return '<span class="tag tag-open">Accepting Applications</span>';
  const opensOn = fmtDate(vacancy.opening_date);
  return '<span class="tag tag-soon">Opens ' + esc(opensOn) + '</span>';
}

function metaFor(vacancy) {
  const parts = [];
  if (vacancy.location) {
    parts.push('<span><svg class="icon-svg" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>' + esc(vacancy.location) + '</span>');
  }
  if (vacancy.employment_type) {
    parts.push('<span><svg class="icon-svg" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v18"/></svg>' + esc(vacancy.employment_type) + '</span>');
  }
  if (vacancy.experience_requirement) {
    parts.push('<span><svg class="icon-svg" viewBox="0 0 24 24"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>' + esc(vacancy.experience_requirement) + '</span>');
  }
  if (vacancy.stipend_or_salary) {
    parts.push('<span><svg class="icon-svg" viewBox="0 0 24 24"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>' + esc(vacancy.stipend_or_salary) + '</span>');
  }
  return '<div class="vacancy-meta">' + parts.join('') + '</div>';
}

function cardHtml(vacancy) {
  const state = applyState(vacancy);
  const closed = !vacancy.is_open;
  const closesOn = fmtDate(vacancy.closing_date);

  let note = '';
  if (vacancy.status === 'closed') {
    note = '<div class="vacancy-note">Applications for this position are now closed.</div>';
  } else if (!vacancy.is_open) {
    note = '<div class="vacancy-note">Applications closed on ' + esc(closesOn) + '.</div>';
  }

  let actions = '<a href="' + esc(vacancy.slug) + '.html" class="btn btn-ghost btn-sm">View Details</a>';
  if (state.canApply) {
    actions += '<a href="apply.html?slug=' + encodeURIComponent(vacancy.slug) + '" class="btn btn-primary btn-sm">' + esc(state.label) + '</a>';
  } else {
    actions += '<button type="button" class="btn btn-ghost btn-sm" disabled aria-disabled="true">' + esc(state.label) + '</button>';
  }

  return '' +
    '<article class="vacancy-card' + (closed ? ' is-closed' : '') + '">' +
      '<div>' +
        '<h3><a href="' + esc(vacancy.slug) + '.html">' + esc(vacancy.title) + '</a></h3>' +
        metaFor(vacancy) +
        note +
        (state.canApply ? '' : '<div class="text-small muted" style="margin-top:.35rem;">Closing date: ' + esc(closesOn) + ' (IST)</div>') +
      '</div>' +
      '<div class="vacancy-actions">' + tagFor(vacancy) + actions + '</div>' +
    '</article>';
}

function render(target, vacancies, emptyHtml) {
  if (!target) return;
  if (!vacancies.length) {
    target.innerHTML = emptyHtml;
    return;
  }
  target.innerHTML = vacancies.map(cardHtml).join('');
}

const EMPTY_OPEN = '' +
  '<div class="empty-state">' +
    '<h3>No open positions at the moment</h3>' +
    '<p>All current vacancies have closed. Please check back, or email ' +
    '<a href="mailto:ca.ashishrajput@outlook.com">ca.ashishrajput@outlook.com</a> with your CV and we will keep it on file.' +
    '</p>' +
  '</div>';

const EMPTY_CLOSED = '<p class="muted text-small">No positions have closed recently.</p>';

async function init() {
  if (!requireConfigured(listEl)) return;

  try {
    const vacancies = await fetchVacancies();

    // Split into currently accepting and everything else (§3, §29).
    const open = vacancies.filter(function (v) { return v.is_open; });
    const upcoming = vacancies.filter(function (v) { return !v.is_open && v.status === 'published'; });
    const closed = vacancies.filter(function (v) { return v.status === 'closed'; });

    render(listEl, open.concat(upcoming), EMPTY_OPEN);
    render(closedEl, closed.slice(0, 12), EMPTY_CLOSED);

    // Hide the closed section entirely when there is nothing to show.
    const closedSection = document.getElementById('closed-vacancies');
    if (closedSection && !closed.length) closedSection.hidden = true;

    // Signed-in applicants get a shortcut back to their dashboard.
    const user = await currentUser();
    if (user) {
      const note = document.createElement('p');
      note.className = 'text-small';
      note.style.marginTop = '1.25rem';
      note.innerHTML = 'Signed in as <strong>' + esc(user.email) + '</strong> &mdash; ' +
        '<a href="dashboard.html">go to your application dashboard</a>.';
      listEl.parentNode.appendChild(note);
    }
  } catch (err) {
    console.error('[careers] index load failed', err);
    listEl.innerHTML = '';
    alertBox(listEl, 'We could not load the list of vacancies just now. Please refresh the page, or call ' +
      '+91 88025 86988.', 'error');
  }
}

init();