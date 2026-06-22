# `@build-these/mobile-lab` roadmap

Goal: explore the control-plane for a new mobile platform with Android app compatibility.

## Now

- Device suitability evaluation.
- App compatibility classification and Play Services shim requirements.
- Risk scoring and distribution checklist generation.

## Next

- Generate repo/manifest files for a real open-bootloader target device.
- Add fastboot/flashing checklist templates with explicit safety gates.
- Define compatibility smoke tests for representative Android apps.
- Model package-manager policy: trusted sources, updates, rollback, and app permissions.
- Separate hard blockers from warnings in machine-readable output.

## Good first contributions

- Add device fixture examples for common open-bootloader phones.
- Add app compatibility cases for native, webview, push-notification, and Play-dependent apps.
- Improve risk explanations in CLI output.

## Open questions

- Which device should be the first real target?
- How much Android compatibility is enough for a credible demo?
- What must be true before anyone should flash a device with project-generated artifacts?
