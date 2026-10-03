// scripts/blog-build.js — Weekly blog content pipeline.
//
// Turns Markdown drafts (blog/drafts/*.md) into fully-SEO'd HTML blog posts that
// match the existing site template, then regenerates blog.html (listing) and the
// blog <url> entries in sitemap.xml.
//
// Usage:
//   node scripts/blog-build.js new <slug> "<Title>"          # scaffold a draft
//   node scripts/blog-build.js preview <slug>                 # build HTML to a temp file (no commit)
//   node scripts/blog-build.js publish <slug>                 # publish a draft: build HTML, move draft to blog/_published/, rebuild listing + sitemap
//   node scripts/blog-build.js rebuild                         # rebuild listing + sitemap from published posts (after hand edits)
//   node scripts/blog-build.js list                           # list drafts and published posts
//
// Authentication / deploy is intentionally left OUT of this script.
// Publishing to GitHub Pages is a SEPARATE explicit step you run yourself:
//   git add -A && git commit -m "..." && git push
// Nothing is pushed without your own git command.

const fs = require('fs');
const path = require('path');

const { htmlEsc, mdToHtml, parseFrontMatter } = require('./lib/markdown.js');
const sitemap = require('./lib/sitemap.js');
const { stamp } = require('./lib/site-chrome.js');

const ROOT = path.join(__dirname, '..');
const BLOG_DIR = path.join(ROOT, 'blog');
const DRAFTS_DIR = path.join(BLOG_DIR, 'drafts');
const PUBLISHED_DIR = path.join(BLOG_DIR, '_published');
const BLOG_HTML = path.join(ROOT, 'blog.html');
const SITEMAP = path.join(ROOT, 'sitemap.xml');

const BASE_URL = 'https://caashishrajput.com';
const SITE_NAME = 'Ashish Jayalata & Associates';
const AUTHOR = 'Ashish Rajput';
const PHONE = '+91 88025 86988';
const PRACTICE_DESC = 'Chartered Accountancy practice in Sahibabad, Ghaziabad offering income tax, GST, audit, accounting, and company registration services.';

const DEFAULT_CATEGORIES = ['Income Tax', 'GST', 'Audit', 'Company Law', 'Compliance'];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

/* ============================================================
   Markdown -> HTML and front matter parsing live in
   scripts/lib/markdown.js so the careers pipeline renders
   identically.
   ============================================================ */

/* ============================================================
   Blog post HTML template (mirrors existing blog/*.html structure)
   ============================================================ */
function practiceSchemaJson() {
  return {
    '@context': 'https://schema.org',
    '@type': 'AccountingService',
    '@id': BASE_URL + '/#practice',
    name: SITE_NAME,
    description: PRACTICE_DESC,
    url: BASE_URL,
    telephone: '+918802586988',
    email: 'ca.ashishrajput@outlook.com',
    address: {
      '@type': 'PostalAddress', streetAddress: 'LG-3, S-14, Krishna Plaza',
      addressLocality: 'Vrindavan Garden, Sahibabad',
      addressRegion: 'Ghaziabad, Uttar Pradesh', postalCode: '201005',
      addressCountry: 'IN'
    },
    geo: { '@type': 'GeoCoordinates', latitude: '28.6809421', longitude: '77.3457167' },
    openingHoursSpecification: [{
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      opens: '10:00', closes: '19:00'
    }],
    sameAs: [
      'https://maps.app.goo.gl/cMPY7JuiWfou4Ym1A',
      'https://www.instagram.com/aja_ghaziabad/',
      'https://www.facebook.com/ajaca2023',
      'https://www.linkedin.com/company/aja-ca',
      'https://jsdl.in/DT-23SEMLHVWHX',
      'https://www.sulekha.com/ashish-jayalata-associates-ca-sahibabad-ghaziabad-contact-address'
    ]
  };
}
function personSchemaJson() {
  return {
    '@context': 'https://schema.org', '@type': 'Person',
    '@id': BASE_URL + '/#person', name: 'CA Ashish Rajput', jobTitle: 'Chartered Accountant',
    worksFor: { '@id': BASE_URL + '/#practice' }, url: BASE_URL + '/about.html',
    telephone: '+918802586988', email: 'ca.ashishrajput@outlook.com'
  };
}
function articleSchemaJson(post) {
  return {
    '@context': 'https://schema.org', '@type': 'Article',
    headline: post.h1, datePublished: post.date, dateModified: post.date,
    author: { '@type': 'Person', name: AUTHOR, url: BASE_URL + '/about.html' },
    publisher: {
      '@type': 'Organization', name: SITE_NAME, url: BASE_URL,
      logo: { '@type': 'ImageObject', url: BASE_URL + '/images/icon-512.png' }
    },
    description: post.description,
    mainEntityOfPage: { '@type': 'WebPage', '@id': post.url }
  };
}
function breadcrumbSchemaJson(post) {
  return {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, item: { '@id': BASE_URL + '/', name: 'Home' } },
      { '@type': 'ListItem', position: 2, item: { '@id': BASE_URL + '/blog.html', name: 'Blog' } },
      { '@type': 'ListItem', position: 3, item: { '@id': post.url, name: post.h1 } }
    ]
  };
}
const SCHEMA_INDENT = '  ';

// Google cuts titles off at roughly 60 characters. Use `seo_title` from the
// front matter when given, otherwise the longest brand suffix that still fits.
const TITLE_MAX = 60;
function pageTitle(post) {
  if (post.seoTitle) return post.seoTitle;
  const suffixes = [' | CA Ashish Rajput, Ghaziabad', ' | CA Ashish Rajput'];
  for (let i = 0; i < suffixes.length; i++) {
    if ((post.h1 + suffixes[i]).length <= TITLE_MAX) return post.h1 + suffixes[i];
  }
  return post.h1;
}

function buildPostHtml(post) {
  const schemas = [practiceSchemaJson(), personSchemaJson(), articleSchemaJson(post), breadcrumbSchemaJson(post)];
  const schemaBlocks = schemas.map(function (s) {
    return SCHEMA_INDENT + '<script type="application/ld+json">\n' +
      JSON.stringify(s, null, 2).split('\n').map(function (l) { return SCHEMA_INDENT + l; }).join('\n') +
      '\n' + SCHEMA_INDENT + '</script>';
  }).join('\n\n');

  const canonical = post.url;
  const title = pageTitle(post);
  const desc = post.description;
  const escDesc = htmlEsc(desc);

  const body = post.bodyHtml
    .split('\n').map(function (l) { return '        ' + l; }).join('\n');

  return stamp('<!DOCTYPE html>\n' +
    '<html lang="en-IN">\n' +
    '<head>\n' +
    '  <meta charset="UTF-8">\n' +
    '  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
    '  <title>' + htmlEsc(title) + '</title>\n' +
    '  <meta name="description" content="' + escDesc + '">\n' +
    '  <link rel="canonical" href="' + canonical + '">\n' +
    '  <meta property="og:type" content="article">\n' +
    '  <meta property="og:title" content="' + htmlEsc(title) + '">\n' +
    '  <meta property="og:description" content="' + escDesc + '">\n' +
    '  <meta property="og:url" content="' + canonical + '">\n' +
    '  <meta property="og:image" content="' + BASE_URL + '/images/og-image.jpg">\n' +
    '  <meta property="og:site_name" content="' + htmlEsc(SITE_NAME) + '">\n' +
    '  <meta property="article:published_time" content="' + post.date + '">\n' +
    '  <meta property="article:author" content="' + AUTHOR + '">\n' +
    '  <meta name="twitter:card" content="summary">\n' +
    '  <meta name="twitter:title" content="' + htmlEsc(title) + '">\n' +
    '  <meta name="twitter:description" content="' + escDesc + '">\n' +
    '\n' +
    '  <link rel="stylesheet" href="../css/style.css">\n' +
    '\n\n' +
    schemaBlocks + '\n' +
    '</head>\n' +
    '<body data-depth="1" data-active="blog" data-breadcrumbs=\'' +
    JSON.stringify([
      { label: 'Home', href: 'index.html' },
      { label: 'Blog', href: 'blog.html' },
      { label: post.h1 }
    ]) + '\'>\n' +
    '  <main>\n' +
    '\n' +
    '  <section class="page-hero">\n' +
    '    <div class="container">\n' +
    '      <p class="page-hero-kicker">Insights</p>\n' +
    '      <p>Tax updates, compliance guides and practical information</p>\n' +
    '    </div>\n' +
    '  </section>\n' +
    '\n' +
    '  <section class="section">\n' +
    '    <div class="container">\n' +
    '      <article class="blog-post-header">\n' +
    '        <div class="blog-meta">\n' +
    '          <span class="blog-category">' + htmlEsc(post.category) + '</span>\n' +
    '          <span>' + post.monthYear + '</span>\n' +
    '        </div>\n' +
    '        <h1>' + htmlEsc(post.h1) + '</h1>\n' +
    '      </article>\n' +
    '\n' +
    '      <div class="blog-post-content">\n' +
    '\n' +
    body + '\n' +
    '\n' +
    '      <!-- Author Bio -->\n' +
    '      <div class="author-bio">\n' +
    '        <div class="author-photo">\n' +
    '          <picture>\n' +
    '            <source srcset="../images/author-avatar.avif" type="image/avif">\n' +
    '            <source srcset="../images/author-avatar.webp" type="image/webp">\n' +
    '            <img src="../images/author-avatar.jpg" alt="CA Ashish Rajput, Chartered Accountant" width="72" height="72" loading="lazy">\n' +
    '          </picture>\n' +
    '        </div>\n' +
    '        <div class="author-info">\n' +
    '          <h3>About the Author</h3>\n' +
    '          <div class="author-role">CA ' + AUTHOR + ' &mdash; Chartered Accountant, Proprietor</div>\n' +
    '          <p>Ashish Rajput is a practising Chartered Accountant and the proprietor of ' + htmlEsc(SITE_NAME) +
    ', based in Vrindavan Garden, Sahibabad, Ghaziabad. He provides income tax, GST, audit, accounting, and business compliance services to individuals and businesses across Ghaziabad and the wider NCR region. The practice is registered with the Institute of Chartered Accountants of India (ICAI).</p>\n' +
    '        </div>\n' +
    '      </div>\n' +
    '\n' +
    '</div>\n' +
    '    </div>\n' +
    '  </section>\n' +
    '\n' +
    '  </main>\n' +
    '  <script defer src="../js/main.js"></script>\n' +
    '</body>\n' +
    '</html>\n');
}

/* ============================================================
   Listing (blog.html) regeneration
   ============================================================ */
function readPublishedPosts() {
  const posts = [];
  [BLOG_DIR, PUBLISHED_DIR].forEach(function (dir) {
    if (!fs.existsSync(dir)) return;
    fs.readdirSync(dir).forEach(function (f) {
      if (!f.endsWith('.html')) return;
      const fp = path.join(dir, f);
      let content;
      try { content = fs.readFileSync(fp, 'utf8'); } catch (e) { return; }
      const cat = (content.match(/class="blog-category">([^<]+)</) || [])[1] || 'Compliance';
      const dateMeta = (content.match(/content="(\d{4}-\d{2}-\d{2})"/) || [])[1] || null;
      const published = (content.match(/<meta property="article:published_time" content="([^"]+)"/) || [])[1] || dateMeta;
      const h1 = (content.match(/<h1>([\s\S]*?)<\/h1>/) || [])[1] || f;
      const desc = (content.match(/name="description" content="([^"]+)"/) || [])[1] || '';
      const excerpt = desc;
      posts.push({
        slug: f.replace(/\.html$/, ''),
        date: published,
        category: cat,
        h1: h1,
        excerpt: excerpt
      });
    });
  });
  // sort newest first (by date desc), stable
  posts.sort(function (a, b) {
    if (!a.date) return 1; if (!b.date) return -1;
    return a.date < b.date ? 1 : (a.date > b.date ? -1 : 0);
  });
  return posts;
}

// Descriptive "read more" labels per post slug (kept in sync with blog.html grid).
// Falls back to generic "Read more" for posts without a bespoke label.
const READ_MORE = {
  'advance-tax-guide-due-dates-instalments-2026': 'Due dates, calculations and interest rules explained',
  'ccfs-2026-extended-to-15-september-2026': 'ROC filing relief scheme deadline and fee waivers',
  'itr-filing-business-income-due-date-ay-2026-27': '31 August 2026 deadline for ITR-3/ITR-4 filers',
  'gst-registration-turnover-limits-up-2026': 'When GST registration is mandatory in UP',
  'gst-annual-return-gstr9-fy2025-26': 'GSTR-9 filing guide with deadlines and errors',
  'gst-due-dates-july-2026': 'Complete GST filing calendar for July 2026',
  'income-tax-advance-tax-instalments-fy2025-26': 'Advance tax dates and interest calculation guide',
  'llp-annual-compliance-requirements-2026': 'Form 8, Form 11 and MCA deadlines explained',
  'delhi-hc-biometric-aadhaar-gst-registration': 'Delhi HC ruling makes biometric Aadhaar mandatory',
  'mca-incorporation-amendment-rules-2026': 'MCA draft rules: fewer forms, faster company registration',
  'fssai-registration-licensing-guide-2026': 'FSSAI tiers, fees and KoB-wise process explained',
  'which-business-structure-should-you-register': 'Proprietorship vs LLP vs OPC vs Pvt Ltd: which fits you',
  'epfo-wage-ceiling-raised-to-25000': 'EPFO ceiling up to Rs. 25,000: new coverage and what changes',
  'nri-property-tds-no-tan-required-2026': 'Buying property from an NRI: no TAN needed from 1 Oct 2026'
};

function cardHtml(post) {
  const monthYear = post.date ? monthLabel(post.date) : '';
  const href = 'blog/' + post.slug + '.html';
  const readMore = READ_MORE[post.slug] || 'Read more';
  return '        <a href="' + href + '" class="blog-listing-card" aria-label="Read: ' + htmlEsc(stripHtml(post.h1)) + '">\n' +
    '          <div class="blog-meta">\n' +
    '            <span class="blog-date">' + monthYear + '</span>\n' +
    '            <span class="blog-category">' + htmlEsc(post.category) + '</span>\n' +
    '          </div>\n' +
    '          <h2>' + htmlEsc(stripHtml(post.h1)) + '</h2>\n' +
    '          <p class="blog-excerpt">' + htmlEsc(cleanExcerpt(post.excerpt)) + '</p>\n' +
    '          <span class="read-more">' + readMore + ' <span class="card-arrow" aria-hidden="true">&rarr;</span></span>\n' +
    '        </a>';
}

function monthLabel(iso) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
}
function monthYearFromIso(iso) {
  return monthLabel(iso);
}
function stripHtml(s) {
  return String(s).replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&mdash;/g, '\u2014').replace(/\s+/g, ' ').trim();
}
function cleanExcerpt(s) {
  // cut to ~150 chars at word boundary for listing
  let t = String(s).replace(/\s+/g, ' ').trim();
  if (t.length <= 170) return t;
  const cut = t.slice(0, 170);
  const brk = cut.lastIndexOf(' ');
  return (brk > 0 ? cut.slice(0, brk) : cut) + ' \u2026';
}

function findMatchingDiv(content, openTagStart) {
  // Returns the index of the < in the </div> that closes the <div> opened at openTagStart.
  const re = /<div\b[^>]*>|<\/div>/g;
  re.lastIndex = openTagStart;
  let depth = 0;
  let m;
  while ((m = re.exec(content)) !== null) {
    depth += m[0].charAt(1) === '/' ? -1 : 1;
    if (depth === 0) return m.index;
  }
  return -1;
}

function rebuildBlogHtml(posts) {
  let content = fs.readFileSync(BLOG_HTML, 'utf8');

  // Replace category filter list (keep the same set of filters, all linking to blog.html)
  const filterMatch = content.match(/<div class="category-filters">[\s\S]*?<\/div>/);
  if (filterMatch) {
    const cats = [];
    posts.forEach(function (p) { if (cats.indexOf(p.category) === -1) cats.push(p.category); });
    // ensure standard categories present
    DEFAULT_CATEGORIES.forEach(function (c) { if (cats.indexOf(c) === -1) cats.push(c); });
    const links = ['<a href="blog.html" class="active">All</a>']
      .concat(cats.map(function (c) { return '<a href="blog.html">' + htmlEsc(c) + '</a>'; }));
    const block = '<div class="category-filters">\n' +
      links.map(function (l) { return '        ' + l; }).join('\n') + '\n' +
      '      </div>';
    content = content.replace(filterMatch[0], block);
  }

  // Replace the blog listing grid contents (between <div class="blog-listing-grid"> and its closing </div>)
  const start = content.indexOf('<div class="blog-listing-grid">');
  if (start !== -1) {
    const openEnd = content.indexOf('>', start) + 1;
    const closeEnd = findMatchingDiv(content, start);
    if (closeEnd !== -1) {
      content = content.slice(0, openEnd) + '\n' +
        posts.map(cardHtml).join('\n\n') + '\n\n' +
        content.slice(closeEnd);
    } else {
      // No closing tag found — leave listing untouched rather than corrupt it.
      console.warn('  ! Could not find the closing </div> for .blog-listing-grid in blog.html — listing not auto-updated.');
    }
  } else {
    // No grid found — find the <section class="section"> after hero and insert grid
    console.warn('  ! Could not locate .blog-listing-grid in blog.html — listing not auto-updated.');
  }

  fs.writeFileSync(BLOG_HTML, content, 'utf8');
  console.log('  blog.html listing updated with ' + posts.length + ' post(s).');
  rebuildHomeLatest(posts);
}

/* ============================================================
   Home page "Recent updates" (index.html, between <!--latest-posts--> markers)
   Generated here so the home page always links to the newest posts.
   ============================================================ */
// Pages carrying an auto-updated "recent posts" block.
const LATEST_PAGES = [path.join(ROOT, 'index.html'), path.join(ROOT, 'resources.html')];
const HOME_LATEST_COUNT = 3;

function homeCardHtml(post) {
  const title = htmlEsc(stripHtml(post.h1));
  const excerpt = htmlEsc(cleanExcerpt(post.excerpt.replace(/\s*Call \+91[\d\s]+\.?$/, '')));
  return '        <article class="blog-card">\n' +
    '          <div class="date"><span class="tag">' + htmlEsc(post.category) + '</span><span>' + (post.date ? monthLabel(post.date) : '') + '</span></div>\n' +
    '          <h3><a href="blog/' + post.slug + '.html">' + title + '</a></h3>\n' +
    '          <p>' + excerpt + '</p>\n' +
    '        </article>';
}

function rebuildHomeLatest(posts) {
  const block = '\n      <div class="blog-grid">\n' +
    posts.slice(0, HOME_LATEST_COUNT).map(homeCardHtml).join('\n') + '\n      </div>';
  LATEST_PAGES.forEach(function (file) {
    if (!fs.existsSync(file)) return;
    const content = fs.readFileSync(file, 'utf8');
    const re = /(<!--latest-posts-->)[\s\S]*?(\s*<!--\/latest-posts-->)/;
    if (!re.test(content)) {
      console.warn('  ! ' + path.basename(file) + ' has no <!--latest-posts--> markers — not updated.');
      return;
    }
    fs.writeFileSync(file, content.replace(re, function (m, a, b) { return a + block + b; }), 'utf8');
    console.log('  ' + path.basename(file) + ' recent posts set to the ' + Math.min(HOME_LATEST_COUNT, posts.length) + ' newest.');
  });
}

/* ============================================================
   Sitemap regeneration (blog URLs only)

   Uses scripts/lib/sitemap.js so only the <!-- Blog Posts --> section is
   touched. The old implementation stripped everything from the blog marker
   through </urlset>, which deleted any section listed after it (the careers
   URLs). Sections must stay independent.
   ============================================================ */
function rebuildSitemap(posts, lastmod) {
  const urls = posts.map(function (p) {
    return {
      loc: BASE_URL + '/blog/' + p.slug + '.html',
      lastmod: lastmod,
      changefreq: 'monthly',
      priority: '0.7'
    };
  });

  sitemap.edit(SITEMAP, function (content) {
    return sitemap.upsertSection(content, sitemap.SECTION.BLOG, urls);
  });
  console.log('  sitemap.xml updated with ' + posts.length + ' blog URL(s).');
}

/* ============================================================
   Commands
   ============================================================ */
function cmdList() {
  const drafts = fs.existsSync(DRAFTS_DIR)
    ? fs.readdirSync(DRAFTS_DIR).filter(function (f) { return f.endsWith('.md'); })
    : [];
  console.log('--- Published posts ---');
  readPublishedPosts().forEach(function (p) {
    console.log('  ' + (p.date || '????-??-??') + '  ' + p.slug + '  [' + p.category + ']');
  });
  console.log('--- Drafts (' + drafts.length + ') ---');
  drafts.forEach(function (d) { console.log('  ' + d); });
}

function slugify(s) {
  return String(s).toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/\b(ca|CA)\b/g, 'ca');
}

function cmdNew(args) {
  const slug = slugify(args[0] || 'my-post');
  const title = args.slice(1).join(' ') || 'My New Blog Post';
  const file = path.join(DRAFTS_DIR, slug + '.md');
  if (fs.existsSync(file)) {
    console.error('Draft already exists: ' + file);
    process.exit(1);
  }
  const tmpl = '---\n' +
    'title: ' + title + '\n' +
    'slug: ' + slug + '\n' +
    'category: Compliance\n' +
    'date: ' + todayISO() + '\n' +
    'description: <# Overview of ' + title + ' in up to ~155 characters with the key keyword and location. #>\n' +
    '---\n' +
    '\n' +
    '## Introduction\n' +
    '\n' +
    'Write a short paragraph introducing the topic and why it matters for businesses in Ghaziabad and the NCR.\n' +
    '\n' +
    '## Section One\n' +
    '\n' +
    'Add your content here. Use `##` for sections, `###` for sub-sections, `**bold**` for emphasis, and `[links](https://example.com)` where useful.\n' +
    '\n' +
    '## Checklist\n' +
    '\n' +
    '- First action item\n' +
    '- Second action item\n' +
    '- Third action item\n' +
    '\n' +
    '## How We Can Help\n' +
    '\n' +
    'End with a short paragraph on how clients can reach out. Use the clickable links on the phone number and WhatsApp messenger: call [ +91 88025 86988](tel:+918802586988) or [Chat on WhatsApp](https://wa.me/918802586988?text=Hi%2C%20I%20would%20like%20to%20enquire%20about%20CA%20services.).\n';
  fs.writeFileSync(file, tmpl, 'utf8');
  console.log('Created draft: ' + file);
}

function loadDraft(slug) {
  const file = path.join(DRAFTS_DIR, slug + '.md');
  if (!fs.existsSync(file)) {
    console.error('Draft not found: blog/drafts/' + slug + '.md');
    process.exit(1);
  }
  const raw = fs.readFileSync(file, 'utf8');
  const { fm, body } = parseFrontMatter(raw);
  const title = fm.title || 'Untitled';
  const category = fm.category || 'Compliance';
  const date = fm.date || todayISO();
  let description = fm.description || title;
  const bodyHtml = mdToHtml(body.trim());
  return {
    slug: slug,
    h1: title,
    seoTitle: fm.seo_title || '',
    category: category,
    date: date,
    description: description,
    monthYear: monthYearFromIso(date),
    url: BASE_URL + '/blog/' + slug + '.html',
    bodyHtml: bodyHtml,
    draftPath: file
  };
}

function cmdPublish(args, dryRun) {
  const slug = slugify(args[0] || '');
  if (!slug) { console.error('Usage: publish <slug>'); process.exit(1); }
  const post = loadDraft(slug);
  const html = buildPostHtml(post);
  const target = path.join(BLOG_DIR, slug + '.html');

  console.log('Building post: ' + target);
  if (!dryRun) {
    fs.writeFileSync(target, html, 'utf8');
    // archive draft
    const archived = path.join(PUBLISHED_DIR, slug + '.md');
    fs.renameSync(post.draftPath, archived);
    console.log('  Wrote ' + target);
    console.log('  Archived draft -> ' + archived);
    // update lastmod here today
    const lastmod = todayISO();
    const posts = readPublishedPosts();
    rebuildBlogHtml(posts);
    rebuildSitemap(posts, lastmod);
    console.log('\nDone. Nothing has been deployed yet.');
    console.log('Next step (run yourself so only you trigger the push):');
    console.log('  git add -A');
    console.log('  git commit -m "Publish blog: ' + slug + '"');
    console.log('  git push');
  } else {
    console.log('  (dry run) preview HTML written to stdout target — see preview command instead.');
  }
}

function cmdPreview(args) {
  const slug = slugify(args[0] || '');
  const post = loadDraft(slug);
  const html = buildPostHtml(post);
  const tmp = path.join(process.env.TEMP || osTmp(), 'preview-' + slug + '.html');
  fs.writeFileSync(tmp, html, 'utf8');
  console.log('Preview written to: ' + tmp + '  (open in a browser to review)');
}

function osTmp() {
  const os = require('os');
  return os.tmpdir();
}

/* ============================================================
   CLI
   ============================================================ */
const cmd = process.argv[2];
const args = process.argv.slice(3);

if (!cmd || cmd === 'help' || cmd === '--help') {
  console.log('Weekly blog content pipeline for caashishrajput.com\n');
  console.log('Usage:');
  console.log('  node scripts/blog-build.js new <slug> "<Title>"     Scaffold a new Markdown draft');
  console.log('  node scripts/blog-build.js preview <slug>           Render a draft to a temp HTML file for review');
  console.log('  node scripts/blog-build.js publish <slug>           Publish a draft -> HTML post, rebuild listing + sitemap');
  console.log('  node scripts/blog-build.js rebuild                  Rebuild listing + sitemap from existing posts');
  console.log('  node scripts/blog-build.js home                     Refresh the home page recent-updates block only');
  console.log('  node scripts/blog-build.js list                     List drafts and published posts');
  console.log('\nNothing is committed or pushed by this script.');
  console.log('To deploy to GitHub Pages after publishing, run git add/commit/push yourself.');
  process.exit(0);
}

if (cmd === 'list') { cmdList(); process.exit(0); }
if (cmd === 'new') { cmdNew(args); process.exit(0); }
if (cmd === 'preview') { cmdPreview(args); process.exit(0); }
if (cmd === 'publish') { cmdPublish(args, false); process.exit(0); }
if (cmd === 'home') { rebuildHomeLatest(readPublishedPosts()); process.exit(0); }
if (cmd === 'rebuild') {
  const lastmod = todayISO();
  rebuildBlogHtml(readPublishedPosts());
  rebuildSitemap(readPublishedPosts(), lastmod);
  process.exit(0);
}
console.error('Unknown command: ' + cmd);
process.exit(1);
