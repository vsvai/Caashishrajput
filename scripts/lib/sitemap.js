// scripts/lib/sitemap.js — section-safe sitemap.xml editing.
//
// sitemap.xml is edited by more than one build script (blog posts, careers, and
// hand-maintained pages). Each owns a named section marked with an HTML comment:
//
//   <!-- Main Pages -->  ... <url>...</url> ...
//   <!-- Blog Posts -->
//   <!-- Careers -->
//   <!-- Legal Pages -->
//
// The previous approach — strip from a marker to </urlset>, then re-append —
// silently deleted every section that happened to sit after the one being
// rebuilt. Rebuilding the blog wiped the careers URLs, and rebuilding careers
// would have wiped the blog URLs. These helpers only ever touch their own
// section, so the build scripts can run in any order, repeatedly.

const fs = require('fs');

const SITEMAP_MARKER_RE = /^\s*<!--\s*[^-][^>]*-->/;

function indent(text, pad) {
  return String(text)
    .split('\n')
    .map(function (line) { return line.length ? pad + line : line; })
    .join('\n');
}

/**
 * Remove one named section's <url> entries, leaving every other section alone.
 * Returns the sitemap content unchanged if the marker is absent.
 */
function removeSection(content, marker) {
  const start = content.indexOf(marker);
  if (start === -1) return content;

  const markerEnd = start + marker.length;

  // The section runs until the next marker comment or the end of <urlset>.
  let stop = content.length;
  const nextMarker = content.indexOf('<!--', markerEnd);
  if (nextMarker !== -1) stop = nextMarker;
  const urlsetEnd = content.indexOf('</urlset>', markerEnd);
  if (urlsetEnd !== -1 && urlsetEnd < stop) stop = urlsetEnd;

  const section = content.slice(markerEnd, stop);
  const cleaned = section.replace(/[ \t]*<url>[\s\S]*?<\/url>[ \t]*\r?\n?/g, '');

  return content.slice(0, markerEnd) + cleaned + content.slice(stop);
}

/**
 * Replace one named section with the given <url> entries.
 *
 * `urls` is an array of { loc, lastmod, changefreq, priority } objects.
 * The section marker is created if it does not exist yet.
 */
function upsertSection(content, marker, urls) {
  // If the marker is missing, append a fresh section just before </urlset>.
  if (content.indexOf(marker) === -1) {
    const block = indent(marker + '\n' + renderUrls(urls), '  ');
    return content.replace('</urlset>', block + '\n</urlset>');
  }

  const base = removeSection(content, marker);

  // Locate the (now empty) marker again and insert straight after it.
  const start = base.indexOf(marker);
  const insertAt = start + marker.length;
  const block = '\n' + indent(renderUrls(urls), '  ');
  return base.slice(0, insertAt) + block + base.slice(insertAt);
}

/** Remove an entire section, marker included. */
function deleteSection(content, marker) {
  const start = content.indexOf(marker);
  if (start === -1) return content;

  const markerEnd = start + marker.length;
  let stop = content.length;
  const nextMarker = content.indexOf('<!--', markerEnd);
  if (nextMarker !== -1) stop = nextMarker;
  const urlsetEnd = content.indexOf('</urlset>', markerEnd);
  if (urlsetEnd !== -1 && urlsetEnd < stop) stop = urlsetEnd;

  let section = content.slice(start, stop);
  // Drop the marker plus the (already removed) url blocks, then tidy blank lines.
  section = section.replace(/[ \t]*<url>[\s\S]*?<\/url>[ \t]*\r?\n?/g, '').replace(/[\r\n]+$/, '');
  if (section === marker) return content.slice(0, start) + content.slice(stop);

  return content.slice(0, start) + section + content.slice(stop);
}

function renderUrls(urls) {
  return (urls || []).map(function (u) {
    return '<url>\n' +
      '  <loc>' + u.loc + '</loc>\n' +
      (u.lastmod ? '  <lastmod>' + u.lastmod + '</lastmod>\n' : '') +
      (u.changefreq ? '  <changefreq>' + u.changefreq + '</changefreq>\n' : '') +
      (u.priority ? '  <priority>' + u.priority + '</priority>\n' : '') +
      '</url>';
  }).join('\n');
}

/**
 * Section names, so callers cannot drift apart by typo.
 */
const SECTION = {
  MAIN: '<!-- Main Pages -->',
  BLOG: '<!-- Blog Posts -->',
  CAREERS: '<!-- Careers -->',
  LEGAL: '<!-- Legal Pages -->'
};

/** Read, transform and write the sitemap. */
function edit(file, fn) {
  let content = fs.readFileSync(file, 'utf8');
  content = fn(content);
  fs.writeFileSync(file, content, 'utf8');
}

module.exports = {
  removeSection,
  upsertSection,
  deleteSection,
  renderUrls,
  edit,
  SECTION,
  SITEMAP_MARKER_RE
};