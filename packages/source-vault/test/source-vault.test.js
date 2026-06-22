import test from 'node:test';
import assert from 'node:assert/strict';
import { buildVaultManifest, classifyPath, decryptText, encryptText, explainPath, redactText } from '../src/source-vault.js';

const policy = {
  id: 'demo-policy',
  private: [
    { glob: '.env*', recipients: ['ops'], label: 'runtime-env' },
    { glob: 'secrets/**', recipients: ['security'] }
  ],
  public: ['secrets/README.md'],
  recipients: {
    ops: { kid: 'age1ops-public-key' },
    security: { kid: 'age1security-public-key' }
  },
  redact: [
    { glob: 'docs/**', patterns: [{ pattern: 'token=[A-Za-z0-9_-]+', replacement: 'token=[REDACTED]' }] }
  ],
  default: 'public'
};

test('classifyPath applies private object rules and explicit public overrides', () => {
  assert.equal(classifyPath('.env.local', policy), 'private');
  assert.equal(classifyPath('secrets/token.txt', policy), 'private');
  assert.equal(classifyPath('secrets/README.md', policy), 'public');
  assert.equal(classifyPath('src/index.js', policy), 'public');
});

test('explainPath returns policy metadata for matching rules', () => {
  const explanation = explainPath('.env.local', policy);
  assert.equal(explanation.visibility, 'private');
  assert.equal(explanation.policyId, 'demo-policy');
  assert.equal(explanation.matched, '.env*');
  assert.equal(explanation.rule.label, 'runtime-env');
});

test('encryptText round-trips with authenticated path context', () => {
  const record = encryptText('API_KEY=123', 'pw', '.env');
  assert.equal(decryptText(record, 'pw', '.env'), 'API_KEY=123');
  assert.throws(() => decryptText(record, 'pw', 'other'));
});

test('redactText applies share-safe replacement rules', () => {
  assert.equal(
    redactText('example token=abc_123 ok', [{ pattern: 'token=[A-Za-z0-9_]+', replacement: 'token=[REDACTED]' }]),
    'example token=[REDACTED] ok'
  );
});

test('buildVaultManifest encrypts private files, records recipients, and redacts public content', () => {
  const manifest = buildVaultManifest([
    { path: '.env', content: 'SECRET=1' },
    { path: 'src/app.js', content: 'console.log(1)' },
    { path: 'docs/setup.md', content: 'paste token=abc_123 here' }
  ], policy, 'pw');

  assert.equal(manifest[0].visibility, 'private');
  assert.equal(manifest[0].content, undefined);
  assert.equal(manifest[0].access.policyId, 'demo-policy');
  assert.deepEqual(manifest[0].access.recipients, [{ id: 'ops', kid: 'age1ops-public-key' }]);
  assert.equal(decryptText(manifest[0].encrypted, 'pw', '.env'), 'SECRET=1');

  assert.equal(manifest[1].content, 'console.log(1)');
  assert.equal(manifest[1].redacted, false);

  assert.equal(manifest[2].content, 'paste token=[REDACTED] here');
  assert.equal(manifest[2].redacted, true);
});
