import test from 'node:test';
import assert from 'node:assert/strict';
import { buildDistributionPlan, classifyApp, evaluateDevice, scoreRisks, validatePlatformManifest } from '../src/mobile-lab.js';

test('evaluateDevice blocks locked devices', () => {
  assert.equal(evaluateDevice({ unlockableBootloader: false, fastboot: true }).ok, false);
  assert.equal(evaluateDevice({ unlockableBootloader: true, fastboot: true, ramGb: 8 }).ok, true);
  assert.equal(evaluateDevice({ unlockableBootloader: true, fastboot: true, ramGb: 8, kernelSource: true }).risk.level, 'clear');
});

test('classifyApp identifies runtime and shim requirements', () => {
  assert.equal(classifyApp({ requires: ['android-runtime'] }).compatibility, 'native-runtime');
  assert.equal(classifyApp({ requires: ['google-play-services'] }).compatibility, 'shim-needed');
  assert.equal(classifyApp({ requires: ['banking-attestation'] }).compatibility, 'blocked');
});

test('buildDistributionPlan inserts shim step when needed', () => {
  const plan = buildDistributionPlan({ device: { unlockableBootloader: true, fastboot: true, ramGb: 8 }, apps: [{ name: 'Maps', requires: ['google-play-services'] }] });
  assert.equal(plan.canProceed, true);
  assert(plan.steps.some(step => step.includes('shim')));
  assert.equal(plan.risk.level, 'low');
});

test('risk scoring accounts for blocked apps and hard device blockers', () => {
  assert.deepEqual(scoreRisks({}), { score: 0, level: 'clear' });
  assert.equal(scoreRisks({ warnings: ['low ram'], blockedApps: 1 }).level, 'medium');
  const plan = buildDistributionPlan({
    device: { unlockableBootloader: false, fastboot: false, ramGb: 4 },
    apps: [{ name: 'Bank', requires: ['banking-attestation'] }]
  });
  assert.equal(plan.risk.level, 'high');
  assert.equal(plan.canProceed, false);
});

test('validatePlatformManifest checks required fields', () => {
  assert.equal(validatePlatformManifest({ name: 'OpenPocket', androidRuntime: 'ART', distributionChannels: ['sideload'] }).valid, true);
  assert.equal(validatePlatformManifest({}).valid, false);
});
