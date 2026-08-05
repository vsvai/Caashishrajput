// js/components.js — Shared header, footer, WhatsApp button, and breadcrumbs
(function() {
  var body = document.body;
  var depth = parseInt(body.getAttribute('data-depth') || '0', 10);
  var prefix = depth === 0 ? '' : '../'.repeat(depth);
  var active = body.getAttribute('data-active') || '';

  // Header
  var header = document.createElement('header');
  header.className = 'header';
  header.innerHTML = '<div class="container">' +
    '<a href="' + prefix + 'index.html" class="logo">' +
      '<img src="' + prefix + 'images/logo.webp" alt="Ashish Jayalata & Associates Logo" width="36" height="36">' +
      '<span class="logo-text">Ashish Jayalata <span>&amp; Associates</span></span>' +
    '</a>' +
    '<button class="nav-toggle" aria-label="Menu" onclick="document.querySelector(\'.nav\').classList.toggle(\'open\')">' +
      '<svg class="icon-svg" viewBox="0 0 24 24"><path d="M3 12h18M3 6h18M3 18h18"/></svg>' +
    '</button>' +
    '<nav class="nav">' +
      '<a href="' + prefix + 'index.html"' + (active === 'home' ? ' class="active"' : '') + '>Home</a>' +
      '<a href="' + prefix + 'about.html"' + (active === 'about' ? ' class="active"' : '') + '>About</a>' +
      '<a href="' + prefix + 'services.html"' + (active === 'services' ? ' class="active"' : '') + '>Services</a>' +
      '<a href="' + prefix + 'blog.html"' + (active === 'blog' ? ' class="active"' : '') + '>Blog</a>' +
      '<a href="' + prefix + 'resources.html"' + (active === 'resources' ? ' class="active"' : '') + '>Resources</a>' +
      '<a href="' + prefix + 'contact.html"' + (active === 'contact' ? ' class="active"' : '') + '>Contact</a>' +
      '<a href="tel:+918802586988" class="nav-cta">' +
        '<svg class="icon-svg" viewBox="0 0 24 24" style="width:1em;height:1em;"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>' +
        'Call Now' +
      '</a>' +
    '</nav>' +
  '</div>';
  body.insertBefore(header, body.firstChild);

  // Breadcrumbs
  var bcData = body.getAttribute('data-breadcrumbs');
  if (bcData) {
    var crumbs = JSON.parse(bcData);
    var bc = document.createElement('nav');
    bc.className = 'breadcrumbs';
    bc.setAttribute('aria-label', 'Breadcrumb');
    var bcHtml = '<div class="container"><ol itemscope itemtype="https://schema.org/BreadcrumbList">';
    crumbs.forEach(function(c, i) {
      bcHtml += '<li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">';
      if (c.href) {
        bcHtml += '<a itemprop="item" href="' + prefix + c.href + '"><span itemprop="name">' + c.label + '</span></a>';
      } else {
        bcHtml += '<span itemprop="name">' + c.label + '</span>';
      }
      bcHtml += '<meta itemprop="position" content="' + (i + 1) + '">';
      bcHtml += '</li>';
      if (i < crumbs.length - 1) bcHtml += '<li class="bc-sep" aria-hidden="true">&rsaquo;</li>';
    });
    bcHtml += '</ol></div>';
    bc.innerHTML = bcHtml;
    // Insert after first section or after header
    var firstSection = body.querySelector('.page-hero, .hero, section');
    if (firstSection) {
      body.insertBefore(bc, firstSection.nextSibling);
    } else {
      body.appendChild(bc);
    }
  }

  // Footer
  var footer = document.createElement('footer');
  footer.className = 'footer';
  footer.innerHTML = '<div class="container">' +
    '<div class="footer-grid">' +
      '<div>' +
        '<img src="' + prefix + 'images/logo.webp" alt="Ashish Jayalata & Associates" class="footer-logo" width="40" height="40">' +
        '<h4>Ashish Jayalata &amp; Associates</h4>' +
        '<p>Chartered Accountant based in Sahibabad, Ghaziabad. Providing income tax, GST, audit, accounting, and company registration services for individuals and businesses.</p>' +
        '<p class="disclaimer">The information on this website is for general informational purposes only and does not constitute professional advice. It is not intended to solicit clients or advertise professional attainments. Visitors are advised to seek independent professional advice before acting on any information herein.</p>' +
      '</div>' +
      '<div>' +
        '<h4>Quick Links</h4>' +
        '<ul class="footer-links">' +
          '<li><a href="' + prefix + 'index.html">Home</a></li>' +
          '<li><a href="' + prefix + 'about.html">About</a></li>' +
          '<li><a href="' + prefix + 'services.html">Services</a></li>' +
          '<li><a href="' + prefix + 'blog.html">Blog</a></li>' +
          '<li><a href="' + prefix + 'resources.html">Resources</a></li>' +
          '<li><a href="' + prefix + 'contact.html">Contact</a></li>' +
          '<li><a href="' + prefix + 'index.html#reviews">Client Feedback</a></li>' +
        '</ul>' +
      '</div>' +
      '<div>' +
        '<h4>Services</h4>' +
        '<ul class="footer-links">' +
          '<li><a href="' + prefix + 'services/income-tax.html">Income Tax</a></li>' +
          '<li><a href="' + prefix + 'services/gst.html">GST</a></li>' +
          '<li><a href="' + prefix + 'services/statutory-audit.html">Statutory Audit</a></li>' +
          '<li><a href="' + prefix + 'services/internal-audit.html">Internal Audit</a></li>' +
          '<li><a href="' + prefix + 'services/tax-audit.html">Tax Audit</a></li>' +
          '<li><a href="' + prefix + 'services/company-llp-registration.html">Company &amp; LLP Registration</a></li>' +
          '<li><a href="' + prefix + 'services/accounting-bookkeeping.html">Accounting &amp; Bookkeeping</a></li>' +
          '<li><a href="' + prefix + 'services/business-advisory.html">Business Advisory</a></li>' +
          '<li><a href="' + prefix + 'services.html#more">View all &rarr;</a></li>' +
        '</ul>' +
      '</div>' +
      '<div>' +
        '<h4>Important Links</h4>' +
        '<ul class="footer-links">' +
          '<li><a href="https://www.icai.org" target="_blank" rel="noopener">ICAI</a></li>' +
          '<li><a href="https://www.incometax.gov.in" target="_blank" rel="noopener">Income Tax e-Filing</a></li>' +
          '<li><a href="https://www.gst.gov.in" target="_blank" rel="noopener">GST Portal</a></li>' +
          '<li><a href="https://www.dgft.gov.in" target="_blank" rel="noopener">DGFT</a></li>' +
          '<li><a href="https://www.epfindia.gov.in" target="_blank" rel="noopener">EPFO (PF)</a></li>' +
          '<li><a href="https://www.esic.gov.in" target="_blank" rel="noopener">ESIC (ESI)</a></li>' +
          '<li><a href="https://www.mca.gov.in" target="_blank" rel="noopener">MCA</a></li>' +
          '<li><a href="https://www.tdscpc.gov.in" target="_blank" rel="noopener">TRACES (TDS)</a></li>' +
        '</ul>' +
      '</div>' +
      '<div>' +
        '<h4>Connect</h4>' +
        '<ul class="footer-links">' +
          '<li><a href="https://www.instagram.com/aja_ghaziabad/" target="_blank" rel="noopener"><svg class="icon-svg" viewBox="0 0 24 24" style="width:1em;height:1em;margin-right:0.35em;vertical-align:-0.15em;"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>Instagram</a></li>' +
          '<li><a href="https://www.facebook.com/ajaca2023" target="_blank" rel="noopener"><svg class="icon-svg" viewBox="0 0 24 24" style="width:1em;height:1em;margin-right:0.35em;vertical-align:-0.15em;"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg>Facebook</a></li>' +
          '<li><a href="https://www.linkedin.com/company/aja-ca" target="_blank" rel="noopener"><svg class="icon-svg" viewBox="0 0 24 24" style="width:1em;height:1em;margin-right:0.35em;vertical-align:-0.15em;"><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>LinkedIn</a></li>' +
          '<li><a href="https://wa.me/918802586988" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" style="width:1em;height:1em;fill:currentColor;margin-right:0.35em;vertical-align:-0.15em;"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>WhatsApp</a></li>' +
        '</ul>' +
      '</div>' +
    '</div>' +
    '<div class="footer-bottom">' +
      '<span>&copy; 2026 Ashish Jayalata &amp; Associates. All rights reserved.</span>' +
      '<span><a href="https://www.icai.org" target="_blank" rel="noopener">icai.org</a> | <a href="' + prefix + 'pages/privacy-policy.html">Privacy Policy</a></span>' +
    '</div>' +
  '</div>';
  body.appendChild(footer);

  // WhatsApp Floating Button
  var wa = document.createElement('a');
  wa.href = 'https://wa.me/918802586988?text=' + encodeURIComponent('Hi, I would like to enquire about CA services.');
  wa.className = 'whatsapp-float';
  wa.target = '_blank';
  wa.rel = 'noopener';
  wa.setAttribute('aria-label', 'Chat on WhatsApp');
  wa.innerHTML = '<svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>';
  body.appendChild(wa);

  // Update nav active state for service sub-pages
  if (active === 'services') {
    // Already handled by data-active="services"
  }
})();
