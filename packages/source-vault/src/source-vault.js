import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

function normalizeRule(rule) {
  if (typeof rule === 'string') return { glob: rule };
  if (rule && typeof rule === 'object' && typeof rule.glob === 'string') return { ...rule };
  throw new TypeError(`Invalid policy rule: ${JSON.stringify(rule)}`);
}

export function compilePolicy(policy = {}) {
  const privateRules = (policy.private || []).map(normalizeRule);
  const publicRules = (policy.public || []).map(normalizeRule);
  const defaultVisibility = policy.default || 'public';
  const policyId = policy.id || stablePolicyId(policy);
  return { privateRules, publicRules, defaultVisibility, policyId, recipients: policy.recipients || {} };
}

export function stablePolicyId(policy = {}) {
  const canonical = JSON.stringify({
    private: policy.private || [],
    public: policy.public || [],
    default: policy.default || 'public',
    recipients: policy.recipients || {},
    redact: policy.redact || []
  });
  return `policy:${crypto.createHash('sha256').update(canonical).digest('hex').slice(0, 12)}`;
}

export function globToRegExp(glob) {
  const escaped = glob.replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*/g, '::STARSTAR::')
    .replace(/\*/g, '[^/]*')
    .replace(/::STARSTAR::/g, '.*');
  return new RegExp(`^${escaped}$`);
}

export function explainPath(filePath, policy) {
  const normalized = filePath.replace(/\\/g, '/').replace(/^\.\//, '');
  const { privateRules, publicRules, defaultVisibility, policyId } = compilePolicy(policy);
  const publicRule = publicRules.find(rule => globToRegExp(rule.glob).test(normalized));
  if (publicRule) return { visibility: 'public', path: normalized, policyId, matched: publicRule.glob, rule: publicRule };
  const privateRule = privateRules.find(rule => globToRegExp(rule.glob).test(normalized));
  if (privateRule) return { visibility: 'private', path: normalized, policyId, matched: privateRule.glob, rule: privateRule };
  return { visibility: defaultVisibility, path: normalized, policyId, matched: null, rule: null };
}

export function classifyPath(filePath, policy) {
  return explainPath(filePath, policy).visibility;
}

export function deriveKey(secret) {
  return crypto.createHash('sha256').update(secret).digest();
}

export function encryptText(plainText, secret, aad = '') {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', deriveKey(secret), iv);
  cipher.setAAD(Buffer.from(aad));
  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  return {
    alg: 'aes-256-gcm',
    iv: iv.toString('base64'),
    tag: cipher.getAuthTag().toString('base64'),
    data: encrypted.toString('base64')
  };
}

export function decryptText(record, secret, aad = '') {
  const decipher = crypto.createDecipheriv('aes-256-gcm', deriveKey(secret), Buffer.from(record.iv, 'base64'));
  decipher.setAAD(Buffer.from(aad));
  decipher.setAuthTag(Buffer.from(record.tag, 'base64'));
  return Buffer.concat([decipher.update(Buffer.from(record.data, 'base64')), decipher.final()]).toString('utf8');
}

export function accessMetadata(explanation, policy) {
  const rule = explanation.rule || {};
  const recipientIds = rule.recipients || policy.defaultRecipients || [];
  return {
    policyId: explanation.policyId,
    rule: explanation.matched || 'default',
    label: rule.label || (explanation.visibility === 'private' ? 'private' : 'public'),
    recipients: recipientIds.map(id => ({ id, ...(policy.recipients?.[id] || {}) }))
  };
}

export function redactText(content, redactions = []) {
  return redactions.reduce((text, redaction) => {
    const pattern = redaction.pattern instanceof RegExp ? redaction.pattern : new RegExp(redaction.pattern, redaction.flags || 'g');
    return text.replace(pattern, redaction.replacement || '[REDACTED]');
  }, content);
}

export function redactionsForPath(filePath, policy = {}) {
  const normalized = filePath.replace(/\\/g, '/').replace(/^\.\//, '');
  return (policy.redact || [])
    .map(normalizeRule)
    .filter(rule => globToRegExp(rule.glob).test(normalized))
    .flatMap(rule => rule.patterns || []);
}

export function buildVaultManifest(files, policy, secret = 'demo-secret') {
  return files.map(file => {
    const explanation = explainPath(file.path, policy);
    const sha256 = crypto.createHash('sha256').update(file.content).digest('hex');
    const base = {
      path: file.path,
      visibility: explanation.visibility,
      sha256,
      access: accessMetadata(explanation, policy)
    };
    if (explanation.visibility === 'private') return { ...base, encrypted: encryptText(file.content, secret, file.path) };
    const redactions = redactionsForPath(file.path, policy);
    const content = redactions.length ? redactText(file.content, redactions) : file.content;
    return { ...base, content, redacted: redactions.length > 0 };
  });
}

export async function readPolicy(policyPath) {
  return JSON.parse(await fs.readFile(policyPath, 'utf8'));
}

export async function scanFiles(dir) {
  const out = [];
  async function walk(current) {
    for (const entry of await fs.readdir(current, { withFileTypes: true })) {
      if (entry.name === '.git' || entry.name === 'node_modules') continue;
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) await walk(full);
      else out.push({ path: path.relative(dir, full).replace(/\\/g, '/'), content: await fs.readFile(full, 'utf8') });
    }
  }
  await walk(dir);
  return out.sort((a,b) => a.path.localeCompare(b.path));
}
