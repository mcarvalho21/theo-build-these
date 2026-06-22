export function parseArgs(argv) {
  const opts = {
    json: false,
    dryRun: false,
    yes: false,
    registry: 'https://registry.npmjs.org',
    policyPath: null,
    maxRisk: null,
    packageSpec: null,
    passthrough: []
  };

  const args = [...argv];
  while (args.length) {
    const arg = args.shift();
    if (arg === '--json') opts.json = true;
    else if (arg === '--dry-run') opts.dryRun = true;
    else if (arg === '--yes' || arg === '-y') opts.yes = true;
    else if (arg === '--registry') opts.registry = args.shift();
    else if (arg === '--policy') opts.policyPath = args.shift();
    else if (arg === '--max-risk') opts.maxRisk = args.shift();
    else if (arg === '--') {
      opts.passthrough = args;
      break;
    } else if (!opts.packageSpec) opts.packageSpec = arg;
    else opts.passthrough.push(arg, ...args.splice(0));
  }

  if (!opts.packageSpec) throw new Error('Usage: safe-npx <package[@version]> [-- --package-args] [--json] [--dry-run] [--yes]');
  return opts;
}

export function parsePackageSpec(spec) {
  if (spec.startsWith('@')) {
    const secondAt = spec.indexOf('@', 1);
    if (secondAt === -1) return { name: spec, range: 'latest' };
    return { name: spec.slice(0, secondAt), range: spec.slice(secondAt + 1) || 'latest' };
  }
  const at = spec.lastIndexOf('@');
  if (at <= 0) return { name: spec, range: 'latest' };
  return { name: spec.slice(0, at), range: spec.slice(at + 1) || 'latest' };
}

export async function fetchPackageMetadata(name, registry = 'https://registry.npmjs.org') {
  const url = `${registry.replace(/\/$/, '')}/${encodeURIComponent(name).replace(/^%40/, '@')}`;
  // Prefer full metadata over the abbreviated install-v1 document so the
  // preflight can show publish time and maintainer/history signals.
  const res = await fetch(url, { headers: { accept: 'application/json' } });
  if (!res.ok) throw new Error(`npm registry returned ${res.status} for ${name}`);
  return res.json();
}

export function resolveVersion(metadata, range = 'latest') {
  if (metadata.versions?.[range]) return range;
  const tagged = metadata['dist-tags']?.[range];
  if (tagged) return tagged;
  if (range === 'latest' && metadata['dist-tags']?.latest) return metadata['dist-tags'].latest;
  throw new Error(`Cannot resolve version/range '${range}' for ${metadata.name}`);
}

export function lifecycleScripts(pkg) {
  const scripts = pkg.scripts || {};
  const risky = ['preinstall', 'install', 'postinstall', 'prepublish', 'prepare', 'prepack', 'postpack'];
  return Object.fromEntries(Object.entries(scripts).filter(([name]) => risky.includes(name)));
}

export function normalizeBin(bin) {
  if (!bin) return [];
  if (typeof bin === 'string') return [{ name: null, path: bin }];
  return Object.entries(bin).map(([name, path]) => ({ name, path }));
}

export function scorePackage({ metadata, pkg }) {
  let score = 0;
  const reasons = [];
  const scripts = lifecycleScripts(pkg);
  const deps = Object.keys(pkg.dependencies || {});
  const bins = normalizeBin(pkg.bin);
  const maintainers = metadata.maintainers || [];
  const tarballBytes = pkg.dist?.unpackedSize || pkg.dist?.fileCount || 0;

  if (Object.keys(scripts).length) {
    score += 35;
    reasons.push(`runs lifecycle scripts: ${Object.keys(scripts).join(', ')}`);
  }
  if (!bins.length) {
    score += 20;
    reasons.push('no bin entry; unusual for an npx command');
  }
  if (deps.length > 25) {
    score += 15;
    reasons.push(`large dependency surface: ${deps.length} direct dependencies`);
  } else if (deps.length > 10) {
    score += 8;
    reasons.push(`moderate dependency surface: ${deps.length} direct dependencies`);
  }
  if (!maintainers.length) {
    score += 10;
    reasons.push('missing maintainer metadata');
  }
  if (metadata.deprecated || pkg.deprecated) {
    score += 25;
    reasons.push(`deprecated: ${metadata.deprecated || pkg.deprecated}`);
  }
  if (pkg.name && /[0-9]/.test(pkg.name.replace(/^@[^/]+\//, ''))) {
    score += 5;
    reasons.push('package name contains digits; verify it is not a typo-squat');
  }
  if (tarballBytes > 50_000_000) {
    score += 10;
    reasons.push(`large unpacked size: ${formatBytes(tarballBytes)}`);
  }

  const level = score >= 60 ? 'high' : score >= 30 ? 'medium' : 'low';
  if (!reasons.length) reasons.push('no obvious static risk flags in registry metadata');
  return { score: Math.min(score, 100), level, reasons };
}

export function buildReport(metadata, version, requestedRange = version) {
  const pkg = metadata.versions?.[version];
  if (!pkg) throw new Error(`Version ${version} not found for ${metadata.name}`);
  const scripts = lifecycleScripts(pkg);
  const bins = normalizeBin(pkg.bin);
  const dependencies = Object.keys(pkg.dependencies || {});
  const maintainers = (metadata.maintainers || []).map(m => m.name || m.email || String(m)).filter(Boolean);
  const risk = scorePackage({ metadata, pkg });

  return {
    package: pkg.name || metadata.name,
    version,
    requestedRange,
    description: pkg.description || metadata.description || '',
    deprecated: Boolean(metadata.deprecated || pkg.deprecated),
    maintainers,
    publishedAt: metadata.time?.[version] || null,
    tarball: pkg.dist?.tarball || null,
    unpackedSize: pkg.dist?.unpackedSize || null,
    fileCount: pkg.dist?.fileCount || null,
    integrity: pkg.dist?.integrity || pkg.dist?.shasum || null,
    bins,
    lifecycleScripts: scripts,
    dependencyCount: dependencies.length,
    risk
  };
}

export function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return 'unknown';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${value.toFixed(value >= 10 || unit === 0 ? 0 : 1)} ${units[unit]}`;
}


export function evaluatePolicy(report, policy = {}) {
  const maxRisk = policy.maxRisk || 'medium';
  const order = { low: 1, medium: 2, high: 3 };
  const reasons = [];

  if (order[report.risk.level] > order[maxRisk]) {
    reasons.push(`risk level ${report.risk.level} exceeds allowed ${maxRisk}`);
  }

  if (policy.requireBin === true && report.bins.length === 0) {
    reasons.push('package has no executable bin entry');
  }

  if (policy.denyLifecycleScripts === true && Object.keys(report.lifecycleScripts).length > 0) {
    reasons.push(`lifecycle scripts denied: ${Object.keys(report.lifecycleScripts).join(', ')}`);
  }

  if (policy.requirePinnedVersion && /latest|\*|\^|~|>|</.test(report.requestedRange || '')) {
    reasons.push('unpinned package range denied by policy');
  }

  const allowedPackages = policy.allowPackages || [];
  if (allowedPackages.length && !allowedPackages.includes(report.package)) {
    reasons.push(`package ${report.package} is not in allowPackages`);
  }

  const deniedPackages = policy.denyPackages || [];
  if (deniedPackages.includes(report.package)) {
    reasons.push(`package ${report.package} is explicitly denied`);
  }

  return { allowed: reasons.length === 0, reasons, policy: { maxRisk, ...policy } };
}

export function renderPolicyDecision(decision) {
  if (decision.allowed) return 'policy: ALLOW';
  return ['policy: BLOCK', ...decision.reasons.map(reason => `  - ${reason}`)].join('\n');
}

export function renderReport(report) {
  const lines = [];
  lines.push(`safe-npx preflight: ${report.package}@${report.version}`);
  if (report.description) lines.push(`description: ${report.description}`);
  lines.push(`risk: ${report.risk.level.toUpperCase()} (${report.risk.score}/100)`);
  for (const reason of report.risk.reasons) lines.push(`  - ${reason}`);
  lines.push(`maintainers: ${report.maintainers.length ? report.maintainers.slice(0, 5).join(', ') : 'unknown'}`);
  lines.push(`published: ${report.publishedAt || 'unknown'}`);
  lines.push(`size: ${formatBytes(report.unpackedSize)} across ${report.fileCount ?? 'unknown'} files`);
  lines.push(`dependencies: ${report.dependencyCount}`);
  lines.push(`bins: ${report.bins.length ? report.bins.map(b => b.name ? `${b.name} -> ${b.path}` : b.path).join(', ') : 'none'}`);
  lines.push(`lifecycle scripts: ${Object.keys(report.lifecycleScripts).length ? Object.keys(report.lifecycleScripts).join(', ') : 'none'}`);
  if (report.tarball) lines.push(`tarball: ${report.tarball}`);
  return lines.join('\n');
}
