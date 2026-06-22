import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { applyHydrationPlan, hydrationPlan, ignored, materializeStructure, parseSyncIgnore, scanStructure } from '../src/dev-sync.js';

test('parseSyncIgnore handles comments, blanks, globs, and negation', () => {
  assert.deepEqual(parseSyncIgnore('\n# skip generated output\ndist/**\n!important.txt\n'), ['dist/**', '!important.txt']);
  assert.equal(ignored('dist/app.js', ['dist/**']), true);
  assert.equal(ignored('dist/keep.txt', ['dist/**', '!dist/keep.txt']), false);
  assert.equal(ignored('src/debug.log', ['*.log']), true);
});

test('scanStructure reads .syncignore and hashes files', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'dev-sync-'));
  await fs.mkdir(path.join(dir, 'src'), { recursive: true });
  await fs.writeFile(path.join(dir, 'src', 'app.js'), 'hi');
  await fs.writeFile(path.join(dir, 'src', 'debug.log'), 'skip');
  await fs.writeFile(path.join(dir, '.syncignore'), '*.log\n');
  await fs.mkdir(path.join(dir, 'node_modules/pkg'), { recursive: true });
  await fs.writeFile(path.join(dir, 'node_modules/pkg/index.js'), 'skip');
  const manifest = await scanStructure(dir);
  assert(manifest.some(e => e.path === 'src/app.js' && e.sha256));
  assert(manifest.some(e => e.path === '.syncignore'));
  assert(!manifest.some(e => e.path.includes('node_modules')));
  assert(!manifest.some(e => e.path.endsWith('.log')));
});

test('hydrationPlan asks for missing, changed, replaced, and optional deleted paths', () => {
  const ops = hydrationPlan(
    [{ type: 'file', path: 'a.txt', sha256: 'old' }, { type: 'file', path: 'src', sha256: 'file' }, { type: 'file', path: 'local-only.txt', sha256: 'x' }],
    [{ type: 'dir', path: 'src' }, { type: 'file', path: 'a.txt', sha256: 'new', size: 1 }, { type: 'file', path: 'src/b.txt', sha256: 'b', size: 2 }],
    { includeDeletes: true }
  );
  assert.deepEqual(ops, [
    { op: 'replace', path: 'src', fromType: 'file', toType: 'dir' },
    { op: 'refresh', path: 'a.txt', from: 'old', to: 'new', size: 1 },
    { op: 'hydrate', path: 'src/b.txt', sha256: 'b', size: 2 },
    { op: 'delete-local', path: 'local-only.txt', type: 'file' }
  ]);
});

test('materializeStructure creates directories and rich hydration placeholders', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'dev-sync-mat-'));
  await materializeStructure(dir, [{ type: 'dir', path: 'src' }, { type: 'file', path: 'src/app.js', sha256: 'abc', size: 3 }], { source: 'test-remote' });
  const placeholder = JSON.parse(await fs.readFile(path.join(dir, 'src/app.js.hydrate.json'), 'utf8'));
  assert.equal(placeholder.devSync, 'hydrate-placeholder/v1');
  assert.equal(placeholder.path, 'src/app.js');
  assert.equal(placeholder.source, 'test-remote');
  assert.deepEqual(placeholder.apply, { op: 'hydrate', target: 'src/app.js' });
});

test('applyHydrationPlan writes placeholders for hydrate and refresh ops only', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'dev-sync-apply-'));
  const remote = [{ type: 'dir', path: 'src' }, { type: 'file', path: 'src/app.js', sha256: 'abc', size: 3 }];
  await applyHydrationPlan(dir, [{ op: 'mkdir', path: 'src' }, { op: 'hydrate', path: 'src/app.js', sha256: 'abc', size: 3 }], remote);
  const placeholder = JSON.parse(await fs.readFile(path.join(dir, 'src/app.js.hydrate.json'), 'utf8'));
  assert.equal(placeholder.sha256, 'abc');
});
