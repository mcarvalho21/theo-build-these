# Theo-inspired engineering notes

This repo is not Theo's code and should not pretend to be. The goal is to use a **Theo-inspired** taste profile: pragmatic, sharp, agent-era dev tooling, strong defaults, fast feedback, and a little bit of fun.

These notes are based on the ideas in the source video plus a quick read of public `t3dotgg` repos such as `slotslop`.

## Product taste

- Build the tool you wish existed, then make it useful enough that other devs can touch it.
- Prefer a small working primitive over a big speculative platform.
- Make the scary part explicit: package execution risk, private source paths, stale dev environments, app distribution blockers, lost agent context, weak benchmarks.
- Keep the first user path short: install → run one command → see value.
- Fun is allowed when it clarifies the product. Vibes are seasoning, not architecture.

## Code taste

- Keep core logic pure where possible; put IO in thin CLI wrappers.
- Use small named helpers instead of framework ceremony.
- Make data models obvious and local: simple objects, arrays, and typed-ish shape docs even in plain JS.
- Comments should explain intent, constraints, or weird tradeoffs — not narrate every line.
- Use direct, readable names: `risk`, `findings`, `hydrationPlan`, `classifyApp`, `threadTree`.
- Default to boring Node built-ins until a dependency clearly pays rent.
- Keep commands copy/pasteable and fast.

## CLI taste

- `--json` for agents, readable output for humans.
- `--dry-run` before touching anything risky.
- Exit codes should mean something.
- If a command blocks or refuses, say why and tell the user exactly what to do next.
- No hidden magic around secrets, credentials, or remote code execution.

## Repo taste

- README should answer: what is this, why does it exist, how do I run it, what is next?
- Roadmaps should be honest and concrete, not corporate vapor.
- Issues should be small enough for a contributor to finish without mind-reading.
- Tests should exercise behavior, not implementation trivia.
- CI should be simple enough that a failure tells you something.

## Review checklist

Before merging a change, ask:

- Does this make the prototype more real?
- Can a contributor understand the next step?
- Did we preserve the fast path?
- Is the risky thing visible instead of hidden?
- Did the tests actually run?

## Voice

Use direct language. It is okay to be a little spicy in docs, but the code should stay calm.

Good:

> `safe-npx` exists because agents need a better answer than blindly running remote package code.

Less good:

> This enterprise-grade supply-chain trust orchestration platform optimizes package governance.

Ship the thing. Make the danger legible. Keep moving.
