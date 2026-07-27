#!/usr/bin/env node
// scripts/seo-update.js — Adds canonical, OG, Twitter Cards, standardizes titles
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SITE = 'https://caashishrajput.com';

// All pages to process
const pages = [
  // Root pages
  { file: 'index.html', canonical: '/', ogType: 'website' },
  { file: 'about.html', canonical: '/about.html', ogType: 'website' },
  { file: 'services.html', canonical: '/services.html', ogType: 'website' },
  { file: 'contact.html', canonical: '/contact.html', ogType: 'website' },
  { file: 'resources.html', canonical: '/resources.html', ogType: 'website' },
  { file: 'blog.html', canonical: '/blog.html', ogType: 'website' },
  // Service pages
  { file: 'services/income-tax.html', canonical: '/services/income-tax.html', ogType: 'website' },
  { file: 'services/gst.html', canonical: '/services/gst.html', ogType: 'website' },
  { file: 'services/statutory-audit.html', canonical: '/services/statutory-audit.html', ogType: 'website' },
  { file: 'services/internal-audit.html', canonical: '/services/internal-audit.html', ogType: 'website' },
  { file: 'services/tax-audit.html', canonical: '/services/tax-audit.html', ogType: 'website' },
  { file: 'services/company-llp-registration.html', canonical: '/services/company-llp-registration.html', ogType: 'website' },
  { file: 'services/trust-society-ngo-registration.html', canonical: '/services/trust-society-ngo-registration.html', ogType: 'website' },
  { file: 'services/msme-udyam-registration.html', canonical: '/services/msme-udyam-registration.html', ogType: 'website' },
  { file: 'services/import-export-code-iec.html', canonical: '/services/import-export-code-iec.html', ogType: 'website' },
  { file: 'services/fssai-registration.html', canonical: '/services/fssai-registration.html', ogType: 'website' },
  { file: 'services/lei-certificate.html', canonical: '/services/lei-certificate.html', ogType: 'website' },
  { file: 'services/accounting-bookkeeping.html', canonical: '/services/accounting-bookkeeping.html', ogType: 'website' },
  { file: 'services/business-advisory.html', canonical: '/services/business-advisory.html', ogType: 'website' },
  { file: 'services/business-plan-financial-projections.html', canonical: '/services/business-plan-financial-projections.html', ogType: 'website' },
  { file: 'services/asset-valuation.html', canonical: '/services/asset-valuation.html', ogType: 'website' },
  { file: 'services/charities-trust-audits.html', canonical: '/services/charities-trust-audits.html', ogType: 'website' },
  { file: 'services/corporate-representation.html', canonical: '/services/corporate-representation.html', ogType: 'website' },
  // Blog posts
  { file: 'blog/gst-due-dates-july-2026.html', canonical: '/blog/gst-due-dates-july-2026.html', ogType: 'article', date: '2026-07-01' },
  { file: 'blog/income-tax-advance-tax-instalments-fy2025-26.html', canonical: '/blog/income-tax-advance-tax-instalments-fy2025-26.html', ogType: 'article', date: '2026-06-15' },
  { file: 'blog/llp-annual-compliance-requirements-2026.html', canonical: '/blog/llp-annual-compliance-requirements-2026.html', ogType: 'article', date: '2026-05-01' },
  { file: 'blog/icai-code-of-ethics-2026-website-rules.html', canonical: '/blog/icai-code-of-ethics-2026-website-rules.html', ogType: 'article', date: '2026-04-01' },
  { file: 'blog/gst-annual-return-gstr9-fy2025-26.html', canonical: '/blog/gst-annual-return-gstr9-fy2025-26.html', ogType: 'article', date: '2026-07-15' },
  // Utility
  { file: 'pages/privacy-policy.html', canonical: '/pages/privacy-policy.html', ogType: 'website' },
];

// Standardized title suffix
const TITLE_SUFFIX = '| CA Ashish Rajput, Ghaziabad';

function extractTitle(html) {
  const m = html.match(/<title>(.*?)<\/title>/s);
  return m ? m[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>') : '';
}

function extractDescription(html) {
  const m = html.match(/<meta\s+name="description"\s+content="(.*?)"/s);
  return m ? m[1] : '';
}

function standardizeTitle(title) {
  // Remove old suffixes
  let t = title
    .replace(/\s*\|\s*Ashish Jayalata\s*&\s*Associates\s*\|\s*Chartered Accountant,\s*Sahibabad,\s*Ghaziabad\s*$/i, '')
    .replace(/\s*\|\s*Ashish Jayalata\s*&\s*Associates\s*\|\s*CA,\s*Sahibabad,\s*Ghaziabad\s*$/i, '')
    .replace(/\s*\|\s*Ashish Jayalata\s*and\s*Associates\s*\|\s*CA,\s*Sahibabad,\s*Ghaziabad\s*$/i, '')
    .replace(/\s*\|\s*CA Ashish Rajput,\s*Ghaziabad\s*$/i, '')
    .replace(/\s*\|\s*CA,\s*Sahibabad,\s*Ghaziabad\s*$/i, '')
    .replace(/\s*\|\s*Chartered Accountant,\s*Sahibabad,\s*Ghaziabad\s*$/i, '')
    .trim();
  return t + ' ' + TITLE_SUFFIX;
}

function buildSeoHead(page) {
  const filePath = path.join(ROOT, page.file);
  let html = fs.readFileSync(filePath, 'utf8');

  const oldTitle = extractTitle(html);
  const desc = extractDescription(html);
  const newTitle = standardizeTitle(oldTitle);
  const canonicalUrl = SITE + page.canonical;

  // Build meta block
  let meta = '';
  meta += `  <link rel="canonical" href="${canonicalUrl}">\n`;
  meta += `  <meta property="og:type" content="${page.ogType}">\n`;
  meta += `  <meta property="og:title" content="${newTitle.replace(/"/g, '&quot;')}">\n`;
  meta += `  <meta property="og:description" content="${desc.replace(/"/g, '&quot;')}">\n`;
  meta += `  <meta property="og:url" content="${canonicalUrl}">\n`;
  meta += `  <meta property="og:image" content="${SITE}/images/logo.png">\n`;
  meta += `  <meta property="og:site_name" content="Ashish Jayalata &amp; Associates">\n`;
  if (page.ogType === 'article' && page.date) {
    meta += `  <meta property="article:published_time" content="${page.date}">\n`;
    meta += `  <meta property="article:author" content="Ashish Rajput">\n`;
  }
  meta += `  <meta name="twitter:card" content="summary">\n`;
  meta += `  <meta name="twitter:title" content="${newTitle.replace(/"/g, '&quot;')}">\n`;
  meta += `  <meta name="twitter:description" content="${desc.replace(/"/g, '&quot;')}">\n`;

  // Replace title
  html = html.replace(
    /<title>.*?<\/title>/s,
    `<title>${newTitle.replace(/&/g, '&amp;')}</title>`
  );

  // Insert meta block after description (or after title if no description)
  const descMatch = html.match(/(<meta\s+name="description"\s+content=".*?">)/s);
  if (descMatch) {
    html = html.replace(descMatch[1], descMatch[1] + '\n' + meta);
  } else {
    // Insert after title
    const titleMatch = html.match(/(<title>.*?<\/title>)/s);
    if (titleMatch) {
      html = html.replace(titleMatch[1], titleMatch[1] + '\n' + meta);
    }
  }

  fs.writeFileSync(filePath, html, 'utf8');
  return { file: page.file, title: newTitle };
}

// Process all pages
console.log('Processing SEO updates...\n');
pages.forEach(p => {
  try {
    const result = buildSeoHead(p);
    console.log(`✓ ${result.file}`);
  } catch (err) {
    console.error(`✗ ${p.file}: ${err.message}`);
  }
});

console.log(`\nDone. Processed ${pages.length} files.`);
