// js/faq.js — FAQ accordion behaviour: single-open, smooth height animation,
// URL-hash deep-linking, and ARIA state. Replaces the old FAQ animation that
// lived in main.js.
(function() {
  'use strict';

  function setExpanded(details, open) {
    var summary = details.querySelector('summary');
    if (summary) summary.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  function animate(details, open) {
    var answer = details.querySelector('.faq-answer');
    if (!answer) return;

    if (open) {
      details.setAttribute('open', '');
      setExpanded(details, true);
      answer.style.overflow = 'hidden';
      answer.style.maxHeight = '0';
      void answer.offsetHeight; // force reflow so the transition runs
      answer.style.transition = 'max-height 0.3s ease';
      answer.style.maxHeight = answer.scrollHeight + 'px';
      setTimeout(function() {
        answer.style.overflow = '';
        answer.style.maxHeight = '';
        answer.style.transition = '';
      }, 320);
    } else {
      answer.style.overflow = 'hidden';
      answer.style.transition = 'max-height 0.25s ease';
      answer.style.maxHeight = answer.scrollHeight + 'px';
      void answer.offsetHeight;
      answer.style.maxHeight = '0';
      setTimeout(function() {
        details.removeAttribute('open');
        setExpanded(details, false);
        answer.style.overflow = '';
        answer.style.maxHeight = '';
        answer.style.transition = '';
      }, 260);
    }
  }

  function closeAllExcept(details) {
    document.querySelectorAll('.faq-item').forEach(function(other) {
      if (other !== details && other.hasAttribute('open')) {
        animate(other, false);
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.faq-item').forEach(function(details) {
      var summary = details.querySelector('summary');
      if (!summary) return;
      setExpanded(details, details.hasAttribute('open'));
      summary.addEventListener('click', function(e) {
        e.preventDefault();
        var opening = !details.hasAttribute('open');
        closeAllExcept(details);
        animate(details, opening);
      });
    });

    // Deep-link: open and scroll to the FAQ item matching the URL hash.
    var hash = window.location.hash;
    if (hash) {
      var target = document.querySelector(hash);
      if (target && target.classList.contains('faq-item')) {
        closeAllExcept(target);
        animate(target, true);
        setTimeout(function() {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 150);
      }
    }
  });
})();
