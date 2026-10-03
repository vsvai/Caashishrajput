// scripts/serve.js — zero-dependency static server for local preview.
//
// Usage:  npm run serve        (http://localhost:8080)
//
// Mirrors GitHub Pages closely enough for testing: serves files (gzipped when
// the client accepts it),
// maps "/" to index.html, and answers unknown paths with 404.html (as GitHub Pages does)
// and a 404 status.

const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ROOT = path.join(__dirname, '..');
const PORT = parseInt(process.env.PORT || '8080', 10);
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json',
  '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.avif': 'image/avif', '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon', '.woff2': 'font/woff2'
};

http.createServer(function (req, res) {
  let rel = decodeURIComponent(req.url.split('?')[0].split('#')[0]);
  if (rel.endsWith('/')) rel += 'index.html';
  const file = path.normalize(path.join(ROOT, rel));
  if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
  fs.readFile(file, function (err, data) {
    if (err) {
      res.writeHead(404, { 'Content-Type': TYPES['.html'] });
      return res.end(fs.readFileSync(path.join(ROOT, '404.html')));
    }
    const type = TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream';
    // gzip text responses, as GitHub Pages does, so local measurements are realistic.
    if (/text|javascript|json|xml|svg/.test(type) && /\bgzip\b/.test(req.headers['accept-encoding'] || '')) {
      res.writeHead(200, { 'Content-Type': type, 'Content-Encoding': 'gzip', 'Vary': 'Accept-Encoding' });
      return res.end(zlib.gzipSync(data));
    }
    res.writeHead(200, { 'Content-Type': type });
    res.end(data);
  });
}).listen(PORT, function () {
  console.log('Serving ' + ROOT + ' at http://localhost:' + PORT);
});
