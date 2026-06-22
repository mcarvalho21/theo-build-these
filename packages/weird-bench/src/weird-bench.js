import fs from 'node:fs/promises';
import path from 'node:path';

export async function loadFixture(dir) {
  const manifestPath = path.join(dir, 'bench.json');
  const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
  const prompt = await fs.readFile(path.join(dir, manifest.promptFile || 'prompt.md'), 'utf8');
  const expected = manifest.expectedFile
    ? await fs.readFile(path.join(dir, manifest.expectedFile), 'utf8')
    : manifest.expected;
  return { dir, manifest, prompt, expected };
}

export function scoreOutput(output, fixture) {
  const mode = fixture.manifest.scorer || 'exact-trimmed';
  const actual = String(output ?? '');
  const expected = String(fixture.expected ?? '');

  if (mode === 'exact-trimmed') {
    const pass = actual.trim() === expected.trim();
    return { pass, score: pass ? 1 : 0, mode, notes: pass ? [] : ['trimmed output did not exactly match expected'] };
  }

  if (mode === 'contains-all') {
    const missing = (fixture.manifest.mustContain || []).filter(token => !actual.includes(token));
    return { pass: missing.length === 0, score: missing.length === 0 ? 1 : 0, mode, notes: missing.map(token => `missing: ${token}`) };
  }

  throw new Error(`Unknown scorer: ${mode}`);
}

export async function runFixture(dir, command) {
  const fixture = await loadFixture(dir);
  const output = await command(fixture.prompt, fixture);
  const result = scoreOutput(output, fixture);
  return { name: fixture.manifest.name || path.basename(dir), ...result, output };
}

export function summarizeResults(results) {
  const total = results.length;
  const passed = results.filter(result => result.pass).length;
  const score = total === 0 ? 0 : results.reduce((sum, result) => sum + Number(result.score || 0), 0) / total;
  return { total, passed, failed: total - passed, score };
}

export function resultToJsonlLine(result) {
  return JSON.stringify({
    name: result.name,
    pass: Boolean(result.pass),
    score: Number(result.score || 0),
    mode: result.mode,
    notes: result.notes || []
  });
}

export function summaryToJsonlLine(results) {
  return JSON.stringify({ type: 'summary', ...summarizeResults(results) });
}
