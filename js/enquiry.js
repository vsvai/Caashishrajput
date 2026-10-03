// Contact page enquiry form. The site has no backend: the form composes a
// message that the visitor sends from their own WhatsApp or email app.
(function () {
  var form = document.getElementById('leadForm');
  if (!form) return;

  var WA_NUMBER = '918802586988';
  var EMAIL = 'ca.ashishrajput@outlook.com';
  var status = document.getElementById('formStatus');

  // Pre-select a service when arriving from a service page (contact.html?service=GST#enquiry).
  var params = new URLSearchParams(window.location.search);
  var preset = params.get('service');
  if (preset) {
    form.querySelectorAll('input[name="services"]').forEach(function (cb) {
      if (cb.value === preset) cb.checked = true;
    });
  }

  var rules = {
    leadName: function (v) { return v ? '' : 'Please enter your name.'; },
    leadPhone: function (v) {
      if (!v) return 'Please enter a phone number so the office can reach you.';
      return /^[+\d][\d\s-]{7,16}$/.test(v) ? '' : 'Please enter a valid phone number, e.g. 98100 12345.';
    },
    leadEmail: function (v) { return !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? '' : 'Please check the email address.'; },
    leadMessage: function (v) { return v ? '' : 'Please describe your requirement in a line or two.'; }
  };

  function setError(id, msg) {
    var field = document.getElementById(id);
    var out = document.getElementById(id + '-error');
    if (field) field.setAttribute('aria-invalid', msg ? 'true' : 'false');
    if (out) out.textContent = msg;
  }

  function validate() {
    var firstBad = null;
    Object.keys(rules).forEach(function (id) {
      var msg = rules[id](document.getElementById(id).value.trim());
      setError(id, msg);
      if (msg && !firstBad) firstBad = document.getElementById(id);
    });
    var consent = document.getElementById('dpdpConsent');
    var cMsg = consent.checked ? '' : 'Please confirm consent so the office can use your details to reply.';
    setError('dpdpConsent', cMsg);
    if (cMsg && !firstBad) firstBad = consent;
    return firstBad;
  }

  Object.keys(rules).forEach(function (id) {
    document.getElementById(id).addEventListener('blur', function () {
      if (this.getAttribute('aria-invalid') === 'true') setError(id, rules[id](this.value.trim()));
    });
  });

  function buildMessage() {
    var v = function (id) { return document.getElementById(id).value.trim(); };
    var services = [];
    form.querySelectorAll('input[name="services"]:checked').forEach(function (cb) { services.push(cb.value); });
    var msg = 'Hello, I would like to discuss a requirement with your office.\n';
    if (services.length) msg += '\nService(s): ' + services.join(', ');
    msg += '\nName: ' + v('leadName') + '\nPhone: ' + v('leadPhone');
    if (v('leadEmail')) msg += '\nEmail: ' + v('leadEmail');
    msg += '\n\nRequirement: ' + v('leadMessage') + '\n\n(Sent via caashishrajput.com)';
    return msg;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var channel = (e.submitter && e.submitter.getAttribute('data-channel')) || 'whatsapp';
    var bad = validate();
    if (bad) {
      status.className = 'form-status is-error';
      status.textContent = 'Please correct the highlighted fields.';
      bad.focus();
      return;
    }
    var msg = buildMessage();
    if (channel === 'email') {
      var subject = 'Enquiry from ' + document.getElementById('leadName').value.trim() + ' (caashishrajput.com)';
      window.location.href = 'mailto:' + EMAIL + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(msg);
      status.textContent = 'Your email app should now open with the message ready. Please press send there. If nothing opened, write to ' + EMAIL + '.';
    } else {
      window.open('https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(msg), '_blank', 'noopener');
      status.textContent = 'WhatsApp should now open with your message ready. Please press send there. If it did not open, call +91 88025 86988.';
    }
    status.className = 'form-status is-ok';
    if (window.dataLayer && typeof window.dataLayer.push === 'function') {
      window.dataLayer.push({ event: 'enquiry_submit', contact_method: channel });
    }
  });
})();
