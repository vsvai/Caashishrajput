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

function htmlEsc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ============================================================
   Markdown -> HTML (compact; supports the tag set used on this blog)
   ============================================================ */
function mdInline(s) {
  s = s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
  // strong
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  // inline code
  s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
  // links [text](url)
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, function (_, t, u) {
    return '<a href="' + u + '">' + t + '</a>';
  });
  // em
  s = s.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  return s;
}

function mdToHtml(md) {
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const out = [];
  let i = 0;
  let listType = null; // 'ul' | 'ol'

  function closeList() {
    if (listType) { out.push('</' + listType + '>'); listType = null; }
  }

  while (i < lines.length) {
    let line = lines[i];

    if (/^\s*$/.test(line)) { closeList(); out.push(''); i++; continue; }

    // Table
    if (/^\s*\|/.test(line)) {
      closeList();
      const rows = [];
      while (i < lines.length && /^\s*\|/.test(lines[i])) {
        rows.push(lines[i]);
        i++;
      }
      out.push(tableToHtml(rows));
      continue;
    }

    // Headings
    const h3 = line.match(/^###\s+(.*)/);
    if (h3) { closeList(); out.push('<h3>' + mdInline(h3[1]) + '</h3>'); i++; continue; }
    const h2 = line.match(/^##\s+(.*)/);
    if (h2) { closeList(); out.push('<h2>' + mdInline(h2[1]) + '</h2>'); i++; continue; }
    const h1 = line.match(/^#\s+(.*)/);
    if (h1) { closeList(); out.push('<h1>' + mdInline(h1[1]) + '</h1>'); i++; continue; }

    // Unordered list
    const ul = line.match(/^\s*[-*]\s+(.*)/);
    if (ul) {
      if (listType !== 'ul') { closeList(); listType = 'ul'; out.push('<ul>'); }
      out.push('  <li>' + handleNested(mdInline(ul[1])) + '</li>');
      i++; continue;
    }
    // Ordered list
    const ol = line.match(/^\s*\d+\.\s+(.*)/);
    if (ol) {
      if (listType !== 'ol') { closeList(); listType = 'ol'; out.push('<ol>'); }
      out.push('  <li>' + mdInline(ol[1]) + '</li>');
      i++; continue;
    }

    // Paragraph (join continuation lines)
    closeList();
    let para = [line];
    i++;
    while (i < lines.length && !/^\s*$/.test(lines[i]) &&
        !/^\s*[-*]\s/.test(lines[i]) && !/^\s*\d+\.\s/.test(lines[i]) &&
        !/^#{1,3}\s/.test(lines[i]) && !/^\s*\|/.test(lines[i])) {
      para.push(lines[i]);
      i++;
    }
    // preserve single line breaks within a paragraph as <br>
    const text = para.map(function (p) { return mdInline(p.trim()); }).join(' ');
    out.push('<p>' + text + '</p>');
  }
  closeList();
  return out.join('\n\n');
}

function handleNested(s) {
  // Sub-bullets as "A — " descriptions are already inline; nothing special.
  return s;
}

function tableToHtml(rows) {
  // rows are like "| A | B |" ; second row may be "| --- | --- |" separator
  const parsed = rows.map(function (r) {
    return r.replace(/^\s*\|/, '').replace(/\|\s*$/, '')
      .split('|').map(function (c) { return c.trim(); });
  });
  // Drop separator row (---)
  const sepIdx = parsed.findIndex(function (cells) {
    return cells.every(function (c) { return /^:?-+:?$/.test(c); });
  });
  let header = parsed[0];
  let body = parsed.slice(1);
  if (sepIdx !== -1) { body = parsed.slice(sepIdx + 1); }

  let h = '  <table class="due-dates-table">\n    <thead>\n      <tr>\n';
  header.forEach(function (c) { h += '        <th>' + mdInline(c) + '</th>\n'; });
  h += '      </tr>\n    </thead>\n    <tbody>\n';
  body.forEach(function (cells) {
    h += '      <tr>\n';
    cells.forEach(function (c) { h += '        <td>' + mdInline(c) + '</td>\n'; });
    h += '      </tr>\n';
  });
  h += '    </tbody>\n  </table>';
  return h;
}

/* ============================================================
   Front matter parsing
   ============================================================ */
function parseFrontMatter(raw) {
  const fmMatch = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n/);
  if (!fmMatch) throw new Error('Missing YAML front matter (--- blocks at top).');
  const fm = {};
  fmMatch[1].split('\n').forEach(function (line) {
    const m = line.match(/^([A-Za-z@_]+):\s*(.*)$/);
    if (!m || m[1].charAt(0) === '@') return;
    let val = m[2].trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    fm[m[1]] = val;
  });
  const body = raw.slice(fmMatch[0].length);
  return { fm: fm, body: body };
}

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
    priceRange: 'Reasonable and transparent; fees quoted per engagement',
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
      logo: { '@type': 'ImageObject', url: BASE_URL + '/images/logo.png' }
    },
    description: post.description,
    mainEntityOfPage: { '@type': 'WebPage', '@id': post.url }
  };
}
function breadcrumbSchemaJson(post) {
  return {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, item: { '@id': BASE_URL + '/blog/index.html', name: 'Home' } },
      { '@type': 'ListItem', position: 2, item: { '@id': BASE_URL + '/blog/blog.html', name: 'Blog' } },
      { '@type': 'ListItem', position: 3, item: { '@id': post.url, name: post.h1 } }
    ]
  };
}
const SCHEMA_INDENT = '  ';

function buildPostHtml(post) {
  const schemas = [practiceSchemaJson(), personSchemaJson(), articleSchemaJson(post), breadcrumbSchemaJson(post)];
  const schemaBlocks = schemas.map(function (s) {
    return SCHEMA_INDENT + '<script type="application/ld+json">\n' +
      JSON.stringify(s, null, 2).split('\n').map(function (l) { return SCHEMA_INDENT + l; }).join('\n') +
      '\n' + SCHEMA_INDENT + '</script>';
  }).join('\n\n');

  const canonical = post.url;
  const title = post.h1 + ' | CA Ashish Rajput, Ghaziabad';
  const desc = post.description;
  const escDesc = htmlEsc(desc);

  const body = post.bodyHtml
    .split('\n').map(function (l) { return '        ' + l; }).join('\n');

  return '<!DOCTYPE html>\n' +
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
    '  <meta property="og:image" content="' + BASE_URL + '/images/logo.png">\n' +
    '  <meta property="og:site_name" content="' + htmlEsc(SITE_NAME) + '">\n' +
    '  <meta property="article:published_time" content="' + post.date + '">\n' +
    '  <meta property="article:author" content="' + AUTHOR + '">\n' +
    '  <meta name="twitter:card" content="summary">\n' +
    '  <meta name="twitter:title" content="' + htmlEsc(title) + '">\n' +
    '  <meta name="twitter:description" content="' + escDesc + '">\n' +
    '\n' +
    '  <link rel="stylesheet" href="../css/style.css">\n' +
    '  <link rel="icon" type="image/png" href="../images/logo.png">\n' +
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
    '      <h2>Blog</h2>\n' +
    '      <p>Tax updates, compliance guides, and practical information</p>\n' +
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
    '            <source srcset="../images/hero.avif" type="image/avif">\n' +
    '            <source srcset="../images/hero.webp" type="image/webp">\n' +
    '            <img src="../images/logo.png" alt="CA Ashish Rajput, Chartered Accountant" width="72" height="72" loading="lazy">\n' +
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
    '  <script defer src="../js/components.js"></script>\n' +
    '  <script defer src="../js/main.js"></script>\n' +
    '</body>\n' +
    '</html>\n';
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

function cardHtml(post) {
  const monthYear = post.date ? monthLabel(post.date) : '';
  return '        <div class="blog-listing-card">\n' +
    '          <div class="blog-meta">\n' +
    '            <span class="blog-date">' + monthYear + '</span>\n' +
    '            <span class="blog-category">' + htmlEsc(post.category) + '</span>\n' +
    '          </div>\n' +
    '          <h2><a href="blog/' + post.slug + '.html">' + htmlEsc(stripHtml(post.h1)) + '</a></h2>\n' +
    '          <p class="blog-excerpt">' + htmlEsc(cleanExcerpt(post.excerpt)) + '</p>\n' +
    '          <a href="blog/' + post.slug + '.html" class="read-more">Read more &rarr;</a>\n' +
    '        </div>';
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
  const end = content.indexOf('</div>', start);
  if (start !== -1 && end !== -1) {
    const close = content.indexOf('\n    </div>', start);
    const gridBlock = content.slice(start, close !== -1 ? close : end) + '\n';
    // We'll rebuild inner cards only
    const innerStart = content.indexOf('>', content.indexOf('<div class="blog-listing-grid">')) + 1;
    const innerEnd = content.lastIndexOf('\n', end);
    content = content.slice(0, innerStart) + '\n' +
      posts.map(cardHtml).join('\n\n') + '\n\n' +
      content.slice(innerEnd);
  } else {
    // No grid found — find the <section class="section"> after hero and insert grid
    console.warn('  ! Could not locate .blog-listing-grid in blog.html — listing not auto-updated.');
  }

  fs.writeFileSync(BLOG_HTML, content, 'utf8');
  console.log('  blog.html listing updated with ' + posts.length + ' post(s).');
}

/* ============================================================
   Sitemap regeneration (blog URLs only)
   ============================================================ */
function rebuildSitemap(posts, lastmod) {
  let content = fs.readFileSync(SITEMAP, 'utf8');
  // Remove existing blog section comments and entries
  content = content.replace(/[\r\n]*  <!-- Blog Posts -->[\s\S]*?<\/urlset>/, '\n</urlset>');

  const blogSection = '  <!-- Blog Posts -->\n' +
    posts.map(function (p) {
      return '  <url>\n' +
        '    <loc>' + BASE_URL + '/blog/' + p.slug + '.html</loc>\n' +
        '    <lastmod>' + lastmod + '</lastmod>\n' +
        '    <changefreq>monthly</changefreq>\n' +
        '    <priority>0.7</priority>\n' +
        '  </url>';
    }).join('\n') + '\n';

  content = content.replace('</urlset>', blogSection + '</urlset>');
  fs.writeFileSync(SITEMAP, content, 'utf8');
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
    'End with a short paragraph on how clients can reach out, and include the phone number +91 88025 86988 once.\n';
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
  console.log('  node scripts/blog-build.js list                     List drafts and published posts');
  console.log('\nNothing is committed or pushed by this script.');
  console.log('To deploy to GitHub Pages after publishing, run git add/commit/push yourself.');
  process.exit(0);
}

if (cmd === 'list') { cmdList(); process.exit(0); }
if (cmd === 'new') { cmdNew(args); process.exit(0); }
if (cmd === 'preview') { cmdPreview(args); process.exit(0); }
if (cmd === 'publish') { cmdPublish(args, false); process.exit(0); }
if (cmd === 'rebuild') {
  const lastmod = todayISO();
  rebuildBlogHtml(readPublishedPosts());
  rebuildSitemap(readPublishedPosts(), lastmod);
  process.exit(0);
}
console.error('Unknown command: ' + cmd);
process.exit(1);
