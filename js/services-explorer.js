// Service explorer (services.html).
//
// Every service is plain, crawlable HTML (.svx-group > .svx-card). This script
// adds a finder panel on top: live search with synonyms and relevance ranking,
// popular-search chips, "I am…" audience chips and category tabs, with animated
// filtering, a shareable URL state and a "discuss these" action. Without
// JavaScript the grouped list remains.
(function () {
  var root = document.getElementById('serviceExplorer');
  if (!root) return;

  var cards = [].slice.call(root.querySelectorAll('.svx-card'));
  var groups = [].slice.call(root.querySelectorAll('.svx-group'));
  var groupHome = groups[0] && groups[0].parentNode;
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

  // Typical starting documents (general guidance; the office confirms the checklist per engagement).
  var PEEK = {
    'income-tax': ['PAN and Aadhaar', 'Form 16 / income and TDS details', 'Bank statements and investment proofs'],
    'gst': ['PAN of the business or owner', 'Address proof of the business premises', 'Bank details and photographs'],
    'tax-audit': ['Books of accounts and bank statements', 'Previous year return and audit report', 'GST and TDS records'],
    'corporate-representation': ['The notice or order received', 'Return and records for the year concerned', 'Earlier correspondence, if any'],
    'statutory-audit': ['Trial balance and books of accounts', 'Bank and loan confirmations', 'Statutory registers and prior-year financials'],
    'internal-audit': ['Process and policy documents', 'Sample transaction records', 'Organisation chart and key contacts'],
    'charities-trust-audits': ['Trust deed or society MOA', 'Registrations (12A / 80G, if held)', 'Receipts, payments and bank records'],
    'company-llp-registration': ['PAN and Aadhaar of directors or partners', 'Address proof of the registered office', 'Proposed names and business activity'],
    'trust-society-ngo-registration': ['PAN and Aadhaar of trustees or members', 'Address proof of the registered office', 'Aims and objects of the organisation'],
    'msme-udyam-registration': ['Aadhaar of the owner or authorised person', 'PAN and GSTIN, if any', 'Bank details and business activity'],
    'import-export-code-iec': ['PAN of the business', 'Bank certificate or cancelled cheque', 'Address proof of the business'],
    'fssai-registration': ['Photo ID and photograph of the applicant', 'Address proof of the premises', 'List of food products handled'],
    'lei-certificate': ['PAN and incorporation documents', 'Registered address proof', 'Authorised signatory details'],
    'accounting-bookkeeping': ['Sales and purchase invoices', 'Bank statements', 'Expense vouchers and previous books'],
    'business-advisory': ['Recent financial statements', 'Current budgets or MIS, if any', 'A short note on your goals'],
    'business-plan-financial-projections': ['Past financials (if existing business)', 'Details of the project and funding needed', 'Quotations for assets or costs'],
    'asset-valuation': ['Fixed asset or stock list', 'Purchase invoices and past valuations', 'Purpose of the valuation']
  };

  // Keep each card's original text so search highlighting can be undone.
  cards.forEach(function (c) {
    c._name = c.querySelector('.svx-name');
    c._desc = c.querySelector('.svx-desc');
    c._nameHtml = c._name.innerHTML;
    c._descHtml = c._desc.innerHTML;
    c._hay = (c._name.textContent + ' ' + c._desc.textContent + ' ' + c.getAttribute('data-keywords')).toLowerCase();
    c._for = (c.getAttribute('data-for') || '').split(/\s+/);
    c._kw = (c.getAttribute('data-keywords') || '').toLowerCase();
    // Wrap each card so a "Quick look" toggle and panel can sit under it (a link cannot contain a button).
    var item = document.createElement('div');
    item.className = 'svx-item';
    c._home = c.parentNode;
    c._pos = [].indexOf.call(c.parentNode.children, c);
    c.parentNode.insertBefore(item, c);
    item.appendChild(c);
    c._item = item;
    var docs = PEEK[c.id.replace('svc-', '')];
    if (docs) {
      var pid = 'peek-' + c.id;
      var tog = document.createElement('button');
      tog.type = 'button'; tog.className = 'svx-peek-toggle';
      tog.setAttribute('aria-expanded', 'false'); tog.setAttribute('aria-controls', pid);
      tog.innerHTML = '<span>Quick look</span>' + svg('<path d="m6 9 6 6 6-6"/>');
      var pan = document.createElement('div');
      pan.className = 'svx-peek'; pan.id = pid; pan.hidden = true;
      var name = c.querySelector('.svx-name').textContent;
      pan.innerHTML = '<p class="svx-peek-h">Usually needed to get started</p><ul>' +
        docs.map(function (d) { return '<li>' + d + '</li>'; }).join('') + '</ul>' +
        '<p class="svx-peek-note">The office confirms the exact checklist, fee and timeline in writing before work begins.</p>' +
        '<div class="svx-peek-actions"><a class="btn btn-primary" target="_blank" rel="noopener" data-track="whatsapp" href="https://wa.me/918802586988?text=' +
        encodeURIComponent('Hello, I would like to know more about ' + name + '.') + '">Ask about this</a>' +
        '<a class="btn btn-secondary" href="' + c.getAttribute('href') + '">Full details</a></div>';
      tog.addEventListener('click', function () {
        var open = tog.getAttribute('aria-expanded') !== 'true';
        tog.setAttribute('aria-expanded', open ? 'true' : 'false');
        pan.hidden = !open;
        item.classList.toggle('is-open', open);
      });
      item.appendChild(tog); item.appendChild(pan);
    }
  });

  var state = { q: '', who: null, cat: 'all' };
  var WHO_KEYS = AUDIENCES.map(function (a) { return a[0]; });
  var CAT_KEYS = ['all'].concat(CATS.map(function (c) { return c.key; }));
  var reduceMotion = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Plain-language ways people describe a need, mapped to terms already on the cards.
  var SYNONYMS = {
    itr: ['income tax'], refund: ['itr'], salary: ['itr'], gstin: ['gst'],
    licence: ['fssai', 'license'], license: ['fssai', 'licence'],
    letter: ['notice'], summons: ['notice'], startup: ['company', 'incorporation', 'udyam'],
    pvt: ['private limited'], ltd: ['limited'], loan: ['project report', 'cma', 'projections'],
    bank: ['cma', 'lei'], export: ['iec'], import: ['iec'],
    ngo: ['trust', 'society', '12a', '80g'], charity: ['trust', '12a', '80g'],
    books: ['bookkeeping', 'accounting'], accounts: ['accounting', 'bookkeeping'], cfo: ['advisory'],
    valuation: ['asset'], audit: ['44ab', 'statutory']
  };
  var POPULAR = ['ITR filing', 'GST registration', 'Income tax notice', 'Company registration', 'Tax audit', '12A / 80G', 'Loan project report'];
  var PLACEHOLDERS = ['GST return', '12A', 'income tax notice', 'company registration', 'FSSAI licence', 'project report for a loan'];

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
      '<p class="svx-pop"><span>Popular:</span>' +
        POPULAR.map(function (q) { return '<button type="button" class="svx-pop-chip" data-q="' + q + '">' + q + '</button>'; }).join('') +
      '</p>' +
      '<p class="svx-who-label">I am&hellip;</p>' +
      '<div class="svx-who" role="group" aria-label="Who are you?">' +
        AUDIENCES.map(function (a) {
          return '<button type="button" class="svx-who-chip" data-who="' + a[0] + '" aria-pressed="false">' + svg(ICON[a[0]]) + '<span>' + a[1] + '</span></button>';
        }).join('') +
      '</div>' +
      '<button type="button" class="svx-guide-btn">' + svg('<path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/>') + 'Not sure? Guide me in 2 questions</button>' +
    '</div>' +
    '<div class="svx-wizard" hidden></div>';
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

  var bar = document.createElement('div');
  bar.className = 'svx-bar';
  bar.hidden = true;
  bar.innerHTML = '<p class="svx-bar-text"></p><div class="svx-bar-actions"><a class="btn btn-primary svx-bar-wa" target="_blank" rel="noopener" data-track="whatsapp">Discuss on WhatsApp</a><button type="button" class="btn btn-secondary svx-reset">Clear filters</button></div>';
  var sentinel = document.createElement('div');
  sentinel.className = 'svx-sentinel';

  root.insertBefore(bar, root.firstChild);
  root.insertBefore(tabs, root.firstChild);
  root.insertBefore(sentinel, root.firstChild);
  root.insertBefore(panel, root.firstChild);
  root.appendChild(empty);
  root.classList.add('svx-js');

  var input = panel.querySelector('input');
  var clearBtn = panel.querySelector('.svx-clear');
  var statusEl = tabs.querySelector('.svx-status');
  var barText = bar.querySelector('.svx-bar-text');
  var barWa = bar.querySelector('.svx-bar-wa');

  /* ---------------------------------------------------------- filtering */
  function escRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  function highlight(html, words) {
    if (!words.length) return html;
    var re = new RegExp('(' + words.map(escRe).join('|') + ')', 'gi');
    // Only touch text between tags.
    return html.replace(/(^|>)([^<]+)/g, function (m, a, text) { return a + text.replace(re, '<mark>$1</mark>'); });
  }
  function hit(c, w) {
    if (c._hay.indexOf(w) !== -1) return true;
    var alt = SYNONYMS[w];
    return !!alt && alt.some(function (a) { return c._hay.indexOf(a) !== -1; });
  }
  // 0 = no match; higher = better. Name hits outrank keyword hits outrank description hits.
  function score(c, words) {
    if (state.who && c._for.indexOf(state.who) === -1) return 0;
    if (!words.length) return 1;
    var total = 0;
    var n = c._name.textContent.toLowerCase();
    for (var i = 0; i < words.length; i++) {
      var w = words[i];
      if (!hit(c, w)) return 0;
      total += n.indexOf(w) === 0 ? 6 : n.indexOf(w) !== -1 ? 4 : c._kw.indexOf(w) !== -1 ? 3 : 1;
    }
    return total;
  }

  // With a search active, the best-matching group and card come first; otherwise
  // the original page order is restored.
  function sortByRelevance(scores) {
    var gScore = {};
    groups.forEach(function (g) { gScore[g.getAttribute('data-cat')] = 0; });
    if (scores) cards.forEach(function (c, i) {
      var k = c.getAttribute('data-cat'); if (scores[i] > gScore[k]) gScore[k] = scores[i];
    });
    groups.slice().sort(function (a, b) {
      return scores ? gScore[b.getAttribute('data-cat')] - gScore[a.getAttribute('data-cat')] || groups.indexOf(a) - groups.indexOf(b) : groups.indexOf(a) - groups.indexOf(b);
    }).forEach(function (g) { groupHome.insertBefore(g, empty); });
    groups.forEach(function (g) {
      [].slice.call(g.querySelectorAll('.svx-card')).sort(function (a, b) {
        return scores ? scores[cards.indexOf(b)] - scores[cards.indexOf(a)] || a._pos - b._pos : a._pos - b._pos;
      }).forEach(function (c) { c._home.appendChild(c._item); });
    });
  }

  function updateBar(shown, best, whoName) {
    var filtered = state.q || state.who || state.cat !== 'all';
    bar.hidden = !(filtered && shown > 0);
    if (bar.hidden) return;
    var names = [].slice.call(root.querySelectorAll('.svx-card:not([hidden]) .svx-name')).slice(0, 3)
      .map(function (n) { return n.textContent; });
    var lead = best ? best.querySelector('.svx-name').textContent : names[0];
    barText.innerHTML = shown === 1
      ? '<strong>' + lead + '</strong> looks like the right fit. Tell the office what you need and you will be told the documents and timeline.'
      : '<strong>' + shown + ' services</strong> match' + (whoName ? ' for ' + whoName : '') + '. Not sure which one applies? The office will point you to the right one.';
    var msg = 'Hello, I was looking at ' + (shown === 1 ? lead : names.join(', ') + (shown > 3 ? ' and other services' : '')) +
      ' on your website' + (whoName ? ' (I am ' + (/^[aeiou]/.test(whoName) ? 'an ' : 'a ') + whoName + ')' : '') + ' and would like to discuss my requirement.';
    barWa.href = 'https://wa.me/918802586988?text=' + encodeURIComponent(msg);
  }

  // Keep the current search shareable: services.html?q=notice&who=company&cat=tax
  function syncUrl() {
    if (!window.history || !history.replaceState) return;
    var p = [];
    if (state.q) p.push('q=' + encodeURIComponent(state.q));
    if (state.who) p.push('who=' + state.who);
    if (state.cat !== 'all') p.push('cat=' + state.cat);
    try { history.replaceState(null, '', location.pathname + (p.length ? '?' + p.join('&') : '') + location.hash); } catch (e) {}
  }

  function apply() {
    var words = state.q.toLowerCase().split(/\s+/).filter(Boolean);
    var perCat = {}; var shown = 0; var order = 0; var best = null; var bestScore = 0;
    var scores = cards.map(function (c) { return score(c, words); });
    cards.forEach(function (c, i) {
      var base = scores[i] > 0;
      var cat = c.getAttribute('data-cat');
      if (base) perCat[cat] = (perCat[cat] || 0) + 1;
      var on = base && (state.cat === 'all' || state.cat === cat);
      c._name.innerHTML = on ? highlight(c._nameHtml, words) : c._nameHtml;
      c._desc.innerHTML = on ? highlight(c._descHtml, words) : c._descHtml;
      c.classList.remove('is-best');
      if (on) {
        shown++;
        if (words.length && scores[i] > bestScore) { bestScore = scores[i]; best = c; }
        c.style.setProperty('--i', order++);
        if (c.hidden) { c.hidden = false; c.classList.remove('is-in'); void c.offsetWidth; }
        c.classList.add('is-in');
      } else {
        c.hidden = true;
      }
      c._item.hidden = c.hidden;
    });
    if (best) best.classList.add('is-best');
    sortByRelevance(words.length ? scores : null);
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
    [].forEach.call(panel.querySelectorAll('.svx-who-chip'), function (x) {
      x.setAttribute('aria-pressed', x.getAttribute('data-who') === state.who ? 'true' : 'false');
    });
    empty.hidden = shown !== 0;
    clearBtn.hidden = !state.q;
    var whoName = state.who ? AUDIENCES.filter(function (a) { return a[0] === state.who; })[0][1].toLowerCase().replace(/^an? /, '') : '';
    var parts = [];
    if (state.q) parts.push('matching &ldquo;' + state.q.replace(/</g, '&lt;') + '&rdquo;');
    if (state.who) parts.push('for ' + whoName);
    statusEl.innerHTML = 'Showing <strong>' + shown + '</strong> of ' + cards.length + ' services' + (parts.length ? ' ' + parts.join(' ') : '');
    updateBar(shown, best, whoName);
    syncUrl();
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
    apply();
  });
  panel.querySelector('.svx-pop').addEventListener('click', function (e) {
    var b = e.target.closest('.svx-pop-chip'); if (!b) return;
    var q = b.getAttribute('data-q');
    input.value = state.q === q ? '' : q; state.q = input.value; apply();
  });
  tabs.querySelector('.svx-tabs').addEventListener('click', function (e) {
    var b = e.target.closest('.svx-tab'); if (!b) return;
    state.cat = b.getAttribute('data-cat');
    apply();
  });
  /* ---------------------------------------------------------- guided wizard */
  var GOALS = [
    ['Filing returns or tax planning', { cat: 'tax' }],
    ['Registering a business, trust or licence', { cat: 'reg' }],
    ['Reply to a tax notice or appeal', { q: 'notice' }],
    ['An audit of my accounts', { cat: 'audit' }],
    ['Keeping books and financial reports', { cat: 'acc' }],
    ['A loan or project report', { q: 'loan' }]
  ];
  var wiz = panel.querySelector('.svx-wizard');
  var inner = panel.querySelector('.svx-finder-inner');
  var wizState = { who: null };
  function wizShow(step) {
    inner.hidden = step === 0; wiz.hidden = step === 0;
    if (step === 0) return;
    var h = '<p class="svx-kicker">Guide me &middot; Step ' + step + ' of 2</p><div class="svx-wiz-bar"><i style="width:' + (step * 50) + '%"></i></div>';
    if (step === 1) {
      h += '<h2 class="svx-finder-title">Who is this for?</h2><div class="svx-wiz-opts">' + AUDIENCES.map(function (a) {
        return '<button type="button" class="svx-wiz-opt" data-who="' + a[0] + '">' + svg(ICON[a[0]]) + '<span>' + a[1] + '</span></button>';
      }).join('') + '</div>';
    } else {
      h += '<h2 class="svx-finder-title">What do you need?</h2><div class="svx-wiz-opts">' + GOALS.map(function (g, i) {
        return '<button type="button" class="svx-wiz-opt" data-goal="' + i + '"><span>' + g[0] + '</span></button>';
      }).join('') + '</div>';
    }
    h += '<div class="svx-wiz-foot">' + (step === 2 ? '<button type="button" class="svx-wiz-link" data-act="back">&larr; Back</button>' : '') +
      '<button type="button" class="svx-wiz-link" data-act="close">Close guide</button></div>';
    wiz.innerHTML = h;
    var first = wiz.querySelector('.svx-wiz-opt'); if (first) first.focus();
  }
  panel.querySelector('.svx-guide-btn').addEventListener('click', function () { wizShow(1); });
  wiz.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    if (b.getAttribute('data-act') === 'close') return wizShow(0);
    if (b.getAttribute('data-act') === 'back') return wizShow(1);
    if (b.hasAttribute('data-who')) { wizState.who = b.getAttribute('data-who'); return wizShow(2); }
    if (b.hasAttribute('data-goal')) {
      var g = GOALS[+b.getAttribute('data-goal')][1];
      state = { q: g.q || '', who: wizState.who, cat: g.cat || 'all' };
      input.value = state.q;
      wizShow(0); apply();
      var target = tabs.getBoundingClientRect().top + window.pageYOffset - 90;
      window.scrollTo({ top: target, behavior: reduceMotion ? 'auto' : 'smooth' });
    }
  });
  wiz.addEventListener('keydown', function (e) { if (e.key === 'Escape') { wizShow(0); panel.querySelector('.svx-guide-btn').focus(); } });

  function resetAll() { input.value = ''; state = { q: '', who: null, cat: 'all' }; apply(); }
  [].forEach.call(root.querySelectorAll('.svx-reset'), function (b) { b.addEventListener('click', resetAll); });

  // Arrow keys move between results; ArrowUp from the first card returns to search.
  root.addEventListener('keydown', function (e) {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    var cur = e.target.closest && e.target.closest('.svx-card'); if (!cur) return;
    var vis = [].slice.call(root.querySelectorAll('.svx-card:not([hidden])'));
    var next = vis[vis.indexOf(cur) + (e.key === 'ArrowDown' ? 1 : -1)];
    e.preventDefault();
    if (next) next.focus(); else if (e.key === 'ArrowUp') input.focus();
  });

  if (!reduceMotion) {
    // Cursor spotlight on cards and the finder panel.
    root.addEventListener('pointermove', function (e) {
      var host = e.target.closest && e.target.closest('.svx-card, .svx-finder'); if (!host) return;
      var r = host.getBoundingClientRect();
      host.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      host.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
    // Rotating example searches while the box is idle.
    var pi = 0;
    setInterval(function () {
      if (document.activeElement === input || input.value) return;
      pi = (pi + 1) % PLACEHOLDERS.length;
      input.placeholder = 'Try “' + PLACEHOLDERS[pi] + '”';
    }, 2800);
  }

  // Category bar sticks under the header; mark it once pinned.
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) {
      tabs.classList.toggle('is-stuck', !en[0].isIntersecting && en[0].boundingClientRect.top < 0);
    }, { rootMargin: '-72px 0px 0px 0px' }).observe(sentinel);
  }

  // Restore a shared state from the URL (services.html?q=notice&who=company&cat=tax).
  location.search.slice(1).split('&').forEach(function (kv) {
    var a = kv.split('='), v = '';
    try { v = decodeURIComponent((a[1] || '').replace(/\+/g, ' ')); } catch (err) {}
    if (a[0] === 'q' && v) { state.q = v.slice(0, 80); input.value = state.q; }
    if (a[0] === 'who' && WHO_KEYS.indexOf(v) !== -1) state.who = v;
    if (a[0] === 'cat' && CAT_KEYS.indexOf(v) !== -1) state.cat = v;
  });

  /* ---------------------------------------------------------- hero stats + reveal */
  var heroBox = document.querySelector('.page-hero .container');
  if (heroBox) {
    var stats = [[cards.length, 'services'], [groups.length, 'practice areas'], [AUDIENCES.length, 'types of client']];
    var strip = document.createElement('div');
    strip.className = 'svx-hero-extra';
    strip.innerHTML = '<ul class="svx-stats">' + stats.map(function (s) {
      return '<li><b data-to="' + s[0] + '">0</b><span>' + s[1] + '</span></li>';
    }).join('') + '</ul><a class="btn btn-primary svx-hero-cta" href="#serviceExplorer">' + svg(ICON.search) + 'Find my service</a>';
    heroBox.appendChild(strip);
    strip.querySelector('.svx-hero-cta').addEventListener('click', function (e) {
      e.preventDefault();
      panel.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
      setTimeout(function () { input.focus({ preventScroll: true }); }, reduceMotion ? 0 : 450);
    });
    [].forEach.call(strip.querySelectorAll('b'), function (b) {
      var to = +b.getAttribute('data-to'), t0 = null;
      if (reduceMotion) { b.textContent = to; return; }
      requestAnimationFrame(function step(ts) {
        if (t0 === null) t0 = ts;
        var p = Math.min((ts - t0) / 900, 1);
        b.textContent = Math.round(to * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(step);
      });
    });
  }

  // Groups fade up as they scroll into view (content stays visible if observers are unavailable).
  if ('IntersectionObserver' in window && !reduceMotion) {
    root.classList.add('svx-reveal');
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add('is-vis'); io.unobserve(x.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    groups.forEach(function (g) { io.observe(g); });
    setTimeout(function () { groups.forEach(function (g) { g.classList.add('is-vis'); }); }, 2500);
  }

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
