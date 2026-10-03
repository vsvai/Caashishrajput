document.addEventListener('DOMContentLoaded', function () {
  // Mobile nav: button toggles the menu, keeps aria-expanded in sync,
  // closes on link click, outside click and Escape.
  var navToggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('site-nav') || document.querySelector('.nav');

  function setNav(open) {
    if (!nav || !navToggle) return;
    nav.classList.toggle('open', open);
    navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }

  if (navToggle && nav) {
    navToggle.addEventListener('click', function () { setNav(!nav.classList.contains('open')); });
    nav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () { setNav(false); });
    });
    document.addEventListener('click', function (e) {
      if (nav.classList.contains('open') && !nav.contains(e.target) && !navToggle.contains(e.target)) setNav(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('open')) { setNav(false); navToggle.focus(); }
    });
  }

  // Blog category filters
  var filters = document.querySelector('.category-filters');
  if (filters) {
    var cards = Array.prototype.slice.call(document.querySelectorAll('.blog-listing-card'));
    var empty = document.createElement('p');
    empty.className = 'blog-empty';
    empty.textContent = 'No posts in this category yet.';
    empty.hidden = true;
    empty.setAttribute('role', 'status');
    filters.parentNode.insertBefore(empty, filters.nextSibling);

    filters.querySelectorAll('a').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        var cat = this.textContent.trim();
        var isAll = cat === 'All';
        var visible = 0;
        filters.querySelectorAll('a').forEach(function (b) {
          b.classList.toggle('active', b === btn);
          b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
        });
        cards.forEach(function (card) {
          var tag = card.querySelector('.blog-category');
          var match = isAll || (tag && tag.textContent.trim() === cat);
          card.style.display = match ? '' : 'none';
          if (match) visible++;
        });
        empty.hidden = visible !== 0;
      });
    });
  }

  // Click-to-load map: the Google Maps iframe (~1 MB of third-party script)
  // loads only when a visitor asks for it.
  document.querySelectorAll('[data-map-src]').forEach(function (facade) {
    var btn = facade.querySelector('[data-map-load]');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var frame = document.createElement('iframe');
      frame.className = 'map-frame';
      frame.src = facade.getAttribute('data-map-src');
      frame.title = facade.getAttribute('data-map-title') || 'Office location on Google Maps';
      frame.setAttribute('allowfullscreen', '');
      frame.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');
      facade.replaceWith(frame);
    });
  });

  // Contact intent hooks. Nothing is sent anywhere unless an analytics tag
  // that defines window.dataLayer or window.gtag is added to the site later.
  document.addEventListener('click', function (e) {
    var el = e.target.closest ? e.target.closest('a[href^="tel:"], a[href^="mailto:"], a[href*="wa.me/"], [data-track]') : null;
    if (!el) return;
    var type = el.getAttribute('data-track') ||
      (/^tel:/.test(el.getAttribute('href') || '') ? 'phone' :
        /^mailto:/.test(el.getAttribute('href') || '') ? 'email' : 'whatsapp');
    var detail = { event: 'contact_click', contact_method: type, page_path: location.pathname };
    if (window.dataLayer && typeof window.dataLayer.push === 'function') window.dataLayer.push(detail);
    else if (typeof window.gtag === 'function') window.gtag('event', 'contact_click', { contact_method: type });
  });
});
