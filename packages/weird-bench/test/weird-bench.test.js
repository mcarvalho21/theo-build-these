import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadFixture, resultToJsonlLine, runFixture, scoreOutput, summarizeResults, summaryToJsonlLine } from '../src/weird-bench.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixtureDir = path.join(__dirname, '..', 'fixtures', 'reverse-string');
const regexFixtureDir = path.join(__dirname, '..', 'fixtures', 'regex-output');

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

test('JSONL helpers emit compact result lines and aggregate summaries', () => {
  const results = [
    { name: 'a', pass: true, score: 1, mode: 'exact-trimmed', output: 'large output omitted' },
    { name: 'b', pass: false, score: 0, mode: 'contains-all', notes: ['missing: x'] }
  ];

  assert.deepEqual(summarizeResults(results), { total: 2, passed: 1, failed: 1, score: 0.5 });
  assert.equal(resultToJsonlLine(results[0]), '{"name":"a","pass":true,"score":1,"mode":"exact-trimmed","notes":[]}');
  assert.equal(summaryToJsonlLine(results), '{"type":"summary","total":2,"passed":1,"failed":1,"score":0.5}');
});


test('scoreOutput supports regex scoring with missing pattern diagnostics', async () => {
  const fixture = await loadFixture(regexFixtureDir);
  const pass = scoreOutput(`status: ok
files: 3
`, fixture);
  assert.equal(pass.pass, true);
  assert.equal(pass.score, 1);

  const fail = scoreOutput(`status: nope
files: none
`, fixture);
  assert.equal(fail.pass, false);
  assert.deepEqual(fail.notes, ['missing pattern: status:\\s*ok', 'missing pattern: files:\\s*\\d+']);
});

test('regex scorer validates fixture patterns', () => {
  assert.throws(() => scoreOutput('anything', { manifest: { scorer: 'regex', patterns: [] }, expected: '' }), /non-empty string patterns/);
});
