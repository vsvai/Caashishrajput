// scripts/lib/site-chrome.js — shared header, breadcrumbs, footer and WhatsApp
// button, written straight into each page's HTML.
//
// These used to be injected in the browser by js/components.js. Static markup
// means search engines and visitors without JavaScript see the full navigation
// and the NAP <address> block on first load, with no flash of missing header.
//
// This file is the single source for that markup. Pages keep their
// data-depth / data-active / data-breadcrumbs attributes on <body>; stamp()
// reads them and (re)writes the blocks between <!--chrome:*--> markers, so it
// is safe to run any number of times. To change the menu or footer, edit this
// file and run:  npm run chrome

const MARK = {
  header: ['<!--chrome:header-->', '<!--/chrome:header-->'],
  breadcrumbs: ['<!--chrome:breadcrumbs-->', '<!--/chrome:breadcrumbs-->'],
  footer: ['<!--chrome:footer-->', '<!--/chrome:footer-->']
};

const WHATSAPP_PATH = 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z';

const NAV = [
  ['home', 'index.html', 'Home'],
  ['about', 'about.html', 'About'],
  ['services', 'services.html', 'Services'],
  ['blog', 'blog.html', 'Blog'],
  ['career', 'career/index.html', 'Careers'],
  ['resources', 'resources.html', 'Resources'],
  ['contact', 'contact.html', 'Contact']
];

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function decodeAttr(s) {
  return s.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
}

function headerHtml(p, active) {
  const links = NAV.map(function (n) {
    return '<a href="' + p + n[1] + '"' + (active === n[0] ? ' class="active"' : '') + '>' + n[2] + '</a>';
  }).join('\n      ');
  return '<header class="header">\n' +
    '  <div class="container">\n' +
    '    <a href="' + p + 'index.html" class="logo">' +
      '<img src="' + p + 'images/logo.webp" alt="Ashish Jayalata &amp; Associates Logo" width="36" height="36">' +
      '<span class="logo-text">Ashish Jayalata <span>&amp; Associates</span></span></a>\n' +
    '    <button class="nav-toggle" aria-label="Menu" onclick="document.querySelector(\'.nav\').classList.toggle(\'open\')">' +
      '<svg class="icon-svg" viewBox="0 0 24 24"><path d="M3 12h18M3 6h18M3 18h18"/></svg></button>\n' +
    '    <nav class="nav">\n      ' + links + '\n' +
    '      <a href="tel:+918802586988" class="nav-cta"><svg class="icon-svg" viewBox="0 0 24 24" style="width:1em;height:1em;"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>Call Now</a>\n' +
    '    </nav>\n' +
    '  </div>\n' +
    '</header>';
}

function breadcrumbsHtml(p, crumbs) {
  const items = [];
  crumbs.forEach(function (c, i) {
    let li = '<li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">';
    if (c.href) {
      // Crumb hrefs are root-relative; drop any "../" an author already added
      // so the depth prefix is not applied twice.
      li += '<a itemprop="item" href="' + p + esc(c.href.replace(/^(\.\.\/)+/, '')) + '"><span itemprop="name">' + esc(c.label) + '</span></a>';
    } else {
      li += '<span itemprop="name">' + esc(c.label) + '</span>';
    }
    li += '<meta itemprop="position" content="' + (i + 1) + '"></li>';
    items.push(li);
    if (i < crumbs.length - 1) items.push('<li class="bc-sep" aria-hidden="true">&rsaquo;</li>');
  });
  return '<nav class="breadcrumbs" aria-label="Breadcrumb">\n' +
    '  <div class="container"><ol itemscope itemtype="https://schema.org/BreadcrumbList">\n    ' +
    items.join('\n    ') + '\n  </ol></div>\n' +
    '</nav>';
}

const SOCIAL_ICON = 'class="icon-svg" viewBox="0 0 24 24" style="width:1em;height:1em;margin-right:0.35em;vertical-align:-0.15em;"';

function footerHtml(p) {
  const li = function (href, text, external) {
    return '<li><a href="' + href + '"' + (external ? ' target="_blank" rel="noopener"' : '') + '>' + text + '</a></li>';
  };
  return '<footer class="footer">\n' +
    '  <div class="container">\n' +
    '    <div class="footer-grid">\n' +
    '      <div>\n' +
    '        <img src="' + p + 'images/logo.webp" alt="Ashish Jayalata &amp; Associates" class="footer-logo" width="40" height="40">\n' +
    '        <h4>Ashish Jayalata &amp; Associates</h4>\n' +
    '        <p>Chartered Accountant based in Sahibabad, Ghaziabad. Providing income tax, GST, audit, accounting, and company registration services for individuals and businesses.</p>\n' +
    '        <address class="nap" style="font-style:normal; line-height:1.8; margin-top:1rem;">' +
          '<strong class="nap-name">Ashish Jayalata &amp; Associates</strong><br>' +
          '<span class="nap-street">LG-3, S-14, Krishna Plaza</span><br>' +
          '<span class="nap-locality">Vrindavan Garden, Sahibabad</span><br>' +
          '<span class="nap-region">Ghaziabad, Uttar Pradesh 201005</span><br>' +
          'Phone: <a href="tel:+918802586988" class="nap-phone">+91 88025 86988</a><br>' +
          'Email: <a href="mailto:ca.ashishrajput@outlook.com" class="nap-email">ca.ashishrajput@outlook.com</a><br>' +
          'Hours: Monday &ndash; Saturday, 10:00 AM &ndash; 7:00 PM</address>\n' +
    '        <p class="disclaimer">The information on this website is for general informational purposes only and does not constitute professional advice. It is not intended to solicit clients or advertise professional attainments. Visitors are advised to seek independent professional advice before acting on any information herein.</p>\n' +
    '      </div>\n' +
    '      <div>\n        <h4>Quick Links</h4>\n        <ul class="footer-links">' + [
      li(p + 'index.html', 'Home'), li(p + 'about.html', 'About'), li(p + 'services.html', 'Services'),
      li(p + 'blog.html', 'Blog'), li(p + 'career/index.html', 'Careers'), li(p + 'resources.html', 'Resources'),
      li(p + 'contact.html', 'Contact'), li(p + 'index.html#reviews', 'Client Feedback')
    ].join('') + '</ul>\n      </div>\n' +
    '      <div>\n        <h4>Services</h4>\n        <ul class="footer-links">' + [
      li(p + 'services/income-tax.html', 'Income Tax'), li(p + 'services/gst.html', 'GST'),
      li(p + 'services/statutory-audit.html', 'Statutory Audit'), li(p + 'services/internal-audit.html', 'Internal Audit'),
      li(p + 'services/tax-audit.html', 'Tax Audit'), li(p + 'services/company-llp-registration.html', 'Company &amp; LLP Registration'),
      li(p + 'services/accounting-bookkeeping.html', 'Accounting &amp; Bookkeeping'), li(p + 'services/business-advisory.html', 'Business Advisory'),
      li(p + 'services.html#more', 'View all &rarr;')
    ].join('') + '</ul>\n      </div>\n' +
    '      <div>\n        <h4>Important Links</h4>\n        <ul class="footer-links">' + [
      li('https://www.icai.org', 'ICAI', true), li('https://www.incometax.gov.in', 'Income Tax e-Filing', true),
      li('https://www.gst.gov.in', 'GST Portal', true), li('https://www.dgft.gov.in', 'DGFT', true),
      li('https://www.epfindia.gov.in', 'EPFO (PF)', true), li('https://www.esic.gov.in', 'ESIC (ESI)', true),
      li('https://www.mca.gov.in', 'MCA', true), li('https://www.tdscpc.gov.in', 'TRACES (TDS)', true)
    ].join('') + '</ul>\n      </div>\n' +
    '      <div>\n        <h4>Connect</h4>\n        <ul class="footer-links">' + [
      li('https://www.instagram.com/aja_ghaziabad/', '<svg ' + SOCIAL_ICON + '><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>Instagram', true),
      li('https://www.facebook.com/ajaca2023', '<svg ' + SOCIAL_ICON + '><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg>Facebook', true),
      li('https://www.linkedin.com/company/aja-ca', '<svg ' + SOCIAL_ICON + '><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>LinkedIn', true),
      li('https://wa.me/918802586988', '<svg viewBox="0 0 24 24" style="width:1em;height:1em;fill:currentColor;margin-right:0.35em;vertical-align:-0.15em;"><path d="' + WHATSAPP_PATH + '"/></svg>WhatsApp', true)
    ].join('') + '</ul>\n      </div>\n' +
    '    </div>\n' +
    '    <div class="footer-bottom">\n' +
    '      <span>&copy; 2026 Ashish Jayalata &amp; Associates. All rights reserved.</span>\n' +
    '      <span><a href="https://www.icai.org" target="_blank" rel="noopener">icai.org</a> | <a href="' + p + 'pages/privacy-policy.html">Privacy Policy</a></span>\n' +
    '    </div>\n' +
    '  </div>\n' +
    '</footer>\n' +
    '<a href="https://wa.me/918802586988?text=Hi%2C%20I%20would%20like%20to%20enquire%20about%20CA%20services." class="whatsapp-float" target="_blank" rel="noopener" aria-label="Chat on WhatsApp">' +
      '<svg viewBox="0 0 24 24"><path d="' + WHATSAPP_PATH + '"/></svg></a>';
}

function stripBlock(html, name) {
  const m = MARK[name];
  const re = new RegExp('\\n?[ \\t]*' + m[0] + '[\\s\\S]*?' + m[1], 'g');
  return html.replace(re, '');
}

function wrap(name, inner) {
  return MARK[name][0] + '\n' + inner + '\n' + MARK[name][1];
}

// Index just past the end of the first element the old script would have
// picked with querySelector('.page-hero, .hero, section'), or -1.
function afterFirstHeroOrSection(html, from) {
  const openRe = /<([a-z][a-z0-9]*)\b([^>]*)>/gi;
  openRe.lastIndex = from;
  let m;
  while ((m = openRe.exec(html))) {
    const tag = m[1].toLowerCase();
    const cls = (m[2].match(/\bclass\s*=\s*"([^"]*)"/i) || [, ''])[1].split(/\s+/);
    if (tag !== 'section' && cls.indexOf('hero') === -1 && cls.indexOf('page-hero') === -1) continue;
    const tagRe = new RegExp('<(/?)' + tag + '\\b[^>]*>', 'gi');
    tagRe.lastIndex = openRe.lastIndex;
    let depth = 1, t;
    while ((t = tagRe.exec(html))) {
      depth += t[1] ? -1 : 1;
      if (depth === 0) return tagRe.lastIndex;
    }
    return -1;
  }
  return -1;
}

function stamp(html) {
  const bodyMatch = html.match(/<body\b([^>]*)>/i);
  if (!bodyMatch) return html;
  const attrs = bodyMatch[1];
  const attr = function (name) {
    const m = attrs.match(new RegExp('\\b' + name + "\\s*=\\s*(?:'([^']*)'|\"([^\"]*)\")"));
    return m ? decodeAttr(m[1] !== undefined ? m[1] : m[2]) : '';
  };
  const depth = parseInt(attr('data-depth') || '0', 10);
  const p = depth > 0 ? '../'.repeat(depth) : '';
  const active = attr('data-active');
  const crumbsRaw = attr('data-breadcrumbs');

  let out = html;
  ['header', 'breadcrumbs', 'footer'].forEach(function (n) { out = stripBlock(out, n); });
  // The runtime injector is retired; drop any tag that still loads it.
  out = out.replace(/\n?[ \t]*<script\b[^>]*src="(?:\.\.\/)*js\/components\.js"[^>]*><\/script>/g, '');

  const bodyOpen = out.match(/<body\b[^>]*>/i);
  const afterBody = bodyOpen.index + bodyOpen[0].length;
  out = out.slice(0, afterBody) + '\n' + wrap('header', headerHtml(p, active)) + out.slice(afterBody);

  const closeBody = out.lastIndexOf('</body>');
  if (crumbsRaw) {
    const crumbs = JSON.parse(crumbsRaw);
    const bc = wrap('breadcrumbs', breadcrumbsHtml(p, crumbs));
    const at = afterFirstHeroOrSection(out, afterBody);
    if (at !== -1 && at < closeBody) out = out.slice(0, at) + '\n' + bc + out.slice(at);
    else out = out.slice(0, closeBody) + bc + '\n' + out.slice(closeBody);
  }
  const end = out.lastIndexOf('</body>');
  out = out.slice(0, end) + wrap('footer', footerHtml(p)) + '\n' + out.slice(end);
  return out;
}

module.exports = { stamp: stamp, footerHtml: footerHtml };
