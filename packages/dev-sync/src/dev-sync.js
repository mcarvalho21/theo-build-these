import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

export function ignored(rel, patterns = []) {
  return patterns.some(p => p.endsWith('/**') ? rel.startsWith(p.slice(0, -3)) : rel === p || rel.includes(`/${p}`));
}

export async function scanStructure(root, { ignore = ['node_modules/**', '.git/**'] } = {}) {
  const entries = [];
  async function walk(dir) {
    for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      const rel = path.relative(root, full).replace(/\\/g, '/');
      if (ignored(rel, ignore)) continue;
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

export function hydrationPlan(localManifest, remoteManifest) {
  const local = new Map(localManifest.map(e => [e.path, e]));
  const ops = [];
  for (const remote of remoteManifest) {
    const current = local.get(remote.path);
    if (!current) ops.push(remote.type === 'dir' ? { op: 'mkdir', path: remote.path } : { op: 'hydrate', path: remote.path, sha256: remote.sha256, size: remote.size });
    else if (remote.type === 'file' && current.sha256 !== remote.sha256) ops.push({ op: 'refresh', path: remote.path, from: current.sha256, to: remote.sha256 });
  }
  return ops;
}

export async function materializeStructure(root, remoteManifest) {
  for (const entry of remoteManifest) {
    const full = path.join(root, entry.path);
    if (entry.type === 'dir') await fs.mkdir(full, { recursive: true });
    else {
      await fs.mkdir(path.dirname(full), { recursive: true });
      await fs.writeFile(`${full}.hydrate.json`, JSON.stringify({ hydrate: entry.path, sha256: entry.sha256, size: entry.size }, null, 2));
    }
  }
}
