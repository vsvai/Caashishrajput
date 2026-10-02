// js/admin-core.js — shared admin shell: auth guard, nav, layout, helpers.
//
// Every admin page imports this. It resolves the admin user once, renders the
// shell, and exposes small utilities so the per-page modules stay readable.

import {
  sb, RATE_LIMITS,
  $, $$, alertBox, clearAlert, fieldError, setBusy,
  requireAdmin, toCareersError, rootPrefix, cvSignedUrl
} from './careers-core.js';

export const PAGE_SIZE = 25;

const NAV = [
  { href: 'index.html',      label: 'Overview',       key: 'overview'  },
  { href: 'vacancies.html',  label: 'Vacancies',      key: 'vacancies' },
  { href: 'applications.html', label: 'Applications', key: 'applications' }
];

export async function initAdminPage(activeKey) {
  const user = await requireAdmin();   // redirects when absent or not an admin
  if (!user) return null;

  renderShell(user, activeKey);
  wireSignOut(user);
  return user;
}

function renderShell(user, activeKey) {
  const path = window.location.pathname;
  const navHost = $('#admin-nav');
  if (navHost && !navHost.children.length) {
    navHost.innerHTML = NAV.map(function (item) {
      const current = item.key === activeKey;
      return '<a class="admin-nav-link' + (current ? ' is-current' : '') + '" href="' +
        item.href + '"' + (current ? ' aria-current="page"' : '') + '>' + item.label + '</a>';
    }).join('');
  }

  const who = $('#admin-who');
  if (who) who.textContent = user.email || '';

  // Full absolute link, so the generated sitemap never picks these up.
  const view = $('#view-live');
  if (view) view.href = rootPrefix() + 'career/index.html';
}

function wireSignOut(user) {
  document.addEventListener('click', function (event) {
    if (!event.target.closest('#admin-signout')) return;
    event.preventDefault();
    signOut();
  });
}

export async function signOut() {
  try {
    await sb.auth.signOut();
  } finally {
    window.location.href = 'login.html';
  }
}

// ---------------------------------------------------------------------------
// Formatting helpers (shared by every admin page)
// ---------------------------------------------------------------------------

export function fmtDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
}

export function fmtDateTime(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true
  });
}

export function initials(name) {
  return String(name || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(function (part) { return part[0].toUpperCase(); })
    .join('') || '?';
}

export function debounce(fn, ms) {
  let timer = null;
  return function () {
    const args = arguments;
    clearTimeout(timer);
    timer = setTimeout(function () { fn.apply(null, args); }, ms);
  };
}

export {
  sb, RATE_LIMITS, cvSignedUrl,
  $, $$, alertBox, clearAlert, fieldError, setBusy, toCareersError
};