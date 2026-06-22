#!/usr/bin/env node
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import { resultToJsonlLine, runFixture, summaryToJsonlLine } from '../src/weird-bench.js';

const args = process.argv.slice(2);
const jsonlIndex = args.indexOf('--jsonl');
const jsonlPath = jsonlIndex === -1 ? null : args.splice(jsonlIndex, 2)[1];
const [fixtureDir, ...cmd] = args;
if (!fixtureDir || cmd.length === 0) {
  console.error('Usage: weird-bench [--jsonl results.jsonl] <fixture-dir> -- <command...>');
  console.error('The fixture prompt is written to command stdin; stdout is scored.');
  process.exit(1);
}
if (cmd[0] === '--') cmd.shift();

const result = await runFixture(fixtureDir, prompt => new Promise((resolve, reject) => {
  const child = spawn(cmd[0], cmd.slice(1), { stdio: ['pipe', 'pipe', 'inherit'] });
  let out = '';
  child.stdout.on('data', chunk => { out += chunk; });
  child.on('error', reject);
  child.on('exit', code => code === 0 ? resolve(out) : reject(new Error(`command exited ${code}`)));
  child.stdin.end(prompt);
}));

console.log(JSON.stringify(result, null, 2));
if (jsonlPath) await fs.appendFile(jsonlPath, `${resultToJsonlLine(result)}\n${summaryToJsonlLine([result])}\n`);
process.exit(result.pass ? 0 : 3);
