// scripts/lib/markdown.js — shared Markdown/HTML helpers.
//
// Extracted verbatim from scripts/blog-build.js so the careers pipeline renders
// vacancy descriptions with exactly the same Markdown rules as the blog. The
// implementations are unchanged, so blog output is byte-identical (verified by
// diffing preview output before and after this extraction).
//
// Supported, because that is what the site uses:
//   `##` / `###` headings, paragraphs, `**bold**`, `*em*`, `inline code`,
//   `[links](url)`, `-` bullet / `1.` numbered lists, and Markdown tables
//   (rendered with the site's `.due-dates-table` style).

function htmlEsc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

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

/**
 * Parses `---` delimited YAML-ish front matter. Values are kept as flat
 * strings; block scalars (`|`) are collected until the next key at column 0,
 * which is all the vacancy source format needs.
 */
function parseFrontMatter(raw) {
  const fmMatch = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n/);
  if (!fmMatch) throw new Error('Missing YAML front matter (--- blocks at top).');

  const lines = fmMatch[1].split('\n');
  const fm = {};
  let blockKey = null;
  let blockLines = [];

  function flushBlock() {
    if (!blockKey) return;
    fm[blockKey] = blockLines.join('\n').trim();
    blockKey = null;
    blockLines = [];
  }

  lines.forEach(function (line) {
    // A key starts at column 0. Matching it ends any block scalar in progress,
    // so the next block key is not swallowed as block content.
    const m = line.match(/^([A-Za-z@_]+):\s*(.*)$/);
    if (m && m[1].charAt(0) !== '@') {
      flushBlock();
      let val = m[2].trim();
      if (val === '|' || val === '>') {
        blockKey = m[1];
        blockLines = [];
        return;
      }
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      fm[m[1]] = val;
      return;
    }
    if (blockKey) blockLines.push(line);
  });
  flushBlock();

  const body = raw.slice(fmMatch[0].length);
  return { fm: fm, body: body };
}

module.exports = {
  htmlEsc: htmlEsc,
  mdInline: mdInline,
  mdToHtml: mdToHtml,
  parseFrontMatter: parseFrontMatter,
  tableToHtml: tableToHtml
};