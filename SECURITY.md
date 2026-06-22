# Security Policy

These packages are prototypes, not hardened security products. Security reports are still welcome, especially for `@build-these/safe-npx` and `@build-these/source-vault`.

## Supported versions

The public `main` branch is the only supported line while the project is pre-1.0.

## Reporting a vulnerability

Please report privately first when the issue could help attackers bypass an `npx` safety check, leak private source material, or execute unexpected code. Use the repository's GitHub security advisory flow if available; otherwise contact the maintainers privately and include:

- affected package and commit/version,
- concise reproduction steps,
- expected vs. actual behavior,
- impact assessment,
- any safe, inert fixture needed to reproduce.

Do not publish weaponized proof-of-concept packages, real tokens, or malware-like payloads in issues, PRs, tests, or fixtures.

## `safe-npx` threat model

`safe-npx` is a preflight and policy gate for remote package execution. It is designed to reduce blind trust by inspecting registry metadata, lifecycle scripts, package bins, tarball contents, and policy constraints before handing off to `npx`.

It does **not** prove that a package is safe. It is not a sandbox, antivirus engine, supply-chain oracle, or replacement for pinning and reviewing dependencies. A successful report means only that the current checks did not flag enough risk to block the configured policy.

High-value security work for `safe-npx` includes:

- bypasses of `--policy` or incorrect exit codes,
- execution before explicit confirmation or before policy evaluation,
- package spec parsing confusion, especially scoped packages and dist-tags,
- tarball scan omissions that hide lifecycle-relevant files,
- unsafe handling of cache/trust decisions,
- misleading JSON output that could cause an agent to allow risky execution.

## Safe research rules

- Use local mock registry metadata or inert tarball fixtures where possible.
- Keep test payloads non-executing and clearly labeled.
- Never include real secrets, credential exfiltration, persistence mechanisms, or destructive commands.
- If a report needs a live npm package to reproduce, coordinate privately before publishing it.

## Disclosure expectations

Maintainers will acknowledge reports as quickly as practical, prioritize fixes by impact, and credit reporters when requested. Because this is an early prototype, fixes may include documentation, changed defaults, tests, or explicit scope reductions rather than a full security guarantee.
