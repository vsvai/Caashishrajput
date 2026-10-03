// scripts/build-chrome.js — write the shared header, breadcrumbs, footer and
// WhatsApp button into every HTML page. Markup lives in scripts/lib/site-chrome.js.
//
// Usage:  npm run chrome
//
// Safe to re-run: blocks between <!--chrome:*--> markers are replaced, not
// duplicated. The blog and careers builders call stamp() themselves, so this
// is only needed after editing site-chrome.js or adding a page by hand.

const fs = require('fs');
const path = require('path');
const { stamp } = require('./lib/site-chrome.js');

const ROOT = path.join(__dirname, '..');
const SKIP_DIRS = new Set(['.git', 'node_modules', 'supabase', 'scripts']);

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(function (e) {
    if (e.isDirectory()) return SKIP_DIRS.has(e.name) ? [] : walk(path.join(dir, e.name));
    return e.name.endsWith('.html') ? [path.join(dir, e.name)] : [];
  });
}

let changed = 0, skipped = 0;
walk(ROOT).forEach(function (file) {
  const html = fs.readFileSync(file, 'utf8');
  // Pages without data-depth on <body> (e.g. the Google verification file)
  // never used the shared chrome.
  if (!/<body\b[^>]*\bdata-depth=/.test(html)) { skipped++; return; }
  const out = stamp(html);
  if (out !== html) { fs.writeFileSync(file, out, 'utf8'); changed++; }
});
console.log('Site chrome: ' + changed + ' page(s) updated, ' + skipped + ' skipped.');
