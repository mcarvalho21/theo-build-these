# Project roadmap

This repo is a set of collaboration-ready MVPs. The near-term goal is not to turn every idea into a company at once; it is to make each prototype easy to test, critique, and extend.

## Collaboration priorities

1. Keep every package executable with `npm test` and a small demo.
2. Clarify each package's threat model, product boundary, and next experiment.
3. Prefer small, reviewable PRs with tests and agent-readable JSON output.
4. Promote promising package work into split repos only after the monorepo version stays green.

## Package roadmaps

| Package | Current state | Next collaboration milestone |
|---|---|---|
| [`safe-npx`](../packages/safe-npx/ROADMAP.md) | Registry/tarball preflight plus policy gate | Stronger supply-chain signals and safer agent defaults |
| [`source-vault`](../packages/source-vault/ROADMAP.md) | Private path policy with encrypted manifest entries | Real recipient encryption and Git/JJ workflow sketch |
| [`dev-sync`](../packages/dev-sync/ROADMAP.md) | Structure manifest and hydration plan | Local hydration service prototype |
| [`mobile-lab`](../packages/mobile-lab/ROADMAP.md) | Device/app compatibility planner | Real-device smoke test checklist and generated manifests |
| [`agent-workspace`](../packages/agent-workspace/ROADMAP.md) | Headless post/reply/task model with JSON persistence | Minimal HTTP API and agent-session handoff |
| [`weird-bench`](../packages/weird-bench/ROADMAP.md) | Fixture runner with compact JSONL results | More scorers and shareable benchmark packs |

## Good first issues

- Add README examples that match current CLI output.
- Add fixtures covering edge cases already described in package roadmaps.
- Improve error messages without changing public JSON shapes.
- Convert a roadmap task into a failing test, then implement the smallest fix.
- Add docs explaining how an agent should consume a package's JSON output.

## Not yet goals

- Production claims, hosted services, or paid plans.
- Large framework rewrites before product boundaries are validated.
- Security claims beyond the current documented threat models.
