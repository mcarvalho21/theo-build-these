import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { hydrationPlan, materializeStructure, scanStructure } from '../src/dev-sync.js';

test('scanStructure ignores node_modules and hashes files', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'dev-sync-'));
  await fs.mkdir(path.join(dir, 'src'), { recursive: true });
  await fs.writeFile(path.join(dir, 'src', 'app.js'), 'hi');
  await fs.mkdir(path.join(dir, 'node_modules/pkg'), { recursive: true });
  await fs.writeFile(path.join(dir, 'node_modules/pkg/index.js'), 'skip');
  const manifest = await scanStructure(dir);
  assert(manifest.some(e => e.path === 'src/app.js' && e.sha256));
  assert(!manifest.some(e => e.path.includes('node_modules')));
});

test('hydrationPlan asks for missing and changed remote files', () => {
  const ops = hydrationPlan([{ type: 'file', path: 'a.txt', sha256: 'old' }], [{ type: 'dir', path: 'src' }, { type: 'file', path: 'a.txt', sha256: 'new', size: 1 }, { type: 'file', path: 'src/b.txt', sha256: 'b', size: 2 }]);
  assert.deepEqual(ops, [{ op: 'mkdir', path: 'src' }, { op: 'refresh', path: 'a.txt', from: 'old', to: 'new' }, { op: 'hydrate', path: 'src/b.txt', sha256: 'b', size: 2 }]);
});

test('materializeStructure creates directories and hydration placeholders', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'dev-sync-mat-'));
  await materializeStructure(dir, [{ type: 'dir', path: 'src' }, { type: 'file', path: 'src/app.js', sha256: 'abc', size: 3 }]);
  const placeholder = JSON.parse(await fs.readFile(path.join(dir, 'src/app.js.hydrate.json'), 'utf8'));
  assert.equal(placeholder.hydrate, 'src/app.js');
});
