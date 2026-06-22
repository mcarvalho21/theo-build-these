# @build-these/mobile-lab

Prototype for “new mobile platform with Android compatibility.” This is not a ROM; it is the planning/control-plane slice: device suitability, app compatibility classes, and a flash/distribution checklist.

```bash
mobile-lab examples/device-apps.json
```

Next steps: generate actual `repo` manifests, fastboot scripts, package-manager policy, and compatibility smoke tests on a real open-bootloader device.
