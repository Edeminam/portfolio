#!/usr/bin/env node
/**
 * Sync shared HTML partials into every page.
 *
 * The site ships as plain static HTML (no build step at deploy time), so shared
 * blocks — nav, dock, testimonials, trusted-by, contact, footer, scripts — are
 * kept once in /partials and copied into each page between marker comments:
 *
 *   <!-- partial:dock dockHref="index.html" dockLabel="HOME" -->
 *   ...generated markup...
 *   <!-- /partial:dock -->
 *
 * Placeholders:
 *   {{root}}  relative path from the page to the site root ("" or "../")
 *   {{name}}  any attribute on the opening marker, falling back to the
 *             partial's defaults declared in its first-line comment:
 *             <!-- defaults: dockHref="case-study.html" dockLabel="WORK" -->
 *
 * Usage:
 *   node scripts/sync-partials.mjs          rewrite pages in place
 *   node scripts/sync-partials.mjs --check  exit 1 if any page is out of date
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname, relative, posix } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PARTIALS_DIR = join(ROOT, 'partials');
const CHECK_ONLY = process.argv.includes('--check');

const MARKER = /^([ \t]*)<!-- partial:([\w-]+)((?:\s+[\w-]+="[^"]*")*)\s*-->\n[\s\S]*?^[ \t]*<!-- \/partial:\2 -->$/gm;
const ATTR = /([\w-]+)="([^"]*)"/g;
const DEFAULTS = /^<!-- defaults:((?:\s+[\w-]+="[^"]*")*)\s*-->\n/;

const parseAttrs = (str = '') => Object.fromEntries([...str.matchAll(ATTR)].map(([, k, v]) => [k, v]));

function loadPartials() {
  const partials = new Map();
  for (const file of readdirSync(PARTIALS_DIR).filter((f) => f.endsWith('.html'))) {
    let body = readFileSync(join(PARTIALS_DIR, file), 'utf8');
    const match = body.match(DEFAULTS);
    const defaults = match ? parseAttrs(match[1]) : {};
    if (match) body = body.slice(match[0].length);
    partials.set(file.replace(/\.html$/, ''), { body: body.replace(/\n+$/, ''), defaults });
  }
  return partials;
}

function listPages() {
  const pagesDir = join(ROOT, 'pages');
  return [
    ...readdirSync(ROOT).filter((f) => f.endsWith('.html')).map((f) => join(ROOT, f)),
    ...readdirSync(pagesDir).filter((f) => f.endsWith('.html')).map((f) => join(pagesDir, f)),
  ];
}

function render(partial, vars, indent, pageFile) {
  const html = partial.body.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    if (!(key in vars)) throw new Error(`${pageFile}: no value for {{${key}}}`);
    return vars[key];
  });
  return html
    .split('\n')
    .map((line) => (line ? indent + line : line))
    .join('\n');
}

const partials = loadPartials();
const stale = [];

for (const file of listPages()) {
  const rel = relative(ROOT, file);
  const depth = rel.split(/[\\/]/).length - 1;
  const root = posix.join(...Array(depth).fill('..'), '/').replace(/^\/$/, '');
  const source = readFileSync(file, 'utf8');

  const output = source.replace(MARKER, (_, indent, name, attrs) => {
    const partial = partials.get(name);
    if (!partial) throw new Error(`${rel}: unknown partial "${name}"`);
    const vars = { root, ...partial.defaults, ...parseAttrs(attrs) };
    return [
      `${indent}<!-- partial:${name}${attrs} -->`,
      render(partial, vars, indent, rel),
      `${indent}<!-- /partial:${name} -->`,
    ].join('\n');
  });

  if (output !== source) {
    stale.push(rel);
    if (!CHECK_ONLY) writeFileSync(file, output);
  }
}

if (CHECK_ONLY && stale.length) {
  console.error(`Partials out of date in:\n  ${stale.join('\n  ')}\nRun: npm run sync`);
  process.exit(1);
}
console.log(stale.length ? `Updated ${stale.length} page(s):\n  ${stale.join('\n  ')}` : 'All pages up to date.');
