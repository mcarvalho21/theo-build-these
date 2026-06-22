import test from 'node:test';
import assert from 'node:assert/strict';
import { buildVaultManifest, classifyPath, decryptText, encryptText } from '../src/source-vault.js';

const policy = { private: ['.env*', 'secrets/**'], public: ['secrets/README.md'], default: 'public' };

test('classifyPath applies private and explicit public rules', () => {
  assert.equal(classifyPath('.env.local', policy), 'private');
  assert.equal(classifyPath('secrets/token.txt', policy), 'private');
  assert.equal(classifyPath('secrets/README.md', policy), 'public');
  assert.equal(classifyPath('src/index.js', policy), 'public');
});

test('encryptText round-trips with authenticated path context', () => {
  const record = encryptText('API_KEY=123', 'pw', '.env');
  assert.equal(decryptText(record, 'pw', '.env'), 'API_KEY=123');
  assert.throws(() => decryptText(record, 'pw', 'other'));
});

test('buildVaultManifest encrypts private files and leaves public content visible', () => {
  const manifest = buildVaultManifest([
    { path: '.env', content: 'SECRET=1' },
    { path: 'src/app.js', content: 'console.log(1)' }
  ], policy, 'pw');
  assert.equal(manifest[0].visibility, 'private');
  assert.equal(manifest[0].content, undefined);
  assert.equal(decryptText(manifest[0].encrypted, 'pw', '.env'), 'SECRET=1');
  assert.equal(manifest[1].content, 'console.log(1)');
});
