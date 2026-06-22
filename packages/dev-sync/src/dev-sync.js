import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

export const DEFAULT_IGNORE = ['node_modules/**', '.git/**'];

export function parseSyncIgnore(text = '') {
  return text
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#'));
}

function globToRegExp(glob) {
  const anchored = glob.startsWith('/');
  const pattern = (anchored ? glob.slice(1) : glob).replace(/\/$/, '/**');
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*/g, '::STARSTAR::')
    .replace(/\*/g, '[^/]*')
    .replace(/::STARSTAR::/g, '.*');
  return new RegExp(anchored ? `^${escaped}$` : `(^|.*/)${escaped}$`);
}

export function ignored(rel, patterns = []) {
  const normalized = rel.replace(/\\/g, '/').replace(/^\.\//, '');
  let isIgnored = false;
  for (const raw of patterns) {
    const negate = raw.startsWith('!');
    const pattern = negate ? raw.slice(1) : raw;
    if (!pattern) continue;
    const subtreePrefix = pattern.endsWith('/**') ? pattern.slice(0, -3).replace(/^\//, '') : null;
    const matched = subtreePrefix
      ? normalized === subtreePrefix || normalized.startsWith(`${subtreePrefix}/`) || globToRegExp(pattern).test(normalized)
      : globToRegExp(pattern).test(normalized);
    if (matched) isIgnored = !negate;
  }
  return isIgnored;
}

export async function loadSyncIgnore(root, ignoreFile = '.syncignore') {
  try {
    return parseSyncIgnore(await fs.readFile(path.join(root, ignoreFile), 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

export async function scanStructure(root, { ignore = DEFAULT_IGNORE, ignoreFile = '.syncignore' } = {}) {
  const entries = [];
  const syncIgnore = ignoreFile ? await loadSyncIgnore(root, ignoreFile) : [];
  const ignorePatterns = [...ignore, ...syncIgnore];
  async function walk(dir) {
    for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      const rel = path.relative(root, full).replace(/\\/g, '/');
      if (ignored(rel, ignorePatterns)) continue;
      if (entry.isDirectory()) {
        entries.push({ type: 'dir', path: rel });
        await walk(full);
      } else {
        const stat = await fs.stat(full);
        entries.push({ type: 'file', path: rel, size: stat.size, sha256: crypto.createHash('sha256').update(await fs.readFile(full)).digest('hex') });
      }
    }
  }
  await walk(root);
  return entries.sort((a,b) => a.path.localeCompare(b.path));
}

export function hydrationPlan(localManifest, remoteManifest, { includeDeletes = false } = {}) {
  const local = new Map(localManifest.map(e => [e.path, e]));
  const remoteByPath = new Map(remoteManifest.map(e => [e.path, e]));
  const ops = [];
  for (const remote of remoteManifest) {
    const current = local.get(remote.path);
    if (!current) ops.push(remote.type === 'dir' ? { op: 'mkdir', path: remote.path } : { op: 'hydrate', path: remote.path, sha256: remote.sha256, size: remote.size });
    else if (remote.type !== current.type) ops.push({ op: 'replace', path: remote.path, fromType: current.type, toType: remote.type });
    else if (remote.type === 'file' && current.sha256 !== remote.sha256) ops.push({ op: 'refresh', path: remote.path, from: current.sha256, to: remote.sha256, size: remote.size });
  }
  if (includeDeletes) {
    for (const current of localManifest) {
      if (!remoteByPath.has(current.path)) ops.push({ op: 'delete-local', path: current.path, type: current.type });
    }
  }
  return ops;
}

export function placeholderFor(entry, { source = 'remote-manifest' } = {}) {
  return {
    devSync: 'hydrate-placeholder/v1',
    path: entry.path,
    sha256: entry.sha256,
    size: entry.size,
    source,
    apply: { op: 'hydrate', target: entry.path }
  };
}

export async function materializeStructure(root, remoteManifest, options = {}) {
  for (const entry of remoteManifest) {
    const full = path.join(root, entry.path);
    if (entry.type === 'dir') await fs.mkdir(full, { recursive: true });
    else {
      await fs.mkdir(path.dirname(full), { recursive: true });
      await fs.writeFile(`${full}.hydrate.json`, JSON.stringify(placeholderFor(entry, options), null, 2));
    }
  }
}

export async function applyHydrationPlan(root, ops, remoteManifest, options = {}) {
  const remoteByPath = new Map(remoteManifest.map(e => [e.path, e]));
  for (const op of ops) {
    const full = path.join(root, op.path);
    if (op.op === 'mkdir') await fs.mkdir(full, { recursive: true });
    if (op.op === 'hydrate' || op.op === 'refresh') {
      const remote = remoteByPath.get(op.path) || { type: 'file', path: op.path, sha256: op.sha256 || op.to, size: op.size };
      await fs.mkdir(path.dirname(full), { recursive: true });
      await fs.writeFile(`${full}.hydrate.json`, JSON.stringify(placeholderFor(remote, options), null, 2));
    }
  }
}
