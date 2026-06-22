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

export async function fetchTarballBytes(tarballUrl) {
  const res = await fetch(tarballUrl, { headers: { accept: 'application/octet-stream' } });
  if (!res.ok) throw new Error(`npm tarball returned ${res.status} for ${tarballUrl}`);
  return Buffer.from(await res.arrayBuffer());
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

export function scorePackage({ metadata, pkg, tarballScan = null }) {
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

  if (tarballScan?.suspiciousFiles?.length) {
    const suspiciousFiles = tarballScan.suspiciousFiles;
    const hiddenCount = suspiciousFiles.filter(file => file.reason === 'hidden file').length;
    const largeJsCount = suspiciousFiles.filter(file => file.reason === 'large JavaScript file').length;
    const minifiedJsCount = suspiciousFiles.filter(file => file.reason === 'minified JavaScript file').length;

    if (hiddenCount) {
      score += Math.min(20, hiddenCount * 5);
      reasons.push(`tarball contains hidden files: ${hiddenCount}`);
    }
    if (largeJsCount) {
      score += Math.min(25, largeJsCount * 10);
      reasons.push(`tarball contains large JavaScript files: ${largeJsCount}`);
    }
    if (minifiedJsCount) {
      score += Math.min(20, minifiedJsCount * 8);
      reasons.push(`tarball contains minified JavaScript files: ${minifiedJsCount}`);
    }
  }

  const level = score >= 60 ? 'high' : score >= 30 ? 'medium' : 'low';
  if (!reasons.length) reasons.push('no obvious static risk flags in registry metadata');
  return { score: Math.min(score, 100), level, reasons };
}

export function buildReport(metadata, version, requestedRange = version, options = {}) {
  const pkg = metadata.versions?.[version];
  if (!pkg) throw new Error(`Version ${version} not found for ${metadata.name}`);
  const scripts = lifecycleScripts(pkg);
  const bins = normalizeBin(pkg.bin);
  const dependencies = Object.keys(pkg.dependencies || {});
  const maintainers = (metadata.maintainers || []).map(m => m.name || m.email || String(m)).filter(Boolean);
  const tarballScan = options.tarballScan || null;
  const risk = scorePackage({ metadata, pkg, tarballScan });

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
    tarballScan,
    risk
  };
}

function readTarString(buffer, start, length) {
  const end = buffer.indexOf(0, start);
  return buffer.subarray(start, end === -1 || end > start + length ? start + length : end).toString('utf8').trim();
}

function readTarOctal(buffer, start, length) {
  const raw = readTarString(buffer, start, length).replace(/\0.*$/, '').trim();
  return raw ? Number.parseInt(raw, 8) : 0;
}

function isEmptyTarBlock(buffer, offset) {
  for (let index = offset; index < offset + 512 && index < buffer.length; index++) {
    if (buffer[index] !== 0) return false;
  }
  return true;
}

function normalizeTarPath(name) {
  return name.replace(/^\.\//, '').replace(/^package\//, '');
}

export async function listTarballEntries(tarballBytes) {
  const { gunzipSync } = await import('node:zlib');
  const tarBytes = gunzipSync(tarballBytes);
  const entries = [];

  for (let offset = 0; offset + 512 <= tarBytes.length;) {
    if (isEmptyTarBlock(tarBytes, offset)) break;

    const name = readTarString(tarBytes, offset, 100);
    const size = readTarOctal(tarBytes, offset + 124, 12);
    const type = readTarString(tarBytes, offset + 156, 1) || '0';
    const prefix = readTarString(tarBytes, offset + 345, 155);
    const path = normalizeTarPath(prefix ? `${prefix}/${name}` : name);
    const contentOffset = offset + 512;

    if (path && (type === '0' || type === '\0')) {
      entries.push({ path, size, content: tarBytes.subarray(contentOffset, contentOffset + size) });
    }

    offset = contentOffset + Math.ceil(size / 512) * 512;
  }

  return entries;
}

function isHiddenPath(path) {
  return path.split('/').some(part => part.startsWith('.') && part !== '.' && part !== '..');
}

function looksMinifiedJavaScript(entry) {
  if (!/\.(?:m?js|cjs)$/i.test(entry.path)) return false;
  if (/\.min\.(?:m?js|cjs)$/i.test(entry.path)) return true;
  if (entry.size < 50_000 || entry.size > 2_000_000) return false;

  const text = entry.content.toString('utf8');
  const newlineCount = (text.match(/\n/g) || []).length;
  return newlineCount <= 2 || entry.size / Math.max(newlineCount, 1) > 2_000;
}

export function analyzeTarballEntries(entries) {
  const suspiciousFiles = [];
  for (const entry of entries) {
    if (isHiddenPath(entry.path)) suspiciousFiles.push({ path: entry.path, size: entry.size, reason: 'hidden file' });
    if (/\.(?:m?js|cjs)$/i.test(entry.path) && entry.size > 1_000_000) {
      suspiciousFiles.push({ path: entry.path, size: entry.size, reason: 'large JavaScript file' });
    } else if (looksMinifiedJavaScript(entry)) {
      suspiciousFiles.push({ path: entry.path, size: entry.size, reason: 'minified JavaScript file' });
    }
  }

  return {
    fileCount: entries.length,
    unpackedSize: entries.reduce((total, entry) => total + entry.size, 0),
    suspiciousFiles
  };
}

export async function scanTarballBytes(tarballBytes) {
  const entries = await listTarballEntries(tarballBytes);
  return analyzeTarballEntries(entries);
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
  if (report.tarballScan) {
    lines.push(`tarball scan: ${report.tarballScan.fileCount} files, ${formatBytes(report.tarballScan.unpackedSize)} unpacked`);
    if (report.tarballScan.suspiciousFiles.length) {
      for (const file of report.tarballScan.suspiciousFiles.slice(0, 10)) {
        lines.push(`  - ${file.reason}: ${file.path} (${formatBytes(file.size)})`);
      }
      if (report.tarballScan.suspiciousFiles.length > 10) {
        lines.push(`  - ...and ${report.tarballScan.suspiciousFiles.length - 10} more suspicious files`);
      }
    }
  }
  if (report.tarball) lines.push(`tarball: ${report.tarball}`);
  return lines.join('\n');
}
