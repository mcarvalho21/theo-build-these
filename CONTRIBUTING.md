# Contributing

Thanks for helping turn these prototypes into collaboration-ready tools. This repo is a multi-package workspace of small MVPs; contributions are most useful when they keep the demos runnable and the product questions clear.

## Quick start

```bash
npm install
npm test
npm run demo:all
```

Requirements: Node.js 20 or newer and npm workspaces.

## How to contribute

1. Pick a scoped task from [`docs/roadmap.md`](docs/roadmap.md) or a package `ROADMAP.md`.
2. Open an issue or draft PR before large design changes.
3. Keep changes small: one package, one behavior, or one doc improvement per PR when possible.
4. Add or update tests for behavior changes.
5. Run `npm test` before requesting review. If a demo is affected, also run the relevant `npm run demo:<package>` command.

## Repository layout

- `packages/safe-npx` — safer `npx` preflight reports and agent policy gates.
- `packages/source-vault` — Git-adjacent private-path policy and encrypted manifests.
- `packages/dev-sync` — structure-first dev-machine sync planning.
- `packages/mobile-lab` — Android-compatible mobile platform planning/control-plane prototype.
- `packages/agent-workspace` — post-first collaboration model for humans and agents.
- `packages/weird-bench` — capture failed agent tasks as repeatable benchmark fixtures.
- `docs/` — product notes, roadmap, and launch/social drafts.

## PR checklist

- [ ] The change is scoped and explained in the PR description.
- [ ] Tests pass with `npm test`.
- [ ] New behavior has tests or an explicit reason tests were not added.
- [ ] Docs/README/roadmap notes are updated when user-facing behavior changes.
- [ ] Security-sensitive changes, especially in `safe-npx` or `source-vault`, mention threat-model impact.

## Security-sensitive contributions

Do not add real malware, credential-stealing samples, or live secrets to tests or fixtures. Use inert fixtures that demonstrate risky patterns without causing harm. See [`SECURITY.md`](SECURITY.md) for reporting and safe research guidance.

## Style

Prefer dependency-light Node.js modules, readable tests using `node:test`, deterministic output, and clear JSON shapes that coding agents can consume.

These prototypes use a Theo-inspired engineering style: small working primitives, fast feedback, visible risk, strong defaults, low ceremony, and the occasional useful bit of fun. See [`docs/theo-inspired-engineering.md`](docs/theo-inspired-engineering.md).
