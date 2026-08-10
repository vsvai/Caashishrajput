// Mobile nav toggle
document.addEventListener('DOMContentLoaded', function() {
  var navToggle = document.querySelector('.nav-toggle');
  var nav = document.querySelector('.nav');

  if (navToggle && nav) {
    nav.querySelectorAll('a').forEach(function(link) {
      link.addEventListener('click', function() {
        nav.classList.remove('open');
      });
    });

    document.addEventListener('click', function(e) {
      if (!nav.contains(e.target) && !navToggle.contains(e.target)) {
        nav.classList.remove('open');
      }
    });
  }

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
    anchor.addEventListener('click', function(e) {
      var target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // Services accordion: click/tap toggles a category independently
  document.querySelectorAll('.acc-group').forEach(function(group) {
    var head = group.querySelector('.acc-head');
    var body = group.querySelector('.acc-body');
    if (!head || !body) return;
    head.addEventListener('click', function() {
      var open = group.classList.toggle('pinned');
      head.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  });

  // Deep-link: expand + scroll to a specific service row (services.html#svc-...)
  var hash = window.location.hash ? window.location.hash.slice(1) : '';
  if (hash) {
    var row = document.getElementById(hash);
    if (row && row.classList.contains('acc-item')) {
      var group = row.closest('.acc-group');
      if (group) {
        group.classList.add('pinned');
        var h = group.querySelector('.acc-head');
        if (h) h.setAttribute('aria-expanded', 'true');
      }
      setTimeout(function() {
        row.scrollIntoView({ behavior: 'smooth', block: 'center' });
        row.classList.add('acc-item-flash');
      }, 150);
    }
  }

  // Blog category filters
  var filters = document.querySelector('.category-filters');
  if (filters) {
    var cards = Array.prototype.slice.call(document.querySelectorAll('.blog-listing-card'));
    var empty = document.createElement('p');
    empty.className = 'blog-empty';
    empty.textContent = 'No posts in this category yet.';
    empty.style.display = 'none';
    filters.parentNode.insertBefore(empty, filters.nextSibling);

    filters.querySelectorAll('a').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        var cat = this.textContent.trim();
        var isAll = cat === 'All';
        var visible = 0;
        filters.querySelectorAll('a').forEach(function(b) { b.classList.toggle('active', b === btn); });
        cards.forEach(function(card) {
          var tag = card.querySelector('.blog-category');
          var match = isAll || (tag && tag.textContent.trim() === cat);
          card.style.display = match ? '' : 'none';
          if (match) visible++;
        });
        empty.style.display = visible ? 'none' : '';
      });
    });
  }

  // Homepage logo slideshow
  document.querySelectorAll('[data-slideshow]').forEach(function(slideshow) {
    var slides = slideshow.querySelectorAll('.slideshow-slide');
    var dots = slideshow.querySelectorAll('.slideshow-dot');
    var prev = slideshow.querySelector('.slideshow-prev');
    var next = slideshow.querySelector('.slideshow-next');
    if (!slides.length) return;
    var idx = 0;
    var timer = null;

    function go(i) {
      idx = (i + slides.length) % slides.length;
      slides.forEach(function(s, j) { s.classList.toggle('is-active', j === idx); });
      dots.forEach(function(d, j) { d.classList.toggle('is-active', j === idx); });
    }

    function restart() {
      if (timer) clearInterval(timer);
      timer = setInterval(function() { go(idx + 1); }, 4000);
    }

    if (prev) prev.addEventListener('click', function() { go(idx - 1); restart(); });
    if (next) next.addEventListener('click', function() { go(idx + 1); restart(); });
    dots.forEach(function(d, j) {
      d.addEventListener('click', function() { go(j); restart(); });
    });
    slideshow.addEventListener('mouseenter', function() { if (timer) clearInterval(timer); });
    slideshow.addEventListener('mouseleave', restart);
    slideshow.addEventListener('focusin', function() { if (timer) clearInterval(timer); });
    slideshow.addEventListener('focusout', restart);
    restart();
  });
});
