import test from 'node:test';
import assert from 'node:assert/strict';
import { gzipSync } from 'node:zlib';
import {
  analyzeTarballEntries,
  buildReport,
  lifecycleScripts,
  parseArgs,
  parsePackageSpec,
  renderReport,
  resolveVersion,
  scanTarballBytes,
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

function tarHeader(name, content) {
  const header = Buffer.alloc(512, 0);
  header.write(name, 0, 100, 'utf8');
  header.write('0000644\0', 100, 8, 'ascii');
  header.write('0000000\0', 108, 8, 'ascii');
  header.write('0000000\0', 116, 8, 'ascii');
  header.write(`${content.length.toString(8).padStart(11, '0')}\0`, 124, 12, 'ascii');
  header.write('00000000000\0', 136, 12, 'ascii');
  header.fill(' ', 148, 156);
  header.write('0', 156, 1, 'ascii');
  header.write('ustar\0', 257, 6, 'ascii');
  header.write('00', 263, 2, 'ascii');

  let checksum = 0;
  for (const byte of header) checksum += byte;
  header.write(`${checksum.toString(8).padStart(6, '0')}\0 `, 148, 8, 'ascii');
  return header;
}

function tarball(files) {
  const parts = [];
  for (const [name, text] of Object.entries(files)) {
    const content = Buffer.from(text, 'utf8');
    parts.push(tarHeader(name, content), content, Buffer.alloc(Math.ceil(content.length / 512) * 512 - content.length));
  }
  parts.push(Buffer.alloc(1024));
  return gzipSync(Buffer.concat(parts));
}

test('scanTarballBytes lists npm tarball contents and flags hidden and minified files without executing code', async () => {
  const tgz = tarball({
    'package/index.js': 'console.log("hello")\n',
    'package/.npmrc': 'ignore-scripts=false\n',
    'package/dist/tool.min.js': `function x(){return 1};${'a'.repeat(50_000)}`
  });

  const scan = await scanTarballBytes(tgz);
  assert.equal(scan.fileCount, 3);
  assert(scan.unpackedSize > 50_000);
  assert.deepEqual(scan.suspiciousFiles.map(file => file.reason).sort(), ['hidden file', 'minified JavaScript file']);
  assert(scan.suspiciousFiles.some(file => file.path === '.npmrc'));
  assert(scan.suspiciousFiles.some(file => file.path === 'dist/tool.min.js'));
});

test('tarball scan findings increase package risk and render in reports', () => {
  const tarballScan = analyzeTarballEntries([
    { path: '.env', size: 10, content: Buffer.from('TOKEN=x') },
    { path: 'dist/bundle.js', size: 1_000_001, content: Buffer.alloc(0) }
  ]);
  const metadata = {
    name: 'fixture-tool',
    maintainers: [{ name: 'alice' }],
    versions: {
      '1.0.0': {
        name: 'fixture-tool',
        version: '1.0.0',
        bin: { fixture: 'index.js' },
        dist: { tarball: 'https://example.test/fixture.tgz' }
      }
    }
  };

  const report = buildReport(metadata, '1.0.0', '1.0.0', { tarballScan });
  assert.equal(report.risk.level, 'low');
  assert(report.risk.score > 0);
  assert(report.risk.reasons.some(reason => reason.includes('hidden files')));
  assert(report.risk.reasons.some(reason => reason.includes('large JavaScript files')));
  assert.match(renderReport(report), /tarball scan: 2 files/);
  assert.match(renderReport(report), /large JavaScript file: dist\/bundle\.js/);
});
