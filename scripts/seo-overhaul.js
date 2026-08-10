// scripts/seo-overhaul.js — Applies the SEO content model (seo-data.js) to every
// HTML page: title/description/OG/Twitter meta, H1, JSON-LD (AccountingService,
// Person, Service, FAQPage, BreadcrumbList, Article), FAQ accordion items,
// related-services blocks, lang, breadcrumb attributes, and the faq.js include.
//
// Usage:  node scripts/seo-overhaul.js
// It is idempotent-safe: existing ld+json blocks are stripped and rebuilt from
// the data file, so a second run converges to the same output.

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DATA = require('./seo-data.js');

const BASE_URL = 'https://caashishrajput.com';
const SITE_NAME = 'Ashish Jayalata & Associates';

const SAME_AS = [
  'https://maps.app.goo.gl/cMPY7JuiWfou4Ym1A',
  'https://www.instagram.com/aja_ghaziabad/',
  'https://www.facebook.com/ajaca2023',
  'https://www.linkedin.com/company/aja-ca',
  'https://jsdl.in/DT-23SEMLHVWHX',
  'https://www.sulekha.com/ashish-jayalata-associates-ca-sahibabad-ghaziabad-contact-address'
];

function htmlEsc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function pageUrl(file) {
  return file === 'index.html' ? BASE_URL + '/' : BASE_URL + '/' + file;
}

function resolveRel(file, href) {
  const dir = path.posix.dirname(file);
  return path.posix.normalize(path.posix.join(dir, href));
}

function relToUrl(rel) {
  return rel === 'index.html' ? BASE_URL + '/' : BASE_URL + '/' + rel;
}

function jsPrefix(file) {
  const depth = file.split('/').length - 1;
  return depth === 0 ? '' : '../'.repeat(depth);
}

/* ------------------------------------------------ schema builders */

function practiceSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'AccountingService',
    '@id': BASE_URL + '/#practice',
    name: SITE_NAME,
    description: 'Chartered Accountancy practice in Sahibabad, Ghaziabad offering income tax, GST, audit, accounting, and company registration services.',
    url: BASE_URL,
    telephone: '+918802586988',
    email: 'ca.ashishrajput@outlook.com',
    priceRange: 'Reasonable and transparent; fees quoted per engagement',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'LG-3, S-14, Krishna Plaza',
      addressLocality: 'Vrindavan Garden, Sahibabad',
      addressRegion: 'Ghaziabad, Uttar Pradesh',
      postalCode: '201005',
      addressCountry: 'IN'
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: '28.6809421',
      longitude: '77.3457167'
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        opens: '10:00',
        closes: '19:00'
      }
    ],
    sameAs: SAME_AS
  };
}

function personSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': BASE_URL + '/#person',
    name: 'CA Ashish Rajput',
    jobTitle: 'Chartered Accountant',
    worksFor: { '@id': BASE_URL + '/#practice' },
    url: BASE_URL + '/about.html',
    telephone: '+918802586988',
    email: 'ca.ashishrajput@outlook.com'
  };
}

function serviceSchema(entry) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: entry.h1,
    description: entry.description,
    url: pageUrl(entry.file),
    provider: { '@id': BASE_URL + '/#practice' },
    serviceType: entry.serviceType
  };
}

function faqSchema(entry) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: entry.faq.map(function (f) {
      return {
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a }
      };
    })
  };
}

function breadcrumbSchema(entry) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: entry.breadcrumbs.map(function (c, i) {
      return {
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@id': c.href ? relToUrl(resolveRel(entry.file, c.href)) : pageUrl(entry.file),
          name: c.label
        }
      };
    })
  };
}

function articleSchema(entry) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: entry.article.headline,
    datePublished: entry.article.datePublished,
    dateModified: entry.article.dateModified,
    author: {
      '@type': 'Person',
      name: 'Ashish Rajput',
      url: BASE_URL + '/about.html'
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: BASE_URL,
      logo: {
        '@type': 'ImageObject',
        url: BASE_URL + '/images/logo.png'
      }
    },
    description: entry.description,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': pageUrl(entry.file)
    }
  };
}

function ldBlock(obj) {
  return '  <script type="application/ld+json">\n' +
    JSON.stringify(obj, null, 2) +
    '\n  </script>';
}

function buildSchemas(entry) {
  const blocks = [];
  if (entry.file !== 'pages/404.html') {
    blocks.push(ldBlock(practiceSchema()));
    blocks.push(ldBlock(personSchema()));
  }
  if (entry.serviceType) blocks.push(ldBlock(serviceSchema(entry)));
  if (entry.article) blocks.push(ldBlock(articleSchema(entry)));
  if (entry.faq) blocks.push(ldBlock(faqSchema(entry)));
  if (entry.breadcrumbs) blocks.push(ldBlock(breadcrumbSchema(entry)));
  return blocks;
}

/* ------------------------------------------------ FAQ / related HTML */

function faqItemsHtml(faqs) {
  return faqs.map(function (f) {
    return '<details class="faq-item" id="' + f.id + '">\n' +
      '            <summary>' + htmlEsc(f.q) + '</summary>\n' +
      '            <div class="faq-answer">' + htmlEsc(f.a) + '</div>\n' +
      '          </details>';
  }).join('\n          ');
}

function faqSectionHtml(entry) {
  return '<section class="section section-alt" id="faq">\n' +
    '    <div class="container">\n' +
    '      <h2 class="section-title">Frequently Asked Questions</h2>\n' +
    '      <p class="section-subtitle">Common questions answered by a Chartered Accountant in Sahibabad, Ghaziabad.</p>\n' +
    '      <div class="faq-section">\n' +
    '        ' + faqItemsHtml(entry.faq) + '\n' +
    '      </div>\n' +
    '    </div>\n' +
    '  </section>';
}

function relatedItemsHtml(related) {
  return related.map(function (r) {
    return '            <li><a href="' + r.href + '">' + htmlEsc(r.name) + '</a></li>';
  }).join('\n');
}

/* ------------------------------------------------ meta transforms */

function ensureMeta(content, pattern, replacement) {
  if (pattern.test(content)) {
    return content.replace(pattern, replacement);
  }
  // Insert after </title> if not present.
  const titleEnd = content.indexOf('</title>');
  if (titleEnd !== -1) {
    const at = titleEnd + '</title>'.length;
    return content.slice(0, at) + '\n  ' + replacement + content.slice(at);
  }
  return content.replace('</head>', replacement + '\n</head>');
}

function applyHead(content, entry) {
  // lang
  content = content.replace(/<html lang="en">/, '<html lang="en-IN">');

  // <title>
  content = content.replace(/<title>[\s\S]*?<\/title>/,
    '<title>' + htmlEsc(entry.title) + '</title>');

  const desc = '<meta name="description" content="' + htmlEsc(entry.description) + '">';
  content = ensureMeta(content, /<meta name="description"[^>]*>/, desc);

  const ogTitle = '<meta property="og:title" content="' + htmlEsc(entry.title) + '">';
  content = ensureMeta(content, /<meta property="og:title"[^>]*>/, ogTitle);

  const ogDesc = '<meta property="og:description" content="' + htmlEsc(entry.description) + '">';
  content = ensureMeta(content, /<meta property="og:description"[^>]*>/, ogDesc);

  const twTitle = '<meta name="twitter:title" content="' + htmlEsc(entry.title) + '">';
  content = ensureMeta(content, /<meta name="twitter:title"[^>]*>/, twTitle);

  const twDesc = '<meta name="twitter:description" content="' + htmlEsc(entry.description) + '">';
  content = ensureMeta(content, /<meta name="twitter:description"[^>]*>/, twDesc);

  if (entry.file === 'pages/404.html') {
    content = ensureMeta(content, /<meta name="robots"[^>]*>/,
      '<meta name="robots" content="noindex, nofollow">');
  }

  return content;
}

function applyH1(content, entry) {
  if (entry.h1 === null) return content;
  const matches = content.match(/<h1[\s\S]*?<\/h1>/g) || [];
  if (matches.length !== 1) {
    console.warn('  ! WARNING: ' + entry.file + ' has ' + matches.length + ' H1 tag(s) — H1 left unchanged.');
    return content;
  }
  return content.replace(/<h1[^>]*>[\s\S]*?<\/h1>/,
    '<h1>' + htmlEsc(entry.h1) + '</h1>');
}

function applyBreadcrumbAttr(content, entry) {
  if (!entry.breadcrumbs) return content;
  if (/data-breadcrumbs=/.test(content)) return content;
  const value = JSON.stringify(entry.breadcrumbs);
  return content.replace(/<body([^>]*)>/, '<body$1 data-breadcrumbs=\'' + value + '\'>');
}

function applyFaq(content, entry) {
  if (!entry.faq) return content;
  const itemsHtml = faqItemsHtml(entry.faq);

  if (/<div class="faq-section">/.test(content)) {
    // Replace existing FAQ items with the canonical set (first block -> all,
    // any extra blocks removed).
    let first = true;
    content = content.replace(/<details class="faq-item"[^>]*>[\s\S]*?<\/details>/g, function () {
      if (first) { first = false; return itemsHtml; }
      return '';
    });
    return content;
  }

  const sectionHtml = faqSectionHtml(entry);
  if (entry.file === 'index.html') {
    const marker = '<section class="contact-strip">';
    if (content.indexOf(marker) !== -1) {
      return content.replace(marker, sectionHtml + '\n\n  ' + marker);
    }
  }
  return content.replace('</main>', sectionHtml + '\n\n  </main>');
}

function applyRelated(content, entry) {
  if (!entry.related) return content;
  const pattern = /(<div class="related-services">[\s\S]*?<ul>)[\s\S]*?(<\/ul>)/;
  if (!pattern.test(content)) {
    console.warn('  ! WARNING: ' + entry.file + ' has related data but no .related-services block.');
    return content;
  }
  return content.replace(pattern, '$1\n' + relatedItemsHtml(entry.related) + '\n          $2');
}

function applyFaqScript(content, entry) {
  if (!entry.faq) return content;
  const src = jsPrefix(entry.file) + 'js/faq.js';
  const tag = '<script defer src="' + src + '"></script>';
  if (content.indexOf(tag) !== -1) return content;
  return content.replace('</body>', '  ' + tag + '\n</body>');
}

function applySchemas(content, entry) {
  const blocks = buildSchemas(entry);
  if (!blocks.length) return content;
  // Strip every existing JSON-LD script (and any adjacent comment marker).
  content = content.replace(/[ \t]*<!--[^>]*JSON-LD[^>]*-->\s*/g, '');
  content = content.replace(/\s*<script type="application\/ld\+json">[\s\S]*?<\/script>/g, '');
  const insertion = '\n\n' + blocks.join('\n\n') + '\n';
  return content.replace('</head>', insertion + '</head>');
}

/* ------------------------------------------------ main loop */

function processEntry(entry) {
  const filePath = path.join(ROOT, entry.file);
  let content = fs.readFileSync(filePath, 'utf8');

  content = applyHead(content, entry);
  content = applyH1(content, entry);
  content = applyBreadcrumbAttr(content, entry);
  content = applyFaq(content, entry);
  content = applyRelated(content, entry);
  content = applyFaqScript(content, entry);
  content = applySchemas(content, entry);

  fs.writeFileSync(filePath, content, 'utf8');

  // Validation summary
  const titleLen = entry.title.length;
  const descLen = entry.description.length;
  const flag = [];
  if (titleLen > 60) flag.push('title>60');
  if (descLen < 140 || descLen > 158) flag.push('desc=' + descLen + ' (target 140-158)');
  if (flag.length) console.log('  ! ' + entry.file + ' — ' + flag.join(', '));
  else console.log('  ok ' + entry.file + '  (title ' + titleLen + ', desc ' + descLen + ')');
}

console.log('SEO overhaul — applying ' + DATA.length + ' page entries...');
DATA.forEach(processEntry);
console.log('Done.');
