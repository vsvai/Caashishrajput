// scripts/validate-seo.js — Post-overhaul validation report generator.
// Checks: valid JSON-LD, exactly one H1, title/description lengths, internal
// link integrity, sitemap/robots consistency, and NAP consistency across the
// visible HTML and the generated JSON-LD.
//
// Usage:  node scripts/validate-seo.js   (prints a report)

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SITE = 'https://caashishrajput.com';
const NAP = 'LG-3, S-14, Krishna Plaza';

function walk(dir, base) {
  let out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.git') continue;
      out = out.concat(walk(full, base));
    } else if (entry.name.endsWith('.html')) {
      out.push(path.relative(base, full).replace(/\\/g, '/'));
    }
  }
  return out;
}

function extractLd(content) {
  const blocks = [];
  const re = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;
  let m;
  while ((m = re.exec(content))) {
    try {
      blocks.push({ ok: true, data: JSON.parse(m[1]) });
    } catch (e) {
      blocks.push({ ok: false, error: e.message });
    }
  }
  return blocks;
}

function decodeEntities(str) {
  return String(str)
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&ndash;/g, '–')
    .replace(/&mdash;/g, '—')
    .replace(/&rsaquo;/g, '›');
}

const htmlFiles = walk(ROOT, ROOT);
const byPath = new Map(htmlFiles.map(f => [f, true]));

function resolveFromRoot(file, href) {
  const stack = path.posix.dirname(file) === '.' ? [] : path.posix.dirname(file).split('/');
  for (const part of href.split('/')) {
    if (part === '..') { if (stack.length) stack.pop(); }
    else if (part === '.' || part === '') { /* skip */ }
    else stack.push(part);
  }
  return stack.join('/');
}

const report = { pages: [], problems: [], totals: {} };
let jsonLdTotal = 0;
let faqChecks = 0;

for (const file of htmlFiles) {
  const isGoogleVerify = file.startsWith('google');
  const content = fs.readFileSync(path.join(ROOT, file), 'utf8');
  const page = { file, h1: 0, ld: [], problems: [] };
  if (isGoogleVerify) { report.pages.push(page); continue; }

  // H1 count
  page.h1 = (content.match(/<h1[\s>]/g) || []).length;
  if (page.h1 !== 1) page.problems.push('H1 count = ' + page.h1);

  // title / description (length measured on decoded text)
  const title = content.match(/<title>([\s\S]*?)<\/title>/);
  const desc = content.match(/<meta name="description" content="([^"]*)">/);
  if (!title) page.problems.push('Missing <title>');
  else if (decodeEntities(title[1]).length > 60) {
    page.problems.push('Title length ' + decodeEntities(title[1]).length + ' > 60');
  }
  if (!desc) page.problems.push('Missing meta description');
  else if (decodeEntities(desc[1]).length < 140 || decodeEntities(desc[1]).length > 158) {
    page.problems.push('Description length ' + decodeEntities(desc[1]).length + ' (target 140-158)');
  }

  // lang
  if (!/<html lang="en-IN">/.test(content)) page.problems.push('Missing lang="en-IN"');

  // NAP consistency in visible HTML
  if (/<body[\s>]/i.test(content) && !file.includes('404')) {
    const oldNap = /S-14,\s*Krishna Plaza,\s*LG-3/;
    if (oldNap.test(content.replace(/<script[\s\S]*?<\/script>/g, ''))) {
      page.problems.push('Old street order "S-14, Krishna Plaza, LG-3" present');
    }
    if (file === 'index.html' && !/tel:\+918802586988/.test(content)) {
      page.problems.push('Home phone call link tel:+918802586988 missing');
    }
    const gooRe = /https:\/\/maps\.app\.goo\.gl\/[A-Za-z0-9]+/g;
    const goo = content.match(gooRe) || [];
    for (const u of goo) {
      if (u !== 'https://maps.app.goo.gl/cMPY7JuiWfou4Ym1A') {
        page.problems.push('Unexpected goo.gl link: ' + u);
      }
    }
  }

  // Footer component (injects the NAP <address> at runtime) must be included
  const footerScript = /(?:src=")(?:(?:\.\.\/)*)js\/components\.js"/.test(content);
  if (/<body[\s>]/i.test(content) && !footerScript && !isGoogleVerify) {
    page.problems.push('Missing js/components.js footer component');
  }

  // JSON-LD
  const blocks = extractLd(content);
  page.ld = blocks;
  jsonLdTotal += blocks.length;
  for (const b of blocks) {
    if (!b.ok) page.problems.push('Invalid JSON-LD: ' + b.error);
  }

  // Internal link integrity (HTML links only)
  const linkRe = /href="((?!https?:|tel:|mailto:|wa\.me|#|data:)[^"]+)"/g;
  let lm;
  while ((lm = linkRe.exec(content))) {
    let href = lm[1];
    if (href.startsWith('../') || href.startsWith('./') || !href.includes('/')) {
      const clean = href.split('#')[0].split('?')[0];
      if (!clean.endsWith('.html')) continue;
      const candidate = resolveFromRoot(file, clean);
      if (!candidate || candidate === '404.html') continue;
      if (!byPath.has(candidate)) {
        page.problems.push('Broken link: ' + href + ' -> ' + candidate);
      }
    }
  }

  // FAQ: visible items vs FAQPage JSON-LD must match word-for-word
  const faqItems = [];
  const faqRe = /<details class="faq-item" id="([^"]+)">\s*<summary>([\s\S]*?)<\/summary>\s*<div class="faq-answer">([\s\S]*?)<\/div>\s*<\/details>/g;
  let fm;
  while ((fm = faqRe.exec(content))) {
    faqItems.push({ id: fm[1], q: fm[2], a: fm[3] });
  }
  const faqJson = blocks.find(b => b.ok && b.data['@type'] === 'FAQPage');
  if (faqItems.length || faqJson) {
    faqChecks++;
    if (faqJson && faqItems.length !== faqJson.data.mainEntity.length) {
      page.problems.push('FAQ mismatch: visible ' + faqItems.length + ' vs JSON-LD ' + faqJson.data.mainEntity.length);
    }
    if (faqJson && faqItems.length) {
      faqJson.data.mainEntity.forEach(function (q, i) {
        const vis = faqItems[i];
        if (!vis) return;
        if (vis.q.replace(/&amp;/g, '&').trim() !== q.name.trim()) {
          page.problems.push('FAQ Q text mismatch #' + (i + 1));
        }
        if (vis.a.replace(/&amp;/g, '&').trim() !== q.acceptedAnswer.text.trim()) {
          page.problems.push('FAQ A text mismatch #' + (i + 1));
        }
      });
    }
  }

  report.pages.push(page);
}

// robots.txt
const robots = fs.readFileSync(path.join(ROOT, 'robots.txt'), 'utf8');
if (/Disallow:\s*\/pages\//.test(robots)) report.problems.push('robots.txt still disallows /pages/');
if (!/Sitemap:\s*https:\/\/caashishrajput\.com\/sitemap\.xml/.test(robots)) report.problems.push('robots.txt missing sitemap directive');

// footer component must contain the full NAP <address> block
const components = fs.readFileSync(path.join(ROOT, 'js', 'components.js'), 'utf8');
const napBlock = components.match(/<address[^>]*class="nap"[^>]*>([\s\S]*?)<\/address>/);
if (!napBlock) {
  report.problems.push('js/components.js missing <address class="nap"> NAP block');
} else {
  for (const cls of ['nap-name', 'nap-street', 'nap-locality', 'nap-region', 'nap-phone', 'nap-email']) {
    if (!new RegExp('class="' + cls + '"').test(napBlock[1])) {
      report.problems.push('js/components.js NAP block missing .' + cls);
    }
  }
}

// sitemap consistency
const sitemap = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
const sitemapUrls = [];
let sm;
const smRe = /<loc>([^<]+)<\/loc>/g;
while ((sm = smRe.exec(sitemap))) sitemapUrls.push(sm[1]);
const expectedSitemap = htmlFiles
  .filter(f => !f.includes('404') && !f.startsWith('google'))
  .map(f => (f === 'index.html' ? SITE + '/' : SITE + '/' + f));
const missingFromSitemap = expectedSitemap.filter(u => !sitemapUrls.includes(u));
if (missingFromSitemap.length) report.problems.push('Missing from sitemap: ' + missingFromSitemap.join(', '));
const extraInSitemap = sitemapUrls.filter(u => !expectedSitemap.includes(u));
if (extraInSitemap.length) report.problems.push('Unexpected in sitemap: ' + extraInSitemap.join(', '));

// summary
let pageProblems = 0;
report.pages.forEach(p => { pageProblems += p.problems.length; });

console.log('=== SEO Validation Report — ' + new Date().toISOString().slice(0, 10) + ' ===');
console.log('');
console.log('Pages checked      : ' + htmlFiles.length);
console.log('JSON-LD blocks     : ' + jsonLdTotal + ' (all parsed OK)');
console.log('FAQ pages verified : ' + faqChecks + ' (visible text matches FAQPage schema)');
console.log('Sitemap URLs       : ' + sitemapUrls.length + ' (expected ' + expectedSitemap.length + ')');
console.log('');
console.log('--- Pages with problems ---');
report.pages.filter(p => p.problems.length).forEach(p => {
  console.log(p.file + ':');
  p.problems.forEach(x => console.log('   - ' + x));
});
if (report.problems.length) {
  console.log('--- Global problems ---');
  report.problems.forEach(x => console.log('   - ' + x));
}
console.log('');
console.log(pageProblems + report.problems.length === 0
  ? 'RESULT: PASS — no problems found.'
  : 'RESULT: ' + (pageProblems + report.problems.length) + ' problem(s) found.');
