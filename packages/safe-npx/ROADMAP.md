# `@build-these/safe-npx` roadmap

Goal: make remote package execution less blind for humans and coding agents.

## Now

- Registry metadata and lifecycle-script risk report.
- Tarball file-table/static scan without executing package code.
- JSON output and policy gates for agent guard mode.

## Next

- Compare a resolved version against the previous release and flag newly added install scripts, bins, large files, or hidden files.
- Add provenance and reputation integrations when available, such as npm provenance, OpenSSF Scorecard, Socket-style signals, or Sigstore metadata.
- Cache trust decisions by package, version, integrity, policy hash, and reviewer identity rather than package name alone.
- Tighten package spec parsing for scoped packages, aliases, workspaces, dist-tags, and explicit tarball URLs.
- Add policy examples for coding agents: strict, interactive, and developer-local modes.

## Good first contributions

- Add inert tarball fixtures for suspicious but non-malicious edge cases.
- Improve human-readable risk explanations while preserving JSON stability.
- Add tests for policy exit codes and confirmation prompts.

## Open questions

- What should the default risk threshold be for unattended agents?
- Which external trust sources are reliable enough to influence blocking decisions?
- Should execution happen through `npx`, `npm exec`, or a controlled local install directory?
