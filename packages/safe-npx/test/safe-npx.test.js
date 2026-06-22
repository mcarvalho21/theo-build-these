import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildReport,
  lifecycleScripts,
  parseArgs,
  parsePackageSpec,
  renderReport,
  resolveVersion,
  scorePackage,
  evaluatePolicy
} from '../src/safe-npx.js';

test('parsePackageSpec handles unscoped, versions, and scoped packages', () => {
  assert.deepEqual(parsePackageSpec('vite'), { name: 'vite', range: 'latest' });
  assert.deepEqual(parsePackageSpec('vite@5.0.0'), { name: 'vite', range: '5.0.0' });
  assert.deepEqual(parsePackageSpec('@scope/tool'), { name: '@scope/tool', range: 'latest' });
  assert.deepEqual(parsePackageSpec('@scope/tool@1.2.3'), { name: '@scope/tool', range: '1.2.3' });
});

test('parseArgs separates safe-npx flags from package passthrough args', () => {
  assert.deepEqual(parseArgs(['pkg@latest', '--json', '--', '--help']), {
    json: true,
    dryRun: false,
    yes: false,
    registry: 'https://registry.npmjs.org',
    policyPath: null,
    maxRisk: null,
    packageSpec: 'pkg@latest',
    passthrough: ['--help']
  });
});

test('lifecycleScripts extracts install-time hooks only', () => {
  assert.deepEqual(lifecycleScripts({ scripts: { test: 'node --test', postinstall: 'node x.js', prepare: 'tsc' } }), {
    postinstall: 'node x.js',
    prepare: 'tsc'
  });
});

test('buildReport produces agent-readable package risk metadata', () => {
  const metadata = {
    name: 'is-0dd',
    description: 'fixture',
    'dist-tags': { latest: '1.0.0' },
    maintainers: [{ name: 'alice' }],
    time: { '1.0.0': '2026-01-01T00:00:00.000Z' },
    versions: {
      '1.0.0': {
        name: 'is-0dd',
        version: '1.0.0',
        bin: { 'is-0dd': './cli.js' },
        scripts: { postinstall: 'node postinstall.js' },
        dependencies: Object.fromEntries(Array.from({ length: 12 }, (_, i) => [`dep-${i}`, '^1.0.0'])),
        dist: { tarball: 'https://example.test/pkg.tgz', unpackedSize: 2048, fileCount: 4, integrity: 'sha512-test' }
      }
    }
  };
  const version = resolveVersion(metadata, 'latest');
  const report = buildReport(metadata, version);
  assert.equal(report.version, '1.0.0');
  assert.equal(report.dependencyCount, 12);
  assert.equal(report.risk.level, 'medium');
  assert.match(renderReport(report), /lifecycle scripts: postinstall/);
});

test('scorePackage flags missing bin for npx commands', () => {
  const scored = scorePackage({ metadata: { maintainers: [] }, pkg: { name: 'left-pad', dependencies: {} } });
  assert.equal(scored.level, 'medium');
  assert(scored.reasons.some(reason => reason.includes('no bin entry')));
});


test('evaluatePolicy blocks high-risk and lifecycle-script packages for agent guard use', () => {
  const decision = evaluatePolicy({
    package: 'risky',
    requestedRange: 'latest',
    risk: { level: 'high', score: 80, reasons: [] },
    bins: [{ name: 'risky', path: 'cli.js' }],
    lifecycleScripts: { postinstall: 'node x.js' }
  }, { maxRisk: 'medium', denyLifecycleScripts: true, requirePinnedVersion: true });
  assert.equal(decision.allowed, false);
  assert(decision.reasons.some(reason => reason.includes('risk level')));
  assert(decision.reasons.some(reason => reason.includes('lifecycle')));
  assert(decision.reasons.some(reason => reason.includes('unpinned')));
});

test('evaluatePolicy allows pinned low-risk executable packages', () => {
  const decision = evaluatePolicy({
    package: 'create-vite',
    requestedRange: '9.0.7',
    risk: { level: 'low', score: 0, reasons: [] },
    bins: [{ name: 'create-vite', path: 'index.js' }],
    lifecycleScripts: {}
  }, { maxRisk: 'low', requirePinnedVersion: true });
  assert.equal(decision.allowed, true);
});
