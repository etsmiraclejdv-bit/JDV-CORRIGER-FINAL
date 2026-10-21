import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const ROOT = process.cwd();
const APP_ROOT = path.join(ROOT, 'src', 'app');
const SOURCE_ROOTS = ['src/app', 'src/components', 'src/contexts', 'src/lib'];
const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.css']);
const CONFLICT_MARKERS = [
  /^<<<<<<<(?: .*)?$/m,
  /^=======$/m,
  /^>>>>>>>?(?: .*)?$/m,
];

async function walk(directory) {
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error?.code === 'ENOENT') return [];
    throw error;
  }
  const files = [];
  for (const entry of entries) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(fullPath)));
    else if (SOURCE_EXTENSIONS.has(path.extname(entry.name))) files.push(fullPath);
  }
  return files;
}

function routeFromPageFile(file) {
  const relative = path.relative(APP_ROOT, path.dirname(file)).split(path.sep).join('/');
  const segments = relative.split('/').filter(Boolean);
  const visible = segments.filter((segment) => !/^\(.*\)$/.test(segment) && !segment.startsWith('@'));
  return '/' + visible.map((segment) => segment.startsWith('[') ? segment : segment).join('/');
}

test('full-app demo audit: the app has discoverable page routes', async () => {
  const files = await walk(APP_ROOT);
  const pages = files.filter((file) => /^page\.(tsx|ts|jsx|js)$/.test(path.basename(file)));
  assert.ok(pages.length > 0, 'No page.* files found under src/app');
  const routes = pages.map(routeFromPageFile).sort();
  const duplicates = routes.filter((route, index) => routes.indexOf(route) !== index);
  assert.deepEqual([...new Set(duplicates)], [], 'Duplicate route paths detected');
  console.log('[JDV demo audit] Route inventory (' + routes.length + ' pages):');
  for (const route of routes) console.log('  ' + (route === '/' ? '/' : route));
});

test('full-app demo audit: source files contain no unresolved merge markers', async () => {
  const files = (await Promise.all(SOURCE_ROOTS.map((root) => walk(path.join(ROOT, root))))).flat();
  const findings = [];
  for (const file of files) {
    const source = await readFile(file, 'utf8');
    if (CONFLICT_MARKERS.some((pattern) => pattern.test(source))) {
      findings.push(path.relative(ROOT, file).split(path.sep).join('/'));
    }
  }
  assert.deepEqual(findings, [], 'Unresolved merge markers found in: ' + findings.join(', '));
});

test('full-app demo audit: each page file is non-empty and readable', async () => {
  const files = await walk(APP_ROOT);
  const pages = files.filter((file) => /^page\.(tsx|ts|jsx|js)$/.test(path.basename(file)));
  const invalid = [];
  for (const file of pages) {
    const source = await readFile(file, 'utf8');
    if (!source.trim() || source.trim().length < 20) invalid.push(path.relative(ROOT, file));
  }
  assert.deepEqual(invalid, [], 'Empty or suspiciously short page files: ' + invalid.join(', '));
});
