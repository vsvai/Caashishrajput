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

  // FAQ toggle animation
  document.querySelectorAll('.faq-item summary').forEach(function(summary) {
    summary.addEventListener('click', function() {
      var details = this.parentElement;
      var answer = details.querySelector('.faq-answer');
      if (answer) {
        if (details.open) {
          answer.style.maxHeight = answer.scrollHeight + 'px';
          requestAnimationFrame(function() {
            answer.style.maxHeight = '0';
            answer.style.overflow = 'hidden';
            answer.style.transition = 'max-height 0.25s ease';
          });
        } else {
          answer.style.overflow = 'hidden';
          answer.style.maxHeight = '0';
          requestAnimationFrame(function() {
            answer.style.transition = 'max-height 0.3s ease';
            answer.style.maxHeight = answer.scrollHeight + 'px';
            setTimeout(function() {
              answer.style.overflow = '';
              answer.style.maxHeight = '';
            }, 300);
          });
        }
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
});
