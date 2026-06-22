# @build-these/mobile-lab

Prototype for “new mobile platform with Android compatibility.” This is not a ROM; it is the planning/control-plane slice: device suitability, app compatibility classes, and a flash/distribution checklist.

```bash
mobile-lab examples/device-apps.json
```

Plans now include a `risk` object with a 0-100 score and `clear`/`low`/`medium`/`high` level. Device blockers, maintenance warnings, blocked apps, and Google Play Services shim requirements all contribute to the risk score; high-risk plans set `canProceed` to false.

Next steps: generate actual `repo` manifests, fastboot scripts, package-manager policy, and compatibility smoke tests on a real open-bootloader device.
