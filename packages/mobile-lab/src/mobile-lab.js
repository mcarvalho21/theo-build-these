export function evaluateDevice(device) {
  const blockers = [];
  const warnings = [];
  if (!device.unlockableBootloader) blockers.push('bootloader is not unlockable');
  if (!device.fastboot) blockers.push('fastboot unavailable');
  if (!device.kernelSource) warnings.push('kernel source missing; ROM maintenance risk');
  if ((device.ramGb || 0) < 6) warnings.push('less than 6GB RAM may hurt Android runtime performance');
  return { ok: blockers.length === 0, blockers, warnings };
}

export function classifyApp(app) {
  const needs = app.requires || [];
  if (needs.includes('google-play-integrity') || needs.includes('banking-attestation')) return { compatibility: 'blocked', reason: 'requires strong proprietary attestation' };
  if (needs.includes('google-play-services')) return { compatibility: 'shim-needed', reason: 'requires Google Play Services shim/microG layer' };
  if (needs.includes('android-runtime')) return { compatibility: 'native-runtime', reason: 'runs on Android runtime' };
  return { compatibility: 'unknown', reason: 'requirements not declared' };
}

export function buildDistributionPlan({ device, apps }) {
  const deviceEval = evaluateDevice(device);
  const appPlan = apps.map(app => ({ ...app, ...classifyApp(app) }));
  const steps = [
    'unlock bootloader and verify fastboot access',
    'flash recovery image',
    'flash base system image with Android runtime bridge',
    'install package manager and sideload policy service',
    'run app compatibility smoke suite'
  ];
  if (appPlan.some(a => a.compatibility === 'shim-needed')) steps.splice(3, 0, 'install Google Play Services compatibility shim');
  return { device: deviceEval, apps: appPlan, steps, canProceed: deviceEval.ok };
}

export function validatePlatformManifest(manifest) {
  const errors = [];
  if (!manifest.name) errors.push('name is required');
  if (!manifest.androidRuntime) errors.push('androidRuntime is required');
  if (!Array.isArray(manifest.distributionChannels)) errors.push('distributionChannels must be an array');
  return { valid: errors.length === 0, errors };
}
