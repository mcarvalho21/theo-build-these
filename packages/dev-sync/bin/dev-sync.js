#!/usr/bin/env node
import fs from 'node:fs/promises';
import { hydrationPlan, scanStructure } from '../src/dev-sync.js';

const [localDir='.', remoteManifestPath] = process.argv.slice(2);
const local = await scanStructure(localDir);
if (!remoteManifestPath) console.log(JSON.stringify(local, null, 2));
else {
  const remote = JSON.parse(await fs.readFile(remoteManifestPath, 'utf8'));
  console.log(JSON.stringify(hydrationPlan(local, remote), null, 2));
}
