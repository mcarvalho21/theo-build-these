#!/usr/bin/env node
import fs from 'node:fs/promises';
import { buildDistributionPlan } from '../src/mobile-lab.js';

const [configPath] = process.argv.slice(2);
if (!configPath) {
  console.error('Usage: mobile-lab <device-and-apps.json>');
  process.exit(1);
}
console.log(JSON.stringify(buildDistributionPlan(JSON.parse(await fs.readFile(configPath, 'utf8'))), null, 2));
