#!/usr/bin/env node
import { buildVaultManifest, readPolicy, scanFiles } from '../src/source-vault.js';

const [dir='.', policyPath='vault.policy.json'] = process.argv.slice(2);
const policy = await readPolicy(policyPath);
const files = await scanFiles(dir);
console.log(JSON.stringify(buildVaultManifest(files, policy, process.env.SOURCE_VAULT_SECRET || 'demo-secret'), null, 2));
