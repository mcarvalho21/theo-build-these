import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadFixture, runFixture, scoreOutput } from '../src/weird-bench.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixtureDir = path.join(__dirname, '..', 'fixtures', 'reverse-string');

test('loadFixture reads prompt and expected output', async () => {
  const fixture = await loadFixture(fixtureDir);
  assert.equal(fixture.manifest.name, 'reverse-string-smoke');
  assert.match(fixture.prompt, /Felix builds bigger/);
  assert.equal(fixture.expected.trim(), '.reggib sdliub xileF');
});

test('scoreOutput supports exact-trimmed scoring', async () => {
  const fixture = await loadFixture(fixtureDir);
  assert.equal(scoreOutput(' .reggib sdliub xileF\n', fixture).pass, true);
  assert.equal(scoreOutput('wrong', fixture).pass, false);
});

test('runFixture returns a benchmark result', async () => {
  const result = await runFixture(fixtureDir, async () => '.reggib sdliub xileF\n');
  assert.equal(result.name, 'reverse-string-smoke');
  assert.equal(result.pass, true);
  assert.equal(result.score, 1);
});
