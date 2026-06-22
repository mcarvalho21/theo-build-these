# @build-these/safe-npx

`safe-npx` is a proof-of-concept safer `npx` wrapper for humans and coding agents.

It does **not** claim to prove a package is safe. It makes the install/execute decision less blind by showing useful registry metadata before code runs.

## Usage

```bash
safe-npx create-vite@latest --dry-run
safe-npx create-vite@latest --json --dry-run
safe-npx create-vite@latest -- --template react
```

Without `--dry-run`, it asks for an explicit package-name confirmation before executing `npx --yes <package>@<resolved-version>`.

## Current risk signals

- lifecycle scripts: `preinstall`, `install`, `postinstall`, `prepare`, etc.
- missing executable `bin` for an NPX-style invocation
- dependency surface size
- missing maintainer metadata
- deprecated package/version
- digit-containing package names as a light typo-squat prompt
- large unpacked package size

## Agent integration

Use `--json --dry-run` and have the agent inspect:

```json
{
  "risk": { "score": 35, "level": "medium", "reasons": [] },
  "lifecycleScripts": {},
  "bins": [],
  "integrity": "sha512-..."
}
```

A future Hermes/agent policy could block `risk.level === "high"`, ask the user on `medium`, and allow `low` only for pinned versions.

## Next MVP steps

- download tarball without executing and scan contents for obfuscation/minified blobs
- compare latest release diff against prior version
- flag newly added install scripts
- query Socket/OpenSSF/package provenance APIs when available
- cache trust decisions per package+integrity, not just package name


## Hermes / agent guard mode

Use a strict JSON policy before any remote package execution:

```bash
safe-npx create-vite@9.0.7 --policy examples/hermes-agent-policy.json --dry-run --json
```

Recommended agent defaults:

```json
{
  "maxRisk": "low",
  "requireBin": true,
  "denyLifecycleScripts": true,
  "requirePinnedVersion": true
}
```

Exit codes:

- `0`: policy allowed or normal execution succeeded
- `2`: user declined execution confirmation
- `3`: dry-run policy block
- `4`: execution policy block

This gives Hermes-style coding agents a machine-readable gate: inspect first, block risky package execution by default, and escalate to Marco only when needed.
