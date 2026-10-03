// Interactive FY compliance calendar (resources.html).
//
// The page ships every due date as plain, crawlable HTML (.cc-month > .cc-item).
// This script reads that markup and builds the interactive view on top of it:
// a live countdown to the next deadline, working law filters, an animated
// year chart, a month grid with due-date markers, and .ics "add to calendar"
// downloads. Without JavaScript the static list remains readable.
(function () {
  var root = document.getElementById('complianceCalendar');
  if (!root) return;

  var LAWS = {
    it:  { name: 'Income tax', short: 'Income tax', color: '#1f4e8c', icon: '<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M8 7h8"/><path d="M8 11h8"/><path d="M12 17.5 8 15h1a4 4 0 0 0 0-8"/>' },
    gst: { name: 'GST', short: 'GST', color: '#1b6b4f', icon: '<path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"/><path d="m15 9-6 6"/><path d="M9 9h.01"/><path d="M15 15h.01"/>' },
    epf: { name: 'Provident fund (EPF)', short: 'EPF', color: '#5b3f8c', icon: '<path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.7-1 2-2h2v-4h-2c0-1-.5-1.5-1-2V5z"/><path d="M2 9v1c0 1.1.9 2 2 2h1"/><path d="M16 11h.01"/>' },
    esi: { name: 'ESI', short: 'ESI', color: '#1d6a6a', icon: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/><path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27"/>' },
    roc: { name: 'Companies Act / ROC', short: 'ROC', color: '#8f2d22', icon: '<path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/>' },
    llp: { name: 'LLP', short: 'LLP', color: '#8a4a14', icon: '<path d="m11 17 2 2a1 1 0 1 0 3-3"/><path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4"/><path d="m21 3 1 11h-2"/><path d="M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3"/><path d="M3 4h8"/>' }
  };
  var ORDER = ['it', 'gst', 'epf', 'esi', 'roc', 'llp'];
  var UI = {
    calPlus: '<path d="M8 2v4"/><path d="M16 2v4"/><path d="M21 13V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8"/><path d="M3 10h18"/><path d="M16 19h6"/><path d="M19 16v6"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
    left: '<path d="m15 18-6-6 6-6"/>',
    right: '<path d="m9 18 6-6-6-6"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    timer: '<path d="M10 2h4"/><path d="M12 14l3-3"/><circle cx="12" cy="14" r="8"/>',
    x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    layers: '<path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>'
  };
  function svg(paths, cls) {
    return '<svg class="icon-svg' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + paths + '</svg>';
  }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var DAY = 86400000;
  var IST = 5.5 * 3600000;

  /* ---------------------------------------------------------- data */
  var months = [].map.call(root.querySelectorAll('.cc-month'), function (sec) {
    var p = sec.getAttribute('data-month').split('-');
    return { key: sec.getAttribute('data-month'), y: +p[0], m: +p[1] - 1 };
  });
  var items = [].map.call(root.querySelectorAll('.cc-item'), function (li, i) {
    var iso = li.querySelector('time').getAttribute('datetime');
    var p = iso.split('-');
    var what = li.querySelector('.cc-what').cloneNode(true);
    var note = what.querySelector('.cc-note');
    var noteText = note ? note.textContent.replace(/[()]/g, '').trim() : '';
    if (note) note.remove();
    return {
      id: i, law: li.getAttribute('data-law'), y: +p[0], m: +p[1] - 1, d: +p[2],
      alt: li.getAttribute('data-alt-day') ? +li.getAttribute('data-alt-day') : null,
      monthKey: p[0] + '-' + p[1], html: what.innerHTML.trim(), text: what.textContent.replace(/\s+/g, ' ').trim(), note: noteText,
      lawLabel: li.querySelector('.cc-law').textContent
    };
  });
  if (!months.length || !items.length) return;

  // Dates are compared in IST: a deadline runs to 23:59:59 IST on its due date.
  function utcDay(y, m, d) { return Date.UTC(y, m, d); }
  function todayIST() { var n = new Date(Date.now() + IST); return utcDay(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate()); }
  function deadline(it) { return utcDay(it.y, it.m, it.d) + DAY - 1 - IST; }
  function daysLeft(it) { return Math.round((utcDay(it.y, it.m, it.d) - todayIST()) / DAY); }
  function dow(it) { return DOW[new Date(utcDay(it.y, it.m, it.d)).getUTCDay()]; }

  /* ---------------------------------------------------------- state */
  var state = { laws: {}, month: 0, day: null };
  ORDER.forEach(function (l) { state.laws[l] = true; });
  function active(it) { return state.laws[it.law]; }
  function allOn() { return ORDER.every(function (l) { return state.laws[l]; }); }

  var t0 = todayIST();
  months.forEach(function (mo, i) {
    if (utcDay(mo.y, mo.m, 1) <= t0) state.month = i;
  });

  /* ---------------------------------------------------------- skeleton */
  var fy = root.getAttribute('data-fy') || '';
  var ui = document.createElement('div');
  ui.className = 'cc-app';
  ui.innerHTML =
    '<div class="cc-top">' +
      '<div class="cc-next" aria-live="polite"></div>' +
      '<div class="cc-year">' +
        '<div class="cc-year-head"><div><p class="cc-kicker">FY ' + esc(fy) + ' at a glance</p><p class="cc-year-sub">Deadlines per month. Select a month to open it.</p></div>' +
        '<div class="cc-year-total"><span class="cc-total-num">0</span><span>deadlines shown</span></div></div>' +
        '<div class="cc-bars" role="group" aria-label="Deadlines per month"></div>' +
      '</div>' +
    '</div>' +
    '<div class="cc-toolbar">' +
      '<div class="cc-filters" role="group" aria-label="Filter by law"></div>' +
      '<button type="button" class="cc-dl-all">' + svg(UI.download) + '<span>Download shown dates (.ics)</span></button>' +
    '</div>' +
    '<div class="cc-panel">' +
      '<div class="cc-panel-head">' +
        '<button type="button" class="cc-nav cc-prev" aria-label="Previous month">' + svg(UI.left) + '</button>' +
        '<h3 class="cc-panel-title" aria-live="polite"></h3>' +
        '<button type="button" class="cc-nav cc-next-btn" aria-label="Next month">' + svg(UI.right) + '</button>' +
      '</div>' +
      '<div class="cc-panel-body">' +
        '<div class="cc-grid-wrap"><div class="cc-dow">' + ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(function (d) { return '<span>' + d + '</span>'; }).join('') + '</div><div class="cc-grid"></div>' +
          '<p class="cc-grid-hint">Dates with a marker have a deadline. Select one to see only that day.</p></div>' +
        '<div class="cc-list-wrap"><div class="cc-dayfilter" hidden></div><ol class="cc-agenda"></ol></div>' +
      '</div>' +
    '</div>';
  root.insertBefore(ui, root.firstChild);
  root.classList.add('cc-js');

  var $ = function (sel) { return ui.querySelector(sel); };
  var nextEl = $('.cc-next'), barsEl = $('.cc-bars'), filtersEl = $('.cc-filters'), gridEl = $('.cc-grid'),
      agendaEl = $('.cc-agenda'), titleEl = $('.cc-panel-title'), dayFilterEl = $('.cc-dayfilter'), totalEl = $('.cc-total-num');

  /* ---------------------------------------------------------- filters */
  function renderFilters() {
    var counts = {};
    items.forEach(function (it) { counts[it.law] = (counts[it.law] || 0) + 1; });
    var html = '<button type="button" class="cc-chip cc-chip-all" data-law="all" aria-pressed="' + allOn() + '">' + svg(UI.layers) + '<span>All</span><b>' + items.length + '</b></button>';
    ORDER.forEach(function (l) {
      if (!counts[l]) return;
      html += '<button type="button" class="cc-chip" data-law="' + l + '" aria-pressed="' + (!allOn() && state.laws[l]) + '" style="--law:' + LAWS[l].color + '">' +
        '<span class="cc-chip-ico">' + svg(LAWS[l].icon) + '</span><span>' + LAWS[l].name + '</span><b>' + counts[l] + '</b></button>';
    });
    filtersEl.innerHTML = html;
  }
  filtersEl.addEventListener('click', function (e) {
    var b = e.target.closest('.cc-chip'); if (!b) return;
    var law = b.getAttribute('data-law');
    if (law === 'all') {
      ORDER.forEach(function (l) { state.laws[l] = true; });
    } else if (allOn()) {
      // From "all", a click isolates that law; later clicks add or remove laws.
      ORDER.forEach(function (l) { state.laws[l] = l === law; });
    } else {
      state.laws[law] = !state.laws[law];
      if (!ORDER.some(function (l) { return state.laws[l]; })) ORDER.forEach(function (l) { state.laws[l] = true; });
    }
    state.day = null;
    renderFilters(); renderBars(); renderNext(); renderMonth(0);
  });

  /* ---------------------------------------------------------- year chart */
  var barsBuilt = false;
  function renderBars() {
    var per = months.map(function (mo) {
      var c = {}; ORDER.forEach(function (l) { c[l] = 0; });
      items.forEach(function (it) { if (it.monthKey === mo.key && active(it)) c[it.law]++; });
      return c;
    });
    var totals = per.map(function (c) { return ORDER.reduce(function (s, l) { return s + c[l]; }, 0); });
    var max = Math.max.apply(null, months.map(function (mo) {
      return items.filter(function (it) { return it.monthKey === mo.key; }).length;
    }));
    var shown = totals.reduce(function (a, b) { return a + b; }, 0);
    animateNumber(totalEl, shown);
    var curMonthKey = (function () { var n = new Date(t0); return n.getUTCFullYear() + '-' + String(n.getUTCMonth() + 1).padStart(2, '0'); })();

    if (!barsBuilt) {
      barsEl.innerHTML = months.map(function (mo, i) {
        return '<button type="button" class="cc-bar' + (mo.key === curMonthKey ? ' is-now' : '') + '" data-i="' + i + '">' +
          '<span class="cc-bar-count"></span>' +
          '<span class="cc-bar-track">' + ORDER.map(function (l) { return '<span class="cc-seg" data-law="' + l + '" style="background:' + LAWS[l].color + '"></span>'; }).join('') + '</span>' +
          '<span class="cc-bar-label">' + SHORT[mo.m] + '<small>' + String(mo.y).slice(2) + '</small></span>' +
          '</button>';
      }).join('');
      barsBuilt = true;
    }
    var past = function (mo) { return utcDay(mo.y, mo.m + 1, 0) < t0; };
    [].forEach.call(barsEl.children, function (btn, i) {
      btn.classList.toggle('is-active', i === state.month);
      btn.classList.toggle('is-past', past(months[i]));
      btn.setAttribute('aria-pressed', i === state.month ? 'true' : 'false');
      btn.setAttribute('aria-label', MONTHS[months[i].m] + ' ' + months[i].y + ': ' + totals[i] + ' deadline' + (totals[i] === 1 ? '' : 's'));
      btn.querySelector('.cc-bar-count').textContent = totals[i];
      [].forEach.call(btn.querySelectorAll('.cc-seg'), function (seg) {
        seg.style.setProperty('--h', (per[i][seg.getAttribute('data-law')] / max * 100) + '%');
      });
    });
  }
  barsEl.addEventListener('click', function (e) {
    var b = e.target.closest('.cc-bar'); if (!b) return;
    var i = +b.getAttribute('data-i');
    var dir = i > state.month ? 1 : -1;
    state.month = i; state.day = null;
    renderBars(); renderMonth(dir);
    if (window.matchMedia('(max-width: 960px)').matches) ui.querySelector('.cc-panel').scrollIntoView({ block: 'start' });
  });

  function animateNumber(el, to) {
    var from = +el.textContent || 0;
    if (from === to || window.matchMedia('(prefers-reduced-motion: reduce)').matches) { el.textContent = to; return; }
    var start = null;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min(1, (ts - start) / 500);
      el.textContent = Math.round(from + (to - from) * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
    // Background tabs pause requestAnimationFrame; make sure the final value lands.
    setTimeout(function () { el.textContent = to; }, 650);
  }

  /* ---------------------------------------------------------- next deadline */
  var nextItem = null;
  function renderNext() {
    var now = Date.now();
    var upcoming = items.filter(function (it) { return active(it) && deadline(it) >= now; })
      .sort(function (a, b) { return deadline(a) - deadline(b) || a.id - b.id; });
    nextItem = upcoming[0] || null;
    if (!nextItem) {
      nextEl.innerHTML = '<p class="cc-kicker">Next deadline</p><p class="cc-next-title">No further dates in FY ' + esc(fy) + ' for this selection.</p>';
      return;
    }
    var it = nextItem, L = LAWS[it.law];
    var sameDay = upcoming.filter(function (o) { return o !== it && o.y === it.y && o.m === it.m && o.d === it.d; });
    var in30 = upcoming.filter(function (o) { return deadline(o) - now <= 30 * DAY; }).length;
    var later = upcoming.slice(1, 4);
    nextEl.style.setProperty('--law', L.color);
    nextEl.innerHTML =
      '<div class="cc-next-head"><p class="cc-kicker">' + svg(UI.timer) + 'Next deadline</p>' +
        '<span class="cc-next-badge">' + in30 + ' due in the next 30 days</span></div>' +
      '<div class="cc-next-main">' +
        '<span class="cc-next-ico">' + svg(L.icon) + '</span>' +
        '<div><p class="cc-next-law">' + esc(it.lawLabel) + ' &middot; ' + dow(it) + ', ' + it.d + ' ' + MONTHS[it.m] + ' ' + it.y + '</p>' +
        '<p class="cc-next-title">' + it.html + '</p>' +
        (sameDay.length ? '<p class="cc-next-also">+ ' + sameDay.length + ' more due the same day</p>' : '') + '</div>' +
      '</div>' +
      '<div class="cc-count" role="timer" aria-label="Time remaining">' +
        ['d', 'h', 'm', 's'].map(function (u) {
          return '<div class="cc-count-cell"><span class="cc-count-num" data-u="' + u + '">00</span><span class="cc-count-unit">' + { d: 'days', h: 'hours', m: 'min', s: 'sec' }[u] + '</span></div>';
        }).join('') +
      '</div>' +
      '<div class="cc-next-foot">' +
        '<button type="button" class="cc-add cc-add-light" data-id="' + it.id + '">' + svg(UI.calPlus) + 'Add to my calendar</button>' +
        (later.length ? '<ul class="cc-later">' + later.map(function (o) {
          return '<li><span class="cc-dot" style="background:' + LAWS[o.law].color + '"></span><span>' + o.d + ' ' + SHORT[o.m] + '</span> ' + esc(o.text) + '</li>';
        }).join('') + '</ul>' : '') +
      '</div>';
    tick(true);
  }
  var lastVals = {};
  function tick(force) {
    if (!nextItem) return;
    var ms = deadline(nextItem) - Date.now();
    if (ms < 0) { renderNext(); renderMonth(0); return; }
    var v = { d: Math.floor(ms / DAY), h: Math.floor(ms / 3600000) % 24, m: Math.floor(ms / 60000) % 60, s: Math.floor(ms / 1000) % 60 };
    Object.keys(v).forEach(function (u) {
      var el = nextEl.querySelector('[data-u="' + u + '"]'); if (!el) return;
      var txt = String(v[u]).padStart(2, '0');
      if (force || lastVals[u] !== txt) {
        el.textContent = txt;
        if (!force) { el.classList.remove('is-tick'); void el.offsetWidth; el.classList.add('is-tick'); }
        lastVals[u] = txt;
      }
    });
  }
  setInterval(tick, 1000);

  /* ---------------------------------------------------------- month panel */
  function statusOf(it) {
    var n = daysLeft(it);
    if (n < 0) return { cls: 'is-done', txt: 'Passed', icon: UI.check };
    if (n === 0) return { cls: 'is-today', txt: 'Due today', icon: UI.timer };
    if (n === 1) return { cls: 'is-soon', txt: 'Tomorrow', icon: UI.timer };
    if (n <= 7) return { cls: 'is-soon', txt: 'In ' + n + ' days', icon: UI.timer };
    return { cls: '', txt: 'In ' + n + ' days', icon: '' };
  }

  function renderMonth(dir) {
    var mo = months[state.month];
    titleEl.innerHTML = MONTHS[mo.m] + ' <span>' + mo.y + '</span>';
    ui.querySelector('.cc-prev').disabled = state.month === 0;
    ui.querySelector('.cc-next-btn').disabled = state.month === months.length - 1;

    var monthItems = items.filter(function (it) { return it.monthKey === mo.key && active(it); })
      .sort(function (a, b) { return a.d - b.d || a.id - b.id; });

    // Grid (Monday first)
    var first = new Date(utcDay(mo.y, mo.m, 1)).getUTCDay();
    var lead = (first + 6) % 7;
    var dim = new Date(utcDay(mo.y, mo.m + 1, 0)).getUTCDate();
    var cells = '';
    for (var i = 0; i < lead; i++) cells += '<span class="cc-cell is-empty"></span>';
    for (var d = 1; d <= dim; d++) {
      var dayItems = monthItems.filter(function (it) { return it.d === d || it.alt === d; });
      var cls = 'cc-cell';
      var t = utcDay(mo.y, mo.m, d);
      if (t === t0) cls += ' is-today';
      if (t < t0) cls += ' is-past';
      if (state.day === d) cls += ' is-selected';
      if (dayItems.length) {
        var dots = dayItems.slice(0, 4).map(function (it) { return '<i style="background:' + LAWS[it.law].color + '"></i>'; }).join('');
        cells += '<button type="button" class="' + cls + ' has-items" data-day="' + d + '" aria-pressed="' + (state.day === d) + '" aria-label="' + d + ' ' + MONTHS[mo.m] + ': ' + dayItems.length + ' deadline' + (dayItems.length > 1 ? 's' : '') + '">' +
          '<span>' + d + '</span><span class="cc-dots">' + dots + '</span></button>';
      } else {
        cells += '<span class="' + cls + '"><span>' + d + '</span></span>';
      }
    }
    gridEl.innerHTML = cells;

    // Agenda
    var shown = state.day ? monthItems.filter(function (it) { return it.d === state.day || it.alt === state.day; }) : monthItems;
    if (state.day) {
      dayFilterEl.hidden = false;
      dayFilterEl.innerHTML = '<span>Showing ' + state.day + ' ' + MONTHS[mo.m] + ' only</span><button type="button" class="cc-clear">' + svg(UI.x) + 'Show whole month</button>';
    } else {
      dayFilterEl.hidden = true;
    }
    if (!shown.length) {
      agendaEl.innerHTML = '<li class="cc-empty">No deadlines in ' + MONTHS[mo.m] + ' for the selected laws.</li>';
    } else {
      var lastDay = null;
      agendaEl.innerHTML = shown.map(function (it, idx) {
        var L = LAWS[it.law], st = statusOf(it);
        var newDay = it.d !== lastDay; lastDay = it.d;
        return '<li class="cc-row ' + st.cls + (newDay ? ' is-first' : '') + '" style="--law:' + L.color + ';--i:' + idx + '">' +
          '<div class="cc-date' + (newDay ? '' : ' is-repeat') + '"><span class="cc-date-d">' + (it.alt ? it.d + '<small>/' + it.alt + '</small>' : it.d) + '</span><span class="cc-date-w">' + dow(it) + '</span></div>' +
          '<span class="cc-row-ico" title="' + esc(L.name) + '">' + svg(L.icon) + '</span>' +
          '<div class="cc-row-main"><p class="cc-row-law">' + esc(it.lawLabel) + '</p><p class="cc-row-title">' + it.html + '</p>' +
            (it.note ? '<p class="cc-row-note">' + esc(it.note) + '</p>' : '') + '</div>' +
          '<div class="cc-row-side"><span class="cc-status">' + (st.icon ? svg(st.icon) : '') + st.txt + '</span>' +
            (st.cls === 'is-done' ? '' : '<button type="button" class="cc-add" data-id="' + it.id + '" aria-label="Add ' + esc(it.text) + ' on ' + it.d + ' ' + MONTHS[it.m] + ' to my calendar">' + svg(UI.calPlus) + '<span>Add</span></button>') +
          '</div></li>';
      }).join('');
    }

    var body = ui.querySelector('.cc-panel-body');
    body.classList.remove('slide-left', 'slide-right', 'fade');
    void body.offsetWidth;
    body.classList.add(dir > 0 ? 'slide-left' : dir < 0 ? 'slide-right' : 'fade');
  }

  ui.querySelector('.cc-prev').addEventListener('click', function () { if (state.month > 0) { state.month--; state.day = null; renderBars(); renderMonth(-1); } });
  ui.querySelector('.cc-next-btn').addEventListener('click', function () { if (state.month < months.length - 1) { state.month++; state.day = null; renderBars(); renderMonth(1); } });
  gridEl.addEventListener('click', function (e) {
    var c = e.target.closest('.has-items'); if (!c) return;
    var d = +c.getAttribute('data-day');
    state.day = state.day === d ? null : d;
    renderMonth(0);
  });
  dayFilterEl.addEventListener('click', function (e) { if (e.target.closest('.cc-clear')) { state.day = null; renderMonth(0); } });
  ui.querySelector('.cc-panel').addEventListener('keydown', function (e) {
    if (e.target.closest('input, textarea')) return;
    if (e.key === 'ArrowLeft' && state.month > 0 && !e.target.closest('.cc-grid')) { state.month--; state.day = null; renderBars(); renderMonth(-1); }
    if (e.key === 'ArrowRight' && state.month < months.length - 1 && !e.target.closest('.cc-grid')) { state.month++; state.day = null; renderBars(); renderMonth(1); }
  });

  /* ---------------------------------------------------------- .ics export */
  function icsEsc(s) { return String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n'); }
  function ymd(y, m, d) { return y + String(m + 1).padStart(2, '0') + String(d).padStart(2, '0'); }
  function vevent(it) {
    var next = new Date(utcDay(it.y, it.m, it.d) + DAY);
    var stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
    var summary = it.text + ' (' + it.lawLabel + ')';
    return ['BEGIN:VEVENT',
      'UID:fy' + fy + '-' + it.id + '-' + ymd(it.y, it.m, it.d) + '@caashishrajput.com',
      'DTSTAMP:' + stamp,
      'DTSTART;VALUE=DATE:' + ymd(it.y, it.m, it.d),
      'DTEND;VALUE=DATE:' + ymd(next.getUTCFullYear(), next.getUTCMonth(), next.getUTCDate()),
      'SUMMARY:' + icsEsc('Due: ' + summary),
      'DESCRIPTION:' + icsEsc((it.note ? it.note + '. ' : '') + 'From the FY ' + fy + ' compliance calendar of Ashish Jayalata & Associates, Chartered Accountants (https://caashishrajput.com/resources.html). Statutory dates can change by notification; confirm on the official portal before filing.'),
      'BEGIN:VALARM', 'TRIGGER:-P2D', 'ACTION:DISPLAY', 'DESCRIPTION:' + icsEsc('Due in 2 days: ' + summary), 'END:VALARM',
      'END:VEVENT'].join('\r\n');
  }
  function downloadIcs(list, name) {
    var body = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Ashish Jayalata & Associates//Compliance Calendar//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH']
      .concat(list.map(vevent), ['END:VCALENDAR']).join('\r\n')
      // RFC 5545: fold content lines longer than 75 octets (continuation lines start with a space).
      .split('\r\n').map(function (line) {
        var out = [];
        while (line.length > 70) { out.push(line.slice(0, 70)); line = ' ' + line.slice(70); }
        out.push(line);
        return out.join('\r\n');
      }).join('\r\n');
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([body], { type: 'text/calendar;charset=utf-8' }));
    a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
  }
  ui.addEventListener('click', function (e) {
    var b = e.target.closest('.cc-add'); if (!b) return;
    var it = items[+b.getAttribute('data-id')];
    downloadIcs([it], (it.text.split(' ')[0].replace(/[^\w-]/g, '') || 'deadline') + '-' + ymd(it.y, it.m, it.d) + '.ics');
    b.classList.add('is-added');
    setTimeout(function () { b.classList.remove('is-added'); }, 1600);
  });
  ui.querySelector('.cc-dl-all').addEventListener('click', function () {
    var now = Date.now();
    var list = items.filter(function (it) { return active(it) && deadline(it) >= now; });
    var tag = allOn() ? 'all' : ORDER.filter(function (l) { return state.laws[l]; }).join('-');
    downloadIcs(list, 'compliance-calendar-fy' + fy + '-' + tag + '.ics');
  });

  /* ---------------------------------------------------------- go */
  renderFilters();
  renderBars();
  renderNext();
  renderMonth(0);

  // Bars grow in when the chart first scrolls into view.
  if ('IntersectionObserver' in window) {
    root.classList.add('cc-pre');
    var io = new IntersectionObserver(function (entries) {
      if (entries.some(function (en) { return en.isIntersecting; })) { root.classList.remove('cc-pre'); io.disconnect(); }
    }, { threshold: 0.2 });
    io.observe(barsEl);
    // Never leave the chart empty if the observer does not fire (e.g. prerendered or background tabs).
    setTimeout(function () { root.classList.remove('cc-pre'); io.disconnect(); }, 2500);
  }
})();
