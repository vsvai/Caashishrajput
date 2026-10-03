// Service explorer (services.html).
//
// Every service is plain, crawlable HTML (.svx-group > .svx-card). This script
// adds a finder panel on top: live search, "I am…" audience chips and category
// tabs, with animated filtering. Without JavaScript the grouped list remains.
(function () {
  var root = document.getElementById('serviceExplorer');
  if (!root) return;

  var cards = [].slice.call(root.querySelectorAll('.svx-card'));
  var groups = [].slice.call(root.querySelectorAll('.svx-group'));
  if (!cards.length) return;

  var ICON = {
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    all: '<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>',
    individual: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    proprietor: '<path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/><rect width="20" height="14" x="2" y="6" rx="2"/>',
    firm: '<path d="m11 17 2 2a1 1 0 1 0 3-3"/><path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4"/><path d="m21 3 1 11h-2"/><path d="M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3"/><path d="M3 4h8"/>',
    company: '<path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/>',
    ngo: '<path d="M11 14h2a2 2 0 1 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 16"/><path d="m7 20 1.6-1.4c.3-.4.8-.6 1.4-.6h4c1.1 0 2.1-.4 2.8-1.2l4.6-4.4a2 2 0 0 0-2.75-2.91l-4.2 3.9"/><path d="m2 15 6 6"/><path d="M19.5 8.5c.7-.7 1.5-1.6 1.5-2.7A2.73 2.73 0 0 0 16 4a2.78 2.78 0 0 0-5 1.8c0 1.2.8 2 1.5 2.8L16 12Z"/>',
    starting: '<path d="M7 20h10"/><path d="M10 20c5.5-2.5.8-6.4 3-10"/><path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z"/><path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z"/>'
  };
  function svg(p) { return '<svg class="icon-svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + p + '</svg>'; }

  var AUDIENCES = [
    ['individual', 'An individual'], ['proprietor', 'A proprietor or professional'], ['firm', 'A partnership or LLP'],
    ['company', 'A company'], ['ngo', 'A trust, society or NGO'], ['starting', 'Starting a business']
  ];
  var CATS = groups.map(function (g) {
    return { key: g.getAttribute('data-cat'), name: g.querySelector('h2').textContent, icon: g.querySelector('.svx-group-ico').innerHTML, color: g.style.getPropertyValue('--cat') };
  });

  // Keep each card's original text so search highlighting can be undone.
  cards.forEach(function (c) {
    c._name = c.querySelector('.svx-name');
    c._desc = c.querySelector('.svx-desc');
    c._nameHtml = c._name.innerHTML;
    c._descHtml = c._desc.innerHTML;
    c._hay = (c._name.textContent + ' ' + c._desc.textContent + ' ' + c.getAttribute('data-keywords')).toLowerCase();
    c._for = (c.getAttribute('data-for') || '').split(/\s+/);
  });

  var state = { q: '', who: null, cat: 'all' };

  /* ---------------------------------------------------------- finder panel */
  var panel = document.createElement('div');
  panel.className = 'svx-finder';
  panel.innerHTML =
    '<div class="svx-finder-inner">' +
      '<p class="svx-kicker">Service finder</p>' +
      '<h2 class="svx-finder-title">What do you need help with?</h2>' +
      '<label class="svx-search">' + svg(ICON.search) +
        '<span class="visually-hidden">Search services</span>' +
        '<input type="search" placeholder="Try &ldquo;GST return&rdquo;, &ldquo;12A&rdquo;, &ldquo;notice&rdquo; or &ldquo;company registration&rdquo;" autocomplete="off" enterkeyhint="search">' +
        '<kbd aria-hidden="true">/</kbd>' +
        '<button type="button" class="svx-clear" aria-label="Clear search" hidden>' + svg(ICON.x) + '</button>' +
      '</label>' +
      '<p class="svx-who-label">I am&hellip;</p>' +
      '<div class="svx-who" role="group" aria-label="Who are you?">' +
        AUDIENCES.map(function (a) {
          return '<button type="button" class="svx-who-chip" data-who="' + a[0] + '" aria-pressed="false">' + svg(ICON[a[0]]) + '<span>' + a[1] + '</span></button>';
        }).join('') +
      '</div>' +
    '</div>';
  var tabs = document.createElement('div');
  tabs.className = 'svx-tabs-row';
  tabs.innerHTML =
    '<div class="svx-tabs" role="group" aria-label="Service categories">' +
      '<button type="button" class="svx-tab" data-cat="all" aria-pressed="true">' + svg(ICON.all) + '<span>All services</span><b></b></button>' +
      CATS.map(function (c) {
        return '<button type="button" class="svx-tab" data-cat="' + c.key + '" aria-pressed="false" style="--cat:' + c.color + '">' + c.icon + '<span>' + c.name + '</span><b></b></button>';
      }).join('') +
    '</div>' +
    '<p class="svx-status" aria-live="polite"></p>';
  var empty = document.createElement('div');
  empty.className = 'svx-empty';
  empty.hidden = true;
  empty.innerHTML = '<p class="svx-empty-title">No service matches that search.</p>' +
    '<p>The office handles more than is listed here. Describe what you need and you will be told what applies.</p>' +
    '<div class="svx-empty-actions"><button type="button" class="btn btn-secondary svx-reset">Show all services</button><a class="btn btn-primary" href="contact.html#enquiry" data-track="enquiry">Send an enquiry</a></div>';

  root.insertBefore(tabs, root.firstChild);
  root.insertBefore(panel, root.firstChild);
  root.appendChild(empty);
  root.classList.add('svx-js');

  var input = panel.querySelector('input');
  var clearBtn = panel.querySelector('.svx-clear');
  var statusEl = tabs.querySelector('.svx-status');

  /* ---------------------------------------------------------- filtering */
  function escRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  function highlight(html, words) {
    if (!words.length) return html;
    var re = new RegExp('(' + words.map(escRe).join('|') + ')', 'gi');
    // Only touch text between tags.
    return html.replace(/(^|>)([^<]+)/g, function (m, a, text) { return a + text.replace(re, '<mark>$1</mark>'); });
  }
  function matches(c, words) {
    if (state.who && c._for.indexOf(state.who) === -1) return false;
    return words.every(function (w) { return c._hay.indexOf(w) !== -1; });
  }

  function apply() {
    var words = state.q.toLowerCase().split(/\s+/).filter(Boolean);
    var perCat = {}; var shown = 0; var order = 0;
    cards.forEach(function (c) {
      var base = matches(c, words);
      var cat = c.getAttribute('data-cat');
      if (base) perCat[cat] = (perCat[cat] || 0) + 1;
      var on = base && (state.cat === 'all' || state.cat === cat);
      c._name.innerHTML = on ? highlight(c._nameHtml, words) : c._nameHtml;
      c._desc.innerHTML = on ? highlight(c._descHtml, words) : c._descHtml;
      if (on) {
        shown++;
        c.style.setProperty('--i', order++);
        if (c.hidden) { c.hidden = false; c.classList.remove('is-in'); void c.offsetWidth; }
        c.classList.add('is-in');
      } else {
        c.hidden = true;
      }
    });
    groups.forEach(function (g) {
      var visible = g.querySelectorAll('.svx-card:not([hidden])').length;
      g.hidden = visible === 0;
      g.querySelector('.svx-group-count').textContent = visible + (visible === 1 ? ' service' : ' services');
    });
    var totalBase = Object.keys(perCat).reduce(function (a, k) { return a + perCat[k]; }, 0);
    [].forEach.call(tabs.querySelectorAll('.svx-tab'), function (t) {
      var k = t.getAttribute('data-cat');
      var n = k === 'all' ? totalBase : (perCat[k] || 0);
      t.querySelector('b').textContent = n;
      t.classList.toggle('is-empty', n === 0);
      t.setAttribute('aria-pressed', state.cat === k ? 'true' : 'false');
    });
    empty.hidden = shown !== 0;
    clearBtn.hidden = !state.q;
    var parts = [];
    if (state.q) parts.push('matching &ldquo;' + state.q.replace(/</g, '&lt;') + '&rdquo;');
    if (state.who) parts.push('for ' + AUDIENCES.filter(function (a) { return a[0] === state.who; })[0][1].toLowerCase().replace(/^an? /, ''));
    statusEl.innerHTML = 'Showing <strong>' + shown + '</strong> of ' + cards.length + ' services' + (parts.length ? ' ' + parts.join(' ') : '');
  }

  var t;
  input.addEventListener('input', function () {
    clearTimeout(t);
    t = setTimeout(function () { state.q = input.value.trim(); apply(); }, 120);
  });
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { input.value = ''; state.q = ''; apply(); }
    if (e.key === 'Enter') {
      var first = root.querySelector('.svx-card:not([hidden])');
      if (first) { e.preventDefault(); first.focus(); }
    }
  });
  clearBtn.addEventListener('click', function () { input.value = ''; state.q = ''; apply(); input.focus(); });
  document.addEventListener('keydown', function (e) {
    if (e.key === '/' && document.activeElement !== input && !/input|textarea|select/i.test((document.activeElement || {}).tagName || '')) {
      e.preventDefault(); input.focus();
    }
  });

  panel.querySelector('.svx-who').addEventListener('click', function (e) {
    var b = e.target.closest('.svx-who-chip'); if (!b) return;
    var who = b.getAttribute('data-who');
    state.who = state.who === who ? null : who;
    [].forEach.call(panel.querySelectorAll('.svx-who-chip'), function (x) {
      x.setAttribute('aria-pressed', x.getAttribute('data-who') === state.who ? 'true' : 'false');
    });
    apply();
  });
  tabs.querySelector('.svx-tabs').addEventListener('click', function (e) {
    var b = e.target.closest('.svx-tab'); if (!b) return;
    state.cat = b.getAttribute('data-cat');
    apply();
  });
  empty.querySelector('.svx-reset').addEventListener('click', function () {
    input.value = ''; state = { q: '', who: null, cat: 'all' };
    [].forEach.call(panel.querySelectorAll('.svx-who-chip'), function (x) { x.setAttribute('aria-pressed', 'false'); });
    apply();
  });

  // Deep links such as services.html#svc-gst highlight that card.
  var hash = location.hash.slice(1);
  apply();
  if (hash) {
    var target = document.getElementById(hash);
    if (target && target.classList.contains('svx-card')) {
      setTimeout(function () { target.scrollIntoView({ block: 'center' }); target.classList.add('is-flash'); }, 150);
    }
  }
})();
