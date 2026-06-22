#!/usr/bin/env node
import { spawn } from 'node:child_process';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import {
  buildReport,
  fetchPackageMetadata,
  parseArgs,
  parsePackageSpec,
  renderReport,
  renderPolicyDecision,
  evaluatePolicy,
  resolveVersion
} from '../src/safe-npx.js';

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const { name, range } = parsePackageSpec(opts.packageSpec);
  const metadata = await fetchPackageMetadata(name, opts.registry);
  const version = resolveVersion(metadata, range);
  const report = buildReport(metadata, version, range);
  const policy = opts.policyPath ? JSON.parse(await (await import('node:fs/promises')).readFile(opts.policyPath, 'utf8')) : {};
  if (opts.maxRisk) policy.maxRisk = opts.maxRisk;
  const decision = evaluatePolicy(report, policy);

  if (opts.json) {
    console.log(JSON.stringify({ ...report, policyDecision: decision }, null, 2));
  } else {
    console.log(renderReport(report));
    console.log(renderPolicyDecision(decision));
  }

  if (!decision.allowed) process.exit(opts.dryRun ? 3 : 4);

  if (opts.dryRun) return;

  const risky = report.risk.level !== 'low';
  if (!opts.yes || risky) {
    const rl = readline.createInterface({ input, output });
    const answer = await rl.question(`Run ${name}@${version} with npx? Type the exact package name to continue: `);
    rl.close();
    if (answer.trim() !== name) {
      console.error('Aborted.');
      process.exit(2);
    }
  }

  const child = spawn('npx', ['--yes', `${name}@${version}`, ...opts.passthrough], {
    stdio: 'inherit',
    shell: false
  });
  child.on('exit', code => process.exit(code ?? 1));
}

main().catch(err => {
  console.error(`safe-npx: ${err.message}`);
  process.exit(1);
});
