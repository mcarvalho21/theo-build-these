# @build-these/mobile-lab

[![CI](https://github.com/mcarvalho21/theo-build-these/actions/workflows/ci.yml/badge.svg)](https://github.com/mcarvalho21/theo-build-these/actions/workflows/ci.yml)

Prototype for exploring a new Android-compatible mobile platform: model devices, apps, compatibility blockers, and a rollout plan.

```bash
mobile-lab examples/device-apps.json
```

Plans now include a `risk` object with a 0-100 score and `clear`/`low`/`medium`/`high` level. Device blockers, maintenance warnings, blocked apps, and Google Play Services shim requirements all contribute to the risk score; high-risk plans set `canProceed` to false.

Next steps: generate actual `repo` manifests, fastboot scripts, package-manager policy, and compatibility smoke tests on a real open-bootloader device.
