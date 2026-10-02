// scripts/careers-build.js — Careers content pipeline.
//
// Mirrors scripts/blog-build.js so vacancies are authored the same way blog
// posts are: a Markdown source file with front matter, rendered to a static,
// fully-SEO'd HTML page. Static HTML matters here — a Googlebot that does not
// run JavaScript still sees the title, description, dates and apply link.
//
// What this script owns (content + SEO):
//   career/<slug>.html          the vacancy detail page, incl. JobPosting JSON-LD
//   career/index.html           the static list inside #vacancy-list (JS then
//                               replaces it with live open/closed state)
//   sitemap.xml                 the public /career URLs
//
// What this script does NOT own (operations, enforced by the database):
//   opening/closing enforcement, duplicate applications, CV access, admin
//   changes. Those live in supabase/migrations/ and are re-checked on every
//   submission regardless of what the HTML says.
//
// Usage:
//   node scripts/careers-build.js new <slug> "<Title>"
//   node scripts/careers-build.js preview <slug>
//   node scripts/careers-build.js publish <slug>
//   node scripts/careers-build.js rebuild
//   node scripts/careers-build.js list
//
// Optional: set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the environment to
// have `publish` also upsert the vacancy into the database. The service role
// key is read from the environment only — never committed, never placed in
// js/careers-config.js. Without it, the script prints the exact SQL to run.
//
// Nothing is committed or pushed. Deployment stays a manual git step, as with
// the blog pipeline.

const fs = require('fs');
const path = require('path');

const { htmlEsc, mdToHtml, parseFrontMatter } = require('./lib/markdown.js');
const sitemap = require('./lib/sitemap.js');

const ROOT = path.join(__dirname, '..');
const CAREERS_DIR = path.join(ROOT, 'careers');
const DRAFTS_DIR = path.join(CAREERS_DIR, 'drafts');
const PUBLISHED_DIR = path.join(CAREERS_DIR, '_published');
const CAREER_HTML_DIR = path.join(ROOT, 'career');
const CAREER_INDEX = path.join(CAREER_HTML_DIR, 'index.html');
const SITEMAP = path.join(ROOT, 'sitemap.xml');

const BASE_URL = 'https://caashishrajput.com';
const SITE_NAME = 'Ashish Jayalata & Associates';
const PRACTICE_DESC = 'Chartered Accountancy practice in Sahibabad, Ghaziabad offering income tax, GST, audit, accounting, and company registration services.';
const IST_OFFSET = '+05:30';

const VACANCY_STATUSES = ['draft', 'published', 'closed'];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function ensureDirs() {
  [CAREERS_DIR, DRAFTS_DIR, PUBLISHED_DIR, CAREER_HTML_DIR].forEach(function (dir) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });
}

/* ============================================================
   Date helpers — the practice works in IST, so a bare date in
   front matter means that date at 00:00 IST.
   ============================================================ */
function toIstInstant(isoDate, endOfDay) {
  if (!isoDate) return null;
  const time = endOfDay ? 'T23:59:00' : 'T00:00:00';
  return isoDate + time + IST_OFFSET;
}

function istDateLabel(isoDate) {
  if (!isoDate) return '';
  const d = new Date(toIstInstant(isoDate, true));
  if (isNaN(d.getTime())) return isoDate;
  return d.toLocaleString('en-US', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });
}

function longDateLabel(isoDate) {
  if (!isoDate) return '';
  const d = new Date(toIstInstant(isoDate, true));
  if (isNaN(d.getTime())) return isoDate;
  return d.toLocaleString('en-US', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' });
}

function truncate(value, max) {
  const s = String(value == null ? '' : value);
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  const brk = cut.lastIndexOf(' ');
  return (brk > 0 ? cut.slice(0, brk) : cut).replace(/[\s,;:.\-]+$/, '');
}

/* ============================================================
   JSON-LD
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

/* Google requires employmentType to be one of a fixed enum. Author-facing
   values ("Full Time", "Part-time") are mapped here rather than trusted, so a
   typo cannot silently produce a JobPosting that Rich Results rejects. */
const EMPLOYMENT_TYPE_ENUM = {
  'full time': 'FULL_TIME',
  'full-time': 'FULL_TIME',
  'fulltime': 'FULL_TIME',
  'permanent': 'FULL_TIME',
  'part time': 'PART_TIME',
  'part-time': 'PART_TIME',
  'intern': 'INTERN',
  'internship': 'INTERN',
  'trainee': 'INTERN',
  'contract': 'CONTRACTOR',
  'contractor': 'CONTRACTOR',
  'freelance': 'CONTRACTOR',
  'temporary': 'TEMPORARY',
  'per diem': 'PER_DIEM',
  'volunteer': 'VOLUNTEER'
};

function schemaEmploymentType(v) {
  return EMPLOYMENT_TYPE_ENUM[String(v.employment_type || '').toLowerCase().trim()] || 'OTHER';
}

function jobPostingJson(v) {
  const posting = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: v.title,
    description: v.descriptionPlain,
    datePosted: toIstInstant(v.opening_date, false),
    // Full timestamp, not just the date: applications stay open until 23:59 IST
    // on the closing date, and a date-only value would be read as expiring at
    // the start of that day.
    validThrough: toIstInstant(v.closing_date, true),
    employmentType: schemaEmploymentType(v),
    hiringOrganization: {
      '@type': 'Organization',
      '@id': BASE_URL + '/#practice',
      name: SITE_NAME,
      sameAs: BASE_URL
    },
    url: BASE_URL + '/career/' + v.slug + '.html',
    directApply: true,
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'LG-3, S-14, Krishna Plaza',
        addressLocality: 'Vrindavan Garden, Sahibabad',
        addressRegion: 'Ghaziabad, Uttar Pradesh',
        postalCode: '201005',
        addressCountry: 'IN'
      }
    },
    applicantLocationRequirements: {
      '@type': 'Country',
      name: 'India'
    }
  };
  if (v.experience_requirement) posting.experienceRequirements = v.experience_requirement;
  if (v.qualification) {
    posting.qualifications = v.qualification.replace(/^\s*[-*]\s*/gm, '').replace(/\n{2,}/g, '\n').trim();
  }
  if (v.skills_required) {
    posting.skills = v.skills_required.replace(/^\s*[-*]\s*/gm, '').split('\n').filter(Boolean).join(', ');
  }
  if (v.stipend_or_salary && /[\d]/.test(v.stipend_or_salary)) {
    // Only emit a structured salary when the figure is machine-readable.
    posting.baseSalary = {
      '@type': 'MonetaryAmount',
      currency: 'INR',
      value: {
        '@type': 'QuantitativeValue',
        minValue: 0,
        unitText: 'YEAR'
      }
    };
  }
  return posting;
}

function breadcrumbJson(v) {
  return {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, item: { '@id': BASE_URL + '/', name: 'Home' } },
      { '@type': 'ListItem', position: 2, item: { '@id': BASE_URL + '/career/', name: 'Careers' } },
      { '@type': 'ListItem', position: 3, item: { '@id': BASE_URL + '/career/' + v.slug + '.html', name: v.title } }
    ]
  };
}

const SCHEMA_INDENT = '  ';

function schemaBlock(obj) {
  return SCHEMA_INDENT + '<script type="application/ld+json">\n' +
    JSON.stringify(obj, null, 2).split('\n').map(function (l) { return SCHEMA_INDENT + l; }).join('\n') +
    '\n' + SCHEMA_INDENT + '</script>';
}

/* ============================================================
   Vacancy source loading
   ============================================================ */
function slugify(s) {
  return String(s).toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function validateVacancy(v) {
  const problems = [];
  if (!v.title) problems.push('title is required');
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(v.slug)) problems.push('slug must be lowercase words separated by hyphens');
  if (!v.location) problems.push('location is required');
  if (!v.opening_date) problems.push('opening_date is required');
  if (!v.closing_date) problems.push('closing_date is required');
  if (v.opening_date && v.closing_date && v.closing_date <= v.opening_date) {
    problems.push('closing_date must be later than opening_date');
  }
  if (VACANCY_STATUSES.indexOf(v.status) === -1) {
    problems.push('status must be one of ' + VACANCY_STATUSES.join(', '));
  }
  if (!v.descriptionPlain) problems.push('the Markdown body (which becomes the job description) is empty');

  const desc = v.metaDescription || '';
  if (desc && (desc.length < 140 || desc.length > 158)) {
    problems.push('description (meta) should be 140-158 characters — currently ' + desc.length);
  }
  if (!desc) problems.push('metaDescription is required (140-158 characters)');

  const title = buildPageTitle(v);
  if (title.length > 60) {
    problems.push('generated <title> is ' + title.length + ' characters, over the 60 limit: "' + title + '"');
  }
  return problems;
}

function buildPageTitle(v) {
  const city = (v.location || 'Ghaziabad').split(',')[0].trim();
  const base = v.title + ' Vacancy in ' + city + ' | CA Ashish Rajput';
  if (base.length <= 60) return base;
  return truncate(v.title, 60 - (' Vacancy in ' + city + ' | CA Ashish Rajput').length) +
    ' Vacancy in ' + city + ' | CA Ashish Rajput';
}

function loadSource(file) {
  const raw = fs.readFileSync(file, 'utf8');
  const { fm, body } = parseFrontMatter(raw);

  const bodyHtml = mdToHtml(body.trim());
  const descriptionPlain = body
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*[-*]\s+/gm, '')
    .replace(/[*`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  return {
    title: fm.title || '',
    slug: fm.slug || slugify(path.basename(file, '.md')),
    location: fm.location || 'Sahibabad, Ghaziabad',
    employment_type: fm.employment_type || 'Full Time',
    experience_requirement: fm.experience_requirement || '',
    stipend_or_salary: fm.stipend_or_salary || '',
    responsibilities: fm.responsibilities || '',
    skills_required: fm.skills_required || '',
    qualification: fm.qualification || '',
    benefits: fm.benefits || '',
    opening_date: fm.opening_date || '',
    closing_date: fm.closing_date || '',
    status: (fm.status || 'draft').toLowerCase(),
    metaDescription: fm.description || '',
    posted_date: fm.posted || fm.opening_date || todayISO(),
    descriptionHtml: bodyHtml,
    descriptionPlain: descriptionPlain,
    sourcePath: file
  };
}

function readAllVacancies() {
  // Published vacancies are authoritative, because their HTML carries the SEO
  // data the listing and sitemap are generated from.
  const out = [];
  if (!fs.existsSync(CAREER_HTML_DIR)) return out;
  fs.readdirSync(CAREER_HTML_DIR).forEach(function (f) {
    if (!f.endsWith('.html') || f === 'index.html') return;
    if (/^(login|register|dashboard|apply|application)\.html$/.test(f)) return;
    const full = path.join(CAREER_HTML_DIR, f);
    const html = fs.readFileSync(full, 'utf8');
    const slug = f.replace(/\.html$/, '');
    out.push({
      slug: slug,
      title: stripHtml((html.match(/<h1>([\s\S]*?)<\/h1>/) || [])[1] || slug),
      metaDescription: decodeMeta(html.match(/<meta name="description" content="([^"]*)"/) || []),
      location: decodeMeta(html.match(/<span class="vac-hero-location">([\s\S]*?)<\/span>/) || []) || 'Ghaziabad',
      status: decodeMeta(html.match(/<body[^>]*data-status="([^"]*)"/) || []) || 'published',
      opening_date: decodeMeta(html.match(/<body[^>]*data-opening="([^"]*)"/) || []),
      closing_date: decodeMeta(html.match(/<body[^>]*data-closing="([^"]*)"/) || []),
      posted: decodeMeta(html.match(/<meta property="article:published_time" content="([^"]*)"/) || []) || todayISO()
    });
  });
  out.sort(function (a, b) { return a.posted < b.posted ? 1 : (a.posted > b.posted ? -1 : 0); });
  return out;
}

function stripHtml(s) {
  return String(s || '').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
}

// Accepts a RegExp match array (or a plain string) and returns group 1 decoded.
function decodeMeta(m) {
  let raw = '';
  if (Array.isArray(m)) raw = m.length > 1 ? m[1] : '';
  else if (m) raw = String(m);
  return raw
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}

/* ============================================================
   HTML rendering
   ============================================================ */
function sectionHtml(heading, markdownBlock, className) {
  if (!markdownBlock) return '';
  return '\n      <h2' + (className ? ' class="' + className + '"' : '') + '>' + htmlEsc(heading) + '</h2>\n' +
    mdToHtml(markdownBlock.trim());
}

function applyPanelHtml(v) {
  const isOpen = v.status === 'published';
  const label = isOpen ? 'Apply Now' : (v.status === 'closed' ? 'Applications Closed' : 'Not Yet Published');
  const href = 'apply.html?slug=' + encodeURIComponent(v.slug);
  const note = isOpen
    ? 'Applications close automatically on ' + htmlEsc(longDateLabel(v.closing_date)) + '.'
    : 'Applications for this position are now closed.';

  return '' +
    '<div class="panel apply-panel">' +
      '<h3>Apply for this position</h3>' +
      (isOpen
        ? '<a class="btn btn-primary" href="' + href + '">' + label + '</a>'
        : '<button type="button" class="btn btn-ghost" disabled aria-disabled="true">' + label + '</button>') +
      '<p>' + note + '</p>' +
      '<noscript><p class="text-small muted">Enable JavaScript to apply online, or email ' +
        '<a href="mailto:ca.ashishrajput@outlook.com">ca.ashishrajput@outlook.com</a> with your CV.</p></noscript>' +
    '</div>';
}

function summaryPanelHtml(v) {
  const rows = [
    ['Location', v.location],
    ['Employment type', v.employment_type],
    ['Experience', v.experience_requirement],
    ['Stipend / salary', v.stipend_or_salary]
  ].filter(function (r) { return r[1]; });

  return '' +
    '<div class="panel">' +
      '<h3>At a glance</h3>' +
      '<dl class="definition-list">' +
      rows.map(function (r) {
        return '<div><dt>' + htmlEsc(r[0]) + '</dt><dd>' + htmlEsc(r[1]) + '</dd></div>';
      }).join('') +
      '</dl>' +
    '</div>' +
    '<div class="panel">' +
      '<h3>Application window</h3>' +
      '<dl class="definition-list">' +
        '<div><dt>Opens</dt><dd>' + htmlEsc(longDateLabel(v.opening_date)) + '</dd></div>' +
        '<div><dt>Closes</dt><dd>' + htmlEsc(longDateLabel(v.closing_date)) + '</dd></div>' +
      '</dl>' +
      '<p class="text-small muted" style="margin-top:.75rem;">All times are India Standard Time (IST).</p>' +
    '</div>';
}

/* Strip trailing whitespace and collapse runs of blank lines, then indent.
   mdToHtml() emits indented continuation lines and the odd run of blank lines;
   left alone they produce a file full of whitespace-only lines, which makes
   the generated HTML painful to read in a diff. */
function tidyAndIndent(html, pad) {
  return html
    .split('\n')
    .map(function (line) { return line.replace(/\s+$/, ''); })
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .split('\n')
    .map(function (line) { return line.length ? pad + line : line; })
    .join('\n');
}

function buildVacancyHtml(v) {
  const title = buildPageTitle(v);
  const desc = v.metaDescription;
  const canonical = BASE_URL + '/career/' + v.slug + '.html';

  const schemas = [practiceSchemaJson(), jobPostingJson(v), breadcrumbJson(v)]
    .map(schemaBlock).join('\n\n');

  const sections = [
    v.descriptionHtml,
    sectionHtml('Key Responsibilities', v.responsibilities),
    sectionHtml('Skills Required', v.skills_required),
    sectionHtml('Qualifications', v.qualification),
    sectionHtml('What We Offer', v.benefits)
  ].filter(Boolean).join('\n');

  const bodyHtml = tidyAndIndent(sections, '          ');

  return '<!DOCTYPE html>\n' +
    '<html lang="en-IN">\n' +
    '<head>\n' +
    '  <meta charset="UTF-8">\n' +
    '  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
    '  <title>' + htmlEsc(title) + '</title>\n' +
    '  <meta name="description" content="' + htmlEsc(desc) + '">\n' +
    '  <link rel="canonical" href="' + canonical + '">\n' +
    '  <meta property="og:type" content="article">\n' +
    '  <meta property="og:title" content="' + htmlEsc(title) + '">\n' +
    '  <meta property="og:description" content="' + htmlEsc(desc) + '">\n' +
    '  <meta property="og:url" content="' + canonical + '">\n' +
    '  <meta property="og:image" content="' + BASE_URL + '/images/logo.png">\n' +
    '  <meta property="og:site_name" content="' + htmlEsc(SITE_NAME) + '">\n' +
    '  <meta property="article:published_time" content="' + v.posted_date + '">\n' +
    '  <meta property="article:author" content="Ashish Rajput">\n' +
    '  <meta name="twitter:card" content="summary">\n' +
    '  <meta name="twitter:title" content="' + htmlEsc(title) + '">\n' +
    '  <meta name="twitter:description" content="' + htmlEsc(desc) + '">\n' +
    '\n' +
    '  <link rel="stylesheet" href="../css/style.css">\n' +
    '  <link rel="stylesheet" href="../css/careers.css">\n' +
    '  <link rel="icon" type="image/png" href="../images/logo-96.png">\n' +
    '\n\n' +
    schemas + '\n' +
    '</head>\n' +
    '<body data-depth="1" data-active="career" data-root="../" data-slug="' + htmlEsc(v.slug) + '"' +
    ' data-status="' + htmlEsc(v.status) + '" data-opening="' + htmlEsc(v.opening_date) + '"' +
    ' data-closing="' + htmlEsc(v.closing_date) + '"' +
    ' data-breadcrumbs=\'' + JSON.stringify([
      { label: 'Home', href: 'index.html' },
      { label: 'Careers', href: 'index.html' },
      { label: v.title }
    ]) + '\'>\n' +
    '  <main>\n' +
    '\n' +
    '  <section class="page-hero">\n' +
    '    <div class="container">\n' +
    '      <h1>' + htmlEsc(v.title) + '</h1>\n' +
    '      <p><span class="vac-hero-location">' + htmlEsc(v.location) + '</span>' +
    (v.employment_type ? ' &middot; ' + htmlEsc(v.employment_type) : '') + '</p>\n' +
    '    </div>\n' +
    '  </section>\n' +
    '\n' +
    '  <section class="section">\n' +
    '    <div class="container">\n' +
    '      <div class="vacancy-detail">\n' +
    '        <div class="vacancy-body">\n' +
    '\n' + bodyHtml + '\n' +
    '\n' +
    '        </div>\n' +
    '        <aside class="vacancy-aside">\n' +
    applyPanelHtml(v) +
    summaryPanelHtml(v) +
    '          <div class="panel">' +
    '            <h3>Questions?</h3>' +
    '            <p class="text-small muted" style="margin:0;">Call <a href="tel:+918802586988">+91 88025 86988</a> or email ' +
    '              <a href="mailto:ca.ashishrajput@outlook.com">ca.ashishrajput@outlook.com</a>.</p>' +
    '          </div>' +
    '        </aside>\n' +
    '      </div>\n' +
    '    </div>\n' +
    '  </section>\n' +
    '\n' +
    '  <section class="section section-alt">\n' +
    '    <div class="container">\n' +
    '      <h2 class="section-title">Other Positions</h2>\n' +
    '      <div id="career-related" class="related-services"><!--careers:related--></div>\n' +
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
   career/index.html static list + ItemList JSON-LD
   ============================================================ */
function listingCardHtml(v) {
  const open = v.status === 'published';
  return '' +
    '<article class="vacancy-card' + (open ? '' : ' is-closed') + '">' +
      '<div>' +
        '<h3><a href="' + htmlEsc(v.slug) + '.html">' + htmlEsc(v.title) + '</a></h3>' +
        '<div class="vacancy-meta">' +
          '<span>' + htmlEsc(v.location) + '</span>' +
        '</div>' +
        (open
          ? '<div class="vacancy-note">Applications close on ' + htmlEsc(istDateLabel(v.closing_date)) + '.</div>'
          : '<div class="vacancy-note">Applications for this position are now closed.</div>') +
      '</div>' +
      '<div class="vacancy-actions">' +
        '<span class="tag ' + (open ? 'tag-open">Accepting Applications<' : 'tag-closed">Applications Closed<') + '/span>' +
        '<a href="' + htmlEsc(v.slug) + '.html" class="btn btn-ghost btn-sm">View Details</a>' +
      '</div>' +
    '</article>';
}

function replaceBetween(content, startMarker, endMarker, replacement) {
  const startIdx = content.indexOf(startMarker);
  const endIdx = content.indexOf(endMarker);
  if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) return null;
  return content.slice(0, startIdx + startMarker.length) + '\n' + replacement + '\n      ' +
    content.slice(endIdx);
}

function rebuildCareerIndex(vacancies) {
  if (!fs.existsSync(CAREER_INDEX)) return;

  const open = vacancies.filter(function (v) { return v.status === 'published'; });
  const closed = vacancies.filter(function (v) { return v.status === 'closed'; });

  let content = fs.readFileSync(CAREER_INDEX, 'utf8');

  const openHtml = open.length
    ? open.map(listingCardHtml).join('\n')
    : '<div class="empty-state"><h3>No open positions at the moment</h3><p>Please check back soon, or email ' +
      '<a href="mailto:ca.ashishrajput@outlook.com">ca.ashishrajput@outlook.com</a> with your CV.</p></div>';

  content = replaceBetween(content, '<!--careers:list:start-->', '<!--careers:list:end-->', openHtml);

  const closedHtml = closed.length
    ? closed.slice(0, 12).map(listingCardHtml).join('\n')
    : '<p class="muted text-small">No positions have closed recently.</p>';
  content = replaceBetween(content, '<!--careers:closed:start-->', '<!--careers:closed:end-->', closedHtml);

  // ItemList JSON-LD for the vacancies currently published.
  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Current vacancies at ' + SITE_NAME,
    itemListElement: open.map(function (v, i) {
      return {
        '@type': 'ListItem',
        position: i + 1,
        url: BASE_URL + '/career/' + v.slug + '.html',
        name: v.title
      };
    })
  };
  const block = '  <script type="application/ld+json">\n' +
    JSON.stringify(itemList, null, 2).split('\n').map(function (l) { return '  ' + l; }).join('\n') +
    '\n  </script>';
  content = replaceBetween(content, '<!-- careers:itemlist -->', '<!-- /careers:itemlist -->', block);

  fs.writeFileSync(CAREER_INDEX, content, 'utf8');
  console.log('  career/index.html static listing updated (' + open.length + ' open, ' + closed.length + ' closed).');
}

/* ============================================================
   Sitemap — public /career URLs only

   Uses scripts/lib/sitemap.js so only the <!-- Careers --> section is
   touched. Rebuilding careers must not delete the blog URLs, and rebuilding
   the blog must not delete these.
   ============================================================ */
function rebuildSitemap(vacancies) {
  const urls = [
    { loc: BASE_URL + '/career/', lastmod: todayISO(), changefreq: 'weekly', priority: '0.8' }
  ].concat(vacancies.map(function (v) {
    return {
      loc: BASE_URL + '/career/' + v.slug + '.html',
      lastmod: v.posted || todayISO(),
      changefreq: v.status === 'published' ? 'weekly' : 'monthly',
      priority: '0.7'
    };
  }));

  sitemap.edit(SITEMAP, function (content) {
    return sitemap.upsertSection(content, sitemap.SECTION.CAREERS, urls);
  });
  console.log('  sitemap.xml updated with ' + urls.length + ' career URL(s).');
}

/* ============================================================
   Legal Pages — static pages that were previously never listed in
   sitemap.xml. Kept here so `careers-build rebuild` heals the sitemap
   without a hand edit.
   ============================================================ */
const LEGAL_PAGES = [
  { file: 'pages/privacy-policy.html', lastmod: '2026-08-10', priority: '0.4' }
];

function rebuildLegalSection() {
  const present = LEGAL_PAGES.filter(function (p) {
    return fs.existsSync(path.join(ROOT, p.file));
  });
  if (!present.length) return;

  const urls = present.map(function (p) {
    return {
      loc: BASE_URL + '/' + p.file,
      lastmod: p.lastmod,
      changefreq: 'yearly',
      priority: p.priority
    };
  });

  sitemap.edit(SITEMAP, function (content) {
    return sitemap.upsertSection(content, sitemap.SECTION.LEGAL, urls);
  });
  console.log('  sitemap.xml updated with ' + urls.length + ' legal page URL(s).');
}

/* ============================================================
   Optional Supabase sync (ops, not content)
   ============================================================ */
async function syncToSupabase(v) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) return null;
  if (typeof fetch !== 'function') {
    console.log('  ! SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are set but this Node build has no global fetch.');
    console.log('    Run the SQL printed below from the Supabase SQL editor instead.');
    return null;
  }

  const res = await fetch(url + '/rest/v1/rpc/admin_upsert_vacancy', {
    method: 'POST',
    headers: {
      'apikey': key,
      'Authorization': 'Bearer ' + key,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      p_title: v.title,
      p_slug: v.slug,
      p_description: v.descriptionPlain,
      p_location: v.location,
      p_employment_type: v.employment_type,
      p_experience_requirement: v.experience_requirement,
      p_stipend_or_salary: v.stipend_or_salary,
      p_responsibilities: v.responsibilities,
      p_skills_required: v.skills_required,
      p_qualification: v.qualification,
      p_benefits: v.benefits,
      p_opening_date: toIstInstant(v.opening_date, false),
      p_closing_date: toIstInstant(v.closing_date, true),
      p_status: v.status
    })
  });

  if (!res.ok) {
    console.log('  ! Supabase sync failed: HTTP ' + res.status + ' — ' + (await res.text()).slice(0, 300));
    return false;
  }
  return true;
}

function printManualSql(v) {
  const q = function (s) { return s ? String(s).replace(/'/g, "''") : ''; };
  console.log('\n  To publish this vacancy in the admin panel, run in the Supabase SQL editor:\n');
  console.log('    select public.admin_upsert_vacancy(');
  console.log("      p_title => " + JSON.stringify(v.title) + ',');
  console.log("      p_slug => " + JSON.stringify(v.slug) + ',');
  console.log('      p_description => ' + JSON.stringify(truncate(v.descriptionPlain, 4000)) + ',');
  console.log("      p_location => " + JSON.stringify(v.location) + ',');
  console.log("      p_employment_type => " + JSON.stringify(v.employment_type) + ',');
  console.log("      p_experience_requirement => " + JSON.stringify(v.experience_requirement) + ',');
  console.log("      p_stipend_or_salary => " + JSON.stringify(v.stipend_or_salary) + ',');
  console.log("      p_responsibilities => " + JSON.stringify(q(v.responsibilities)) + ',');
  console.log("      p_skills_required => " + JSON.stringify(q(v.skills_required)) + ',');
  console.log("      p_qualification => " + JSON.stringify(q(v.qualification)) + ',');
  console.log("      p_benefits => " + JSON.stringify(q(v.benefits)) + ',');
  console.log("      p_opening_date => " + JSON.stringify(toIstInstant(v.opening_date, false)) + '::timestamptz,');
  console.log("      p_closing_date => " + JSON.stringify(toIstInstant(v.closing_date, true)) + '::timestamptz,');
  console.log("      p_status => " + JSON.stringify(v.status));
  console.log('    );\n');
}

/* ============================================================
   Commands
   ============================================================ */
function cmdNew(args) {
  ensureDirs();
  const slug = slugify(args[0] || 'new-vacancy');
  const title = args.slice(1).join(' ') || 'New Position';
  const file = path.join(DRAFTS_DIR, slug + '.md');
  if (fs.existsSync(file)) {
    console.error('Draft already exists: ' + file);
    process.exit(1);
  }

  const today = todayISO();
  const close = new Date(Date.parse(toIstInstant(today, false)) + 30 * 86400000).toISOString().slice(0, 10);

  const tmpl = '---\n' +
    'title: ' + title + '\n' +
    'slug: ' + slug + '\n' +
    'location: Sahibabad, Ghaziabad\n' +
    'employment_type: Full Time\n' +
    'experience_requirement: Fresher or 1-2 years\n' +
    'stipend_or_salary: As per qualifications and experience\n' +
    'opening_date: ' + today + '\n' +
    'closing_date: ' + close + '\n' +
    'status: draft\n' +
    'posted: ' + today + '\n' +
    'description: <Meta description, 140-158 characters, with the role and the location.>\n' +
    'responsibilities: |\n' +
    '  - First responsibility\n' +
    '  - Second responsibility\n' +
    'skills_required: |\n' +
    '  - Tally\n' +
    '  - GST\n' +
    'qualification: |\n' +
    '  - B.Com or equivalent\n' +
    'benefits: |\n' +
    '  - Training under a practising CA\n' +
    '---\n' +
    '\n' +
    '## About this position\n' +
    '\n' +
    'Write two or three short paragraphs describing the role, who it suits, and what the work involves.\n' +
    'This is the job description candidates read first, so keep it plain and specific.\n';

  fs.writeFileSync(file, tmpl, 'utf8');
  console.log('Created draft: ' + file);
}

function cmdList() {
  ensureDirs();
  const drafts = fs.existsSync(DRAFTS_DIR)
    ? fs.readdirSync(DRAFTS_DIR).filter(function (f) { return f.endsWith('.md'); })
    : [];
  console.log('--- Published vacancy pages ---');
  readAllVacancies().forEach(function (v) {
    console.log('  ' + v.posted + '  ' + v.status.padEnd(10) + v.slug + '  (closes ' + v.closing_date + ')');
  });
  console.log('--- Drafts (' + drafts.length + ') ---');
  drafts.forEach(function (d) { console.log('  ' + d); });
}

function resolveSource(slug) {
  const draft = path.join(DRAFTS_DIR, slug + '.md');
  const archived = path.join(PUBLISHED_DIR, slug + '.md');
  if (fs.existsSync(draft)) return draft;
  if (fs.existsSync(archived)) return archived;
  console.error('Vacancy source not found: careers/drafts/' + slug + '.md');
  process.exit(1);
}

async function cmdPublish(args) {
  ensureDirs();
  const slug = slugify(args[0] || '');
  if (!slug) { console.error('Usage: publish <slug>'); process.exit(1); }

  const source = resolveSource(slug);
  const v = loadSource(source);

  const problems = validateVacancy(v);
  if (problems.length) {
    console.error('Cannot publish ' + slug + ' — fix these first:');
    problems.forEach(function (p) { console.error('  - ' + p); });
    process.exit(1);
  }

  const target = path.join(CAREER_HTML_DIR, slug + '.html');
  fs.writeFileSync(target, buildVacancyHtml(v), 'utf8');
  console.log('  Wrote ' + target);

  // Archive the source so the drafts folder only holds work in progress.
  if (source === path.join(DRAFTS_DIR, slug + '.md')) {
    fs.renameSync(source, path.join(PUBLISHED_DIR, slug + '.md'));
    console.log('  Archived source -> careers/_published/' + slug + '.md');
  }

  const all = readAllVacancies();
  rebuildCareerIndex(all);
  rebuildSitemap(all);
  rebuildLegalSection();

  const synced = await syncToSupabase(v);
  if (synced === null) printManualSql(v);
  else if (synced) console.log('  Vacancy upserted into Supabase.');

  console.log('\nDone. Nothing has been deployed yet.');
  console.log('Next step (run yourself so only you trigger the push):');
  console.log('  git add -A');
  console.log('  git commit -m "Publish vacancy: ' + slug + '"');
  console.log('  git push');
}

function cmdPreview(args) {
  const slug = slugify(args[0] || '');
  const v = loadSource(resolveSource(slug));
  const problems = validateVacancy(v);
  if (problems.length) {
    console.warn('Preview warnings:');
    problems.forEach(function (p) { console.warn('  - ' + p); });
    console.warn('');
  }
  const tmp = path.join(require('os').tmpdir(), 'preview-vacancy-' + slug + '.html');
  fs.writeFileSync(tmp, buildVacancyHtml(v), 'utf8');
  console.log('Preview written to: ' + tmp + '  (open in a browser to review)');
}

function cmdRebuild() {
  ensureDirs();
  const all = readAllVacancies();
  rebuildCareerIndex(all);
  rebuildSitemap(all);
  rebuildLegalSection();
}

/* ============================================================
   CLI
   ============================================================ */
const cmd = process.argv[2];
const args = process.argv.slice(3);

if (!cmd || cmd === 'help' || cmd === '--help') {
  console.log('Careers content pipeline for caashishrajput.com\n');
  console.log('Usage:');
  console.log('  node scripts/careers-build.js new <slug> "<Title>"   Scaffold a vacancy Markdown source');
  console.log('  node scripts/careers-build.js preview <slug>         Render a vacancy to a temp HTML file');
  console.log('  node scripts/careers-build.js publish <slug>         Publish -> career/<slug>.html, rebuild listing + sitemap');
  console.log('  node scripts/careers-build.js rebuild                Rebuild career/index.html + sitemap from published pages');
  console.log('  node scripts/careers-build.js list                   List published vacancies and drafts');
  console.log('\nTo also upsert into Supabase, set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the');
  console.log('environment. Otherwise the script prints the SQL to run in the Supabase SQL editor.');
  console.log('\nNothing is committed or pushed by this script.');
  process.exit(0);
}

switch (cmd) {
  case 'list':
    cmdList();
    break;
  case 'new':
    cmdNew(args);
    break;
  case 'preview':
    cmdPreview(args);
    break;
  case 'rebuild':
    cmdRebuild();
    break;
  case 'publish':
    // Async: keep the dispatch switch from falling through to the catch-all.
    cmdPublish(args).then(function () { process.exit(0); }).catch(function (e) {
      console.error(e);
      process.exit(1);
    });
    return;
  default:
    console.error('Unknown command: ' + cmd);
    console.error('Run "node scripts/careers-build.js help" for usage.');
    process.exit(1);
}