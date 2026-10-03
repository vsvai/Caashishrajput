// scripts/lib/site-chrome.js — shared <head> assets, header, breadcrumbs,
// footer and mobile contact bar, written straight into each page's HTML.
//
// Static markup means search engines and visitors without JavaScript see the
// full navigation and the NAP <address> block on first load.
//
// This file is the single source for that markup. Pages keep their
// data-depth / data-active / data-breadcrumbs attributes on <body>; stamp()
// reads them and (re)writes the blocks between <!--chrome:*--> markers, so it
// is safe to run any number of times. To change the menu or footer, edit this
// file and run:  npm run chrome
//
// ICAI note (Code of Ethics 2026, §2.14.1.7(xvii) and §3.1.3(G)): a firm
// logo/monogram, or the firm name written so that it works as one, is not
// permitted. The firm name is therefore set in plain text; the only mark used
// is the CA India logo, shown unaltered on its white background (§2.14.1.7(xviii)).

const SITE = 'https://caashishrajput.com';

const MARK = {
  head: ['<!--chrome:head-->', '<!--/chrome:head-->'],
  header: ['<!--chrome:header-->', '<!--/chrome:header-->'],
  breadcrumbs: ['<!--chrome:breadcrumbs-->', '<!--/chrome:breadcrumbs-->'],
  footer: ['<!--chrome:footer-->', '<!--/chrome:footer-->']
};

const PHONE_TEL = '+918802586988';
const PHONE_DISPLAY = '+91 88025 86988';
const EMAIL = 'ca.ashishrajput@outlook.com';
const WA_URL = 'https://wa.me/918802586988?text=' + encodeURIComponent('Hello, I would like to discuss a requirement with your office.');

const WHATSAPP_PATH = 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z';

// Lucide-style stroke icons (24px grid). One visual language site-wide.
const ICON = {
  phone: '<path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
  pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0116 0z"/><circle cx="12" cy="10" r="3"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4z"/>',
  instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5h.01"/>',
  facebook: '<path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/>',
  linkedin: '<path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-4 0v7h-4v-7a6 6 0 016-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>'
};

function icon(name, extra) {
  return '<svg class="icon-svg' + (extra ? ' ' + extra : '') + '" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + ICON[name] + '</svg>';
}
function waIcon(cls) {
  return '<svg class="' + (cls || 'wa-icon') + '" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="' + WHATSAPP_PATH + '"/></svg>';
}

const NAV = [
  ['services', 'services.html', 'Services'],
  ['about', 'about.html', 'About'],
  ['blog', 'blog.html', 'Insights'],
  ['resources', 'resources.html', 'Compliance Calendar'],
  ['contact', 'contact.html', 'Contact']
];

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function decodeAttr(s) {
  return s.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
}

// One web font only (display headings). Body text uses the platform UI font,
// which costs nothing to load and reads well on every device.
const FONTS_CSS = 'https://fonts.googleapis.com/css2?family=Source+Serif+4:opsz,wght@8..60,600&amp;display=swap';

function headHtml(p) {
  return '<link rel="preconnect" href="https://fonts.googleapis.com">\n' +
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n' +
    // Loaded without blocking first paint; text shows in the fallback stack
    // (Georgia / system sans) until the web fonts arrive.
    '<link rel="stylesheet" href="' + FONTS_CSS + '" media="print" onload="this.media=\'all\'">\n' +
    '<noscript><link rel="stylesheet" href="' + FONTS_CSS + '"></noscript>\n' +
    '<link rel="icon" type="image/png" sizes="32x32" href="' + p + 'images/favicon-32.png">\n' +
    '<link rel="apple-touch-icon" href="' + p + 'images/apple-touch-icon.png">\n' +
    '<meta name="theme-color" content="#102a43">';
}

function headerHtml(p, active, hasBase) {
  const links = NAV.map(function (n) {
    const on = active === n[0];
    return '<a href="' + p + n[1] + '"' + (on ? ' class="active" aria-current="page"' : '') + '>' + n[2] + '</a>';
  }).join('\n      ');
  // With <base href="/"> (the 404 page) a bare #fragment would point at the
  // home page, so the skip link is omitted there.
  return (hasBase ? '' : '<a class="skip-link" href="#main-content">Skip to content</a>\n') +
    '<header class="header">\n' +
    '  <div class="container">\n' +
    '    <a href="' + p + 'index.html" class="logo" aria-label="Ashish Jayalata &amp; Associates, Chartered Accountants: home">' +
      '<img src="' + p + 'images/ca-india-logo.png" alt="CA India logo" width="129" height="112">' +
      '<span class="logo-text"><span class="logo-name">Ashish Jayalata &amp; Associates</span><span class="logo-sub">Chartered Accountants</span></span></a>\n' +
    '    <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav" aria-label="Open menu">' +
      icon('menu', 'icon-open') + icon('close', 'icon-close') + '</button>\n' +
    '    <nav class="nav" id="site-nav" aria-label="Main">\n      ' + links + '\n' +
    '      <a href="tel:' + PHONE_TEL + '" class="nav-cta" data-track="phone">' + icon('phone') + 'Call the office</a>\n' +
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
      li += '<span itemprop="name" aria-current="page">' + esc(c.label) + '</span>';
    }
    li += '<meta itemprop="position" content="' + (i + 1) + '"></li>';
    items.push(li);
    if (i < crumbs.length - 1) items.push('<li class="bc-sep" aria-hidden="true">/</li>');
  });
  return '<nav class="breadcrumbs" aria-label="Breadcrumb">\n' +
    '  <div class="container"><ol itemscope itemtype="https://schema.org/BreadcrumbList">\n    ' +
    items.join('\n    ') + '\n  </ol></div>\n' +
    '</nav>';
}

function footerHtml(p) {
  const li = function (href, text, external) {
    return '<li><a href="' + href + '"' + (external ? ' target="_blank" rel="noopener"' : '') + '>' + text + '</a></li>';
  };
  const social = function (href, label, svgInner) {
    return '<a href="' + href + '" target="_blank" rel="noopener" aria-label="' + label + '"><svg class="icon-svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + svgInner + '</svg></a>';
  };
  return '<footer class="footer">\n' +
    '  <div class="container">\n' +
    '    <div class="footer-grid">\n' +
    '      <div>\n' +
    '        <div class="footer-brand"><img src="' + p + 'images/ca-india-logo.png" alt="CA India logo" class="footer-logo" width="129" height="112" loading="lazy">' +
          '<div><p class="footer-firm">Ashish Jayalata &amp; Associates</p><p class="footer-firm-sub">Chartered Accountants</p></div></div>\n' +
    '        <address class="nap"><strong class="nap-name">Ashish Jayalata &amp; Associates</strong><br>' +
          '<span class="nap-street">LG-3, S-14, Krishna Plaza</span><br>' +
          '<span class="nap-locality">Vrindavan Garden, Sahibabad</span><br>' +
          '<span class="nap-region">Ghaziabad, Uttar Pradesh 201005</span><br>' +
          'Phone: <a href="tel:' + PHONE_TEL + '" class="nap-phone" data-track="phone">' + PHONE_DISPLAY + '</a><br>' +
          'Email: <a href="mailto:' + EMAIL + '" class="nap-email" data-track="email">' + EMAIL + '</a><br>' +
          'Hours: Monday &ndash; Saturday, 10:00 AM &ndash; 7:00 PM</address>\n' +
    '        <div class="social-links">' +
          social('https://www.linkedin.com/company/aja-ca', 'LinkedIn', ICON.linkedin) +
          social('https://www.instagram.com/aja_ghaziabad/', 'Instagram', ICON.instagram) +
          social('https://www.facebook.com/ajaca2023', 'Facebook', ICON.facebook) +
        '</div>\n' +
    '      </div>\n' +
    '      <div>\n        <h2>Services</h2>\n        <ul class="footer-links">' + [
      li(p + 'services/income-tax.html', 'Income Tax &amp; ITR'), li(p + 'services/gst.html', 'GST Registration &amp; Returns'),
      li(p + 'services/tax-audit.html', 'Tax Audit (44AB)'), li(p + 'services/statutory-audit.html', 'Statutory Audit'),
      li(p + 'services/company-llp-registration.html', 'Company &amp; LLP Registration'),
      li(p + 'services/accounting-bookkeeping.html', 'Accounting &amp; Bookkeeping'),
      li(p + 'services/corporate-representation.html', 'Notices &amp; Representation'),
      li(p + 'services.html', 'All services')
    ].join('') + '</ul>\n      </div>\n' +
    '      <div>\n        <h2>The Practice</h2>\n        <ul class="footer-links">' + [
      li(p + 'about.html', 'About'), li(p + 'contact.html', 'Contact &amp; directions'),
      li(p + 'blog.html', 'Insights'), li(p + 'resources.html', 'Compliance calendar'),
      li(p + 'career/index.html', 'Careers &amp; articleship'), li(p + 'pages/privacy-policy.html', 'Privacy policy')
    ].join('') + '</ul>\n      </div>\n' +
    '      <div>\n        <h2>Official Portals</h2>\n        <ul class="footer-links">' + [
      li('https://www.icai.org', 'ICAI', true), li('https://www.incometax.gov.in', 'Income Tax e-Filing', true),
      li('https://www.gst.gov.in', 'GST Portal', true), li('https://www.mca.gov.in', 'MCA', true),
      li('https://www.tdscpc.gov.in', 'TRACES (TDS)', true), li('https://www.epfindia.gov.in', 'EPFO', true),
      li('https://www.esic.gov.in', 'ESIC', true), li('https://www.dgft.gov.in', 'DGFT', true)
    ].join('') + '</ul>\n      </div>\n' +
    '    </div>\n' +
    '    <p class="disclaimer">The information on this website is provided for general information only and does not constitute professional advice. It is not intended to solicit clients or to advertise professional attainments. Please seek independent professional advice before acting on any information here. Links to government portals are provided for convenience.</p>\n' +
    '    <div class="footer-bottom">\n' +
    '      <span>&copy; 2026 Ashish Jayalata &amp; Associates, Chartered Accountants</span>\n' +
    '      <nav aria-label="Legal"><a href="' + p + 'pages/privacy-policy.html">Privacy policy</a><a href="https://www.icai.org" target="_blank" rel="noopener">icai.org</a></nav>\n' +
    '    </div>\n' +
    '  </div>\n' +
    '</footer>\n' +
    '<a href="' + WA_URL + '" class="whatsapp-float" target="_blank" rel="noopener" aria-label="Message the office on WhatsApp" data-track="whatsapp">' + waIcon('') + '</a>\n' +
    '<nav class="contact-bar" aria-label="Contact the office">' +
      '<a href="tel:' + PHONE_TEL + '" class="is-primary" data-track="phone">' + icon('phone') + 'Call</a>' +
      '<a href="' + WA_URL + '" class="is-wa" target="_blank" rel="noopener" data-track="whatsapp">' + waIcon() + 'WhatsApp</a>' +
      '<a href="' + p + 'contact.html#enquiry" data-track="enquiry">' + icon('edit') + 'Enquire</a>' +
    '</nav>';
}

function stripBlock(html, name) {
  const m = MARK[name];
  const re = new RegExp('\\n?[ \\t]*' + m[0] + '[\\s\\S]*?' + m[1], 'g');
  return html.replace(re, '');
}

function wrap(name, inner) {
  return MARK[name][0] + '\n' + inner + '\n' + MARK[name][1];
}

// Index just past the end of the first element matching
// '.page-hero, .hero, section', or -1.
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

// Head-level fixes that every page needs: favicon/fonts block, social image
// (the old one was the firm monogram), and a large Twitter card.
function stampHead(out, p) {
  out = stripBlock(out, 'head');
  out = out.replace(/\n?[ \t]*<link rel="icon"[^>]*>/g, '');
  out = out.replace(/(<meta property="og:image" content=")[^"]*(")/g, '$1' + SITE + '/images/og-image.jpg$2');
  if (/<meta property="og:image"/.test(out) && !/og:image:width/.test(out)) {
    out = out.replace(/(<meta property="og:image" content="[^"]*">)/, '$1\n  <meta property="og:image:width" content="1200">\n  <meta property="og:image:height" content="630">\n  <meta property="og:image:alt" content="Ashish Jayalata &amp; Associates, Chartered Accountants, Sahibabad, Ghaziabad">');
  }
  out = out.replace(/<meta name="twitter:card" content="summary">/g, '<meta name="twitter:card" content="summary_large_image">');
  // JSON-LD publisher/organisation logo: never the monogram.
  out = out.replace(/https:\/\/caashishrajput\.com\/images\/logo\.png/g, SITE + '/images/icon-512.png');
  const headClose = out.indexOf('</head>');
  if (headClose !== -1) {
    out = out.slice(0, headClose) + '  ' + wrap('head', headHtml(p)).replace(/\n/g, '\n  ') + '\n' + out.slice(headClose);
  }
  return out;
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
  // Skip-link target.
  out = out.replace(/<main(?![^>]*\bid=)([^>]*)>/, '<main id="main-content"$1>');

  out = stampHead(out, p);

  const bodyOpen = out.match(/<body\b[^>]*>/i);
  const afterBody = bodyOpen.index + bodyOpen[0].length;
  out = out.slice(0, afterBody) + '\n' + wrap('header', headerHtml(p, active, /<base\s/i.test(out))) + out.slice(afterBody);

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

module.exports = { stamp: stamp, footerHtml: footerHtml, icon: icon, waIcon: waIcon, WA_URL: WA_URL };
