#!/usr/bin/env node
/**
 * Serves `docs/` the way GitHub Pages does, so URLs can be checked locally:
 *
 *   /privacy        → docs/privacy.html        (extensionless .html)
 *   /blog           → 301 /blog/               (a directory)
 *   /blog/          → docs/blog/index.html
 *   anything else   → docs/404.html with status 404
 *
 *   node scripts/serve.mjs            # port 4391
 *   PORT=8080 node scripts/serve.mjs
 *
 * (`astro preview` does not reproduce the 301 and 404 behaviour exactly.)
 */

import { createServer } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../docs/', import.meta.url));
const PORT = Number(process.env.PORT ?? 4391);
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.json': 'application/json',
};

const isFile = (p) => existsSync(p) && statSync(p).isFile();
const isDir = (p) => existsSync(p) && statSync(p).isDirectory();

createServer((req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  const path = decodeURIComponent(url.pathname);
  const full = normalize(join(ROOT, path));
  if (!full.startsWith(ROOT.slice(0, -1))) return void res.writeHead(400).end();

  const send = (file, status = 200) => {
    res.writeHead(status, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
    res.end(readFileSync(file));
  };

  if (isFile(full)) return send(full);
  if (isDir(full)) {
    if (!path.endsWith('/')) return void res.writeHead(301, { location: path + '/' + url.search }).end();
    if (isFile(join(full, 'index.html'))) return send(join(full, 'index.html'));
  }
  if (isFile(`${full}.html`)) return send(`${full}.html`);
  send(join(ROOT, '404.html'), 404);
}).listen(PORT, () => console.log(`docs/ on http://localhost:${PORT}`));
