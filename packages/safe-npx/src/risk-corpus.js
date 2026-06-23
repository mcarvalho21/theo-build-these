import { AGENT_STRICT_POLICY, buildReport, evaluatePolicy } from './safe-npx.js';

function pkg({ name, version, bin = true, scripts = {}, dependencies = 0, maintainers = true, dist = {}, description = 'fixture package' }) {
  return {
    name,
    version,
    description,
    bin: bin ? { [name.replace(/^@[^/]+\//, '')]: './cli.js' } : undefined,
    scripts,
    dependencies: Object.fromEntries(Array.from({ length: dependencies }, (_, index) => [`dep-${index}`, '^1.0.0'])),
    dist: { tarball: `https://registry.example/${name.replace('/', '-')}-${version}.tgz`, unpackedSize: 2048, fileCount: 4, integrity: `sha512-${name}-${version}`, ...dist }
  };
}

function metadata({ name, maintainers = true, versions, latest }) {
  return {
    name,
    description: 'safe-npx risk corpus fixture',
    'dist-tags': { latest },
    maintainers: maintainers ? [{ name: 'fixture-maintainer' }] : [],
    time: Object.fromEntries(Object.keys(versions).map((version, index) => [version, `2026-01-${String(index + 1).padStart(2, '0')}T00:00:00.000Z`])),
    versions
  };
}

export const RISK_CORPUS = [
  {
    name: 'new-postinstall-hook',
    kind: 'known-bad-shape',
    expected: 'block',
    why: 'adds a postinstall hook in a new release',
    requestedRange: '1.1.0',
    metadata: metadata({
      name: 'new-postinstall-hook',
      latest: '1.1.0',
      versions: {
        '1.0.0': pkg({ name: 'new-postinstall-hook', version: '1.0.0' }),
        '1.1.0': pkg({ name: 'new-postinstall-hook', version: '1.1.0', scripts: { postinstall: 'node install.js' } })
      }
    })
  },
  {
    name: 'changed-install-hook',
    kind: 'known-bad-shape',
    expected: 'block',
    why: 'changes an existing install hook between releases',
    requestedRange: '2.0.0',
    metadata: metadata({
      name: 'changed-install-hook',
      latest: '2.0.0',
      versions: {
        '1.9.0': pkg({ name: 'changed-install-hook', version: '1.9.0', scripts: { install: 'node benign.js' } }),
        '2.0.0': pkg({ name: 'changed-install-hook', version: '2.0.0', scripts: { install: 'node fetch-remote.js' } })
      }
    })
  },
  {
    name: 'hidden-dotfile-tarball',
    kind: 'known-bad-shape',
    expected: 'block',
    why: 'tarball includes hidden package manager/config files',
    requestedRange: '1.0.0',
    tarballScan: { fileCount: 3, unpackedSize: 4000, suspiciousFiles: [{ path: '.npmrc', size: 30, reason: 'hidden file' }] },
    metadata: metadata({ name: 'hidden-dotfile-tarball', latest: '1.0.0', versions: { '1.0.0': pkg({ name: 'hidden-dotfile-tarball', version: '1.0.0' }) } })
  },
  {
    name: 'packed-minified-cli',
    kind: 'known-bad-shape',
    expected: 'block',
    why: 'single dense/minified JavaScript payload in tarball',
    requestedRange: '1.0.0',
    tarballScan: { fileCount: 2, unpackedSize: 120000, suspiciousFiles: [{ path: 'dist/cli.min.js', size: 95000, reason: 'minified JavaScript file' }] },
    metadata: metadata({ name: 'packed-minified-cli', latest: '1.0.0', versions: { '1.0.0': pkg({ name: 'packed-minified-cli', version: '1.0.0' }) } })
  },
  {
    name: 'no-bin-runner',
    kind: 'known-bad-shape',
    expected: 'block',
    why: 'no executable bin for an npx-style invocation',
    requestedRange: '1.0.0',
    metadata: metadata({ name: 'no-bin-runner', latest: '1.0.0', versions: { '1.0.0': pkg({ name: 'no-bin-runner', version: '1.0.0', bin: false }) } })
  },
  {
    name: 'maintainerless-tool',
    kind: 'known-bad-shape',
    expected: 'block',
    why: 'missing maintainer metadata and no independent trust signal',
    requestedRange: '1.0.0',
    metadata: metadata({ name: 'maintainerless-tool', maintainers: false, latest: '1.0.0', versions: { '1.0.0': pkg({ name: 'maintainerless-tool', version: '1.0.0' }) } })
  },
  {
    name: 'huge-cli-payload',
    kind: 'known-bad-shape',
    expected: 'block',
    why: 'very large unpacked payload for a simple executable package',
    requestedRange: '1.0.0',
    metadata: metadata({ name: 'huge-cli-payload', latest: '1.0.0', versions: { '1.0.0': pkg({ name: 'huge-cli-payload', version: '1.0.0', dist: { unpackedSize: 80_000_000 } }) } })
  },
  {
    name: 'many-deps-cli',
    kind: 'known-bad-shape',
    expected: 'block',
    why: 'huge direct dependency surface for a one-shot executable',
    requestedRange: '1.0.0',
    metadata: metadata({ name: 'many-deps-cli', latest: '1.0.0', versions: { '1.0.0': pkg({ name: 'many-deps-cli', version: '1.0.0', dependencies: 35 }) } })
  },
  ...['create-vite', 'tsx', 'prettier', 'eslint', 'typescript', 'cowsay', 'npm-check-updates', '@biomejs/biome'].map((name, index) => ({
    name: `benign-clean-${name}`,
    kind: 'popular-benign-clean-shape',
    expected: 'allow',
    why: 'pinned executable fixture with maintainers, bin, no lifecycle hooks, and small dependency surface',
    requestedRange: `1.0.${index}`,
    metadata: metadata({ name, latest: `1.0.${index}`, versions: { [`1.0.${index}`]: pkg({ name, version: `1.0.${index}` }) } })
  })),
  {
    name: 'benign-friction-esbuild-like',
    kind: 'popular-benign-friction-shape',
    expected: 'allow',
    why: 'legitimate package shape with install-time native/binary setup that agent-strict intentionally blocks for review',
    requestedRange: '1.0.0',
    metadata: metadata({ name: 'esbuild-like', latest: '1.0.0', versions: { '1.0.0': pkg({ name: 'esbuild-like', version: '1.0.0', scripts: { postinstall: 'node install.js' } }) } })
  },
  {
    name: 'benign-friction-swc-like',
    kind: 'popular-benign-friction-shape',
    expected: 'allow',
    why: 'legitimate package shape with a larger direct dependency surface than the strict default allows',
    requestedRange: '1.0.0',
    metadata: metadata({ name: 'swc-like', latest: '1.0.0', versions: { '1.0.0': pkg({ name: 'swc-like', version: '1.0.0', dependencies: 30 }) } })
  },
  {
    name: 'benign-friction-browser-bundle-like',
    kind: 'popular-benign-friction-shape',
    expected: 'allow',
    why: 'legitimate package shape with a minified distributable bundle that should force review, not pretend zero friction',
    requestedRange: '1.0.0',
    tarballScan: { fileCount: 4, unpackedSize: 100000, suspiciousFiles: [{ path: 'dist/index.min.js', size: 90000, reason: 'minified JavaScript file' }] },
    metadata: metadata({ name: 'browser-bundle-like', latest: '1.0.0', versions: { '1.0.0': pkg({ name: 'browser-bundle-like', version: '1.0.0' }) } })
  }
];

export function evaluateRiskCorpus({ corpus = RISK_CORPUS, policy = AGENT_STRICT_POLICY } = {}) {
  const results = corpus.map(fixture => {
    const version = fixture.requestedRange;
    const report = buildReport(fixture.metadata, version, fixture.requestedRange, { tarballScan: fixture.tarballScan || null });
    const decision = evaluatePolicy(report, policy);
    const actual = decision.allowed ? 'allow' : 'block';
    return {
      name: fixture.name,
      kind: fixture.kind,
      expected: fixture.expected,
      actual,
      pass: actual === fixture.expected,
      why: fixture.why,
      risk: report.risk,
      policyReasons: decision.reasons,
      releaseDiff: report.releaseDiff
    };
  });

  const malicious = results.filter(result => result.expected === 'block');
  const benign = results.filter(result => result.expected === 'allow');
  const cleanBenign = results.filter(result => result.kind === 'popular-benign-clean-shape');
  const frictionBenign = results.filter(result => result.kind === 'popular-benign-friction-shape');
  const caught = malicious.filter(result => result.actual === 'block').length;
  const falsePositives = benign.filter(result => result.actual === 'block').length;
  return {
    policy,
    summary: {
      total: results.length,
      malicious: malicious.length,
      benign: benign.length,
      cleanBenign: cleanBenign.length,
      frictionBenign: frictionBenign.length,
      caught,
      missed: malicious.length - caught,
      falsePositives,
      cleanFalsePositives: cleanBenign.filter(result => result.actual === 'block').length,
      frictionFalsePositives: frictionBenign.filter(result => result.actual === 'block').length,
      catchRate: malicious.length ? caught / malicious.length : 0,
      falsePositiveRate: benign.length ? falsePositives / benign.length : 0,
      cleanFalsePositiveRate: cleanBenign.length ? cleanBenign.filter(result => result.actual === 'block').length / cleanBenign.length : 0,
      frictionFalsePositiveRate: frictionBenign.length ? frictionBenign.filter(result => result.actual === 'block').length / frictionBenign.length : 0,
      passed: results.filter(result => result.pass).length
    },
    results
  };
}

export function renderRiskCorpusEvaluation(evaluation) {
  const pct = value => `${Math.round(value * 100)}%`;
  const lines = [
    'safe-npx risk corpus',
    `cases: ${evaluation.summary.total} (${evaluation.summary.malicious} known-bad-shape, ${evaluation.summary.cleanBenign} clean-benign, ${evaluation.summary.frictionBenign} benign-friction)`,
    `catch rate: ${evaluation.summary.caught}/${evaluation.summary.malicious} (${pct(evaluation.summary.catchRate)})`,
    `false positives: ${evaluation.summary.falsePositives}/${evaluation.summary.benign} (${pct(evaluation.summary.falsePositiveRate)})`,
    `  clean false positives: ${evaluation.summary.cleanFalsePositives}/${evaluation.summary.cleanBenign} (${pct(evaluation.summary.cleanFalsePositiveRate)})`,
    `  friction false positives: ${evaluation.summary.frictionFalsePositives}/${evaluation.summary.frictionBenign} (${pct(evaluation.summary.frictionFalsePositiveRate)})`,
    ''
  ];
  for (const result of evaluation.results) {
    const icon = result.pass ? '✅' : '❌';
    lines.push(`${icon} ${result.name}: expected ${result.expected}, got ${result.actual} — ${result.why}`);
    if (!result.pass) {
      lines.push(`   risk: ${result.risk.level} ${result.risk.score}/100; policy: ${result.policyReasons.join('; ') || 'allow'}`);
    }
  }
  return lines.join('\n');
}
