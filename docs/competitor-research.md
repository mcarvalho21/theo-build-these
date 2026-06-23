# Competitor and pain-point research

Last updated: 2026-06-22

This document consolidates the parallel research pass for the six Theo-inspired prototypes. It is deliberately product-facing: competitors, validated pain, gaps, and concrete product opportunities.

## Strategic synthesis

The shared opportunity is not “six random CLIs.” It is a small suite for **agent-era software work**:

1. **Before execution:** `safe-npx` blocks risky package execution.
2. **Before sharing:** `source-vault` builds policy-controlled source views.
3. **Before work starts:** `dev-sync` plans the machine/repo/task environment.
4. **Before device experiments:** `mobile-lab` plans Android/runtime safety and compatibility.
5. **During collaboration:** `agent-workspace` gives durable post/run/decision objects.
6. **After failure:** `weird-bench` turns failures into reproducible fixtures.

Best integrated loop:

```text
post → task context → environment plan → package/source/device preflight → agent/human work → artifact → benchmark if it failed
```

## 1. safe-npx

### Competitors / adjacent tools

| Area | Examples | What they do | Gap to exploit |
|---|---|---|---|
| Safe npm wrappers | Socket `socket npm` / `socket npx`, Aikido Safe Chain | Wrap package-manager commands with supply-chain and behavioral checks, including malicious packages, scripts, typosquats, protestware, and telemetry-style risks. | Strong direct competitors. Opportunity is not “nobody does npx preflight”; it is local-first, dependency-light, agent-policy JSON, and credential/agent-config theft scanning. |
| Lifecycle allowlisting | LavaMoat `@lavamoat/allow-scripts`, pnpm `approve-builds` / `allowBuilds` | Deny or approve install scripts. | Mostly project/install workflows, not one-off `npx foo@latest`. |
| Package manager hardening | pnpm `minimumReleaseAge`, Yarn Hardened Mode | Release cooldown, lockfile metadata validation. | Helps project installs/lockfiles; weak for arbitrary `npx` execution. |
| SCA / vulnerability scanners | npm audit, Snyk, Dependabot, OSV, Semgrep, Sonatype, Endor | Known CVE/dependency graph risk. | Strong for known vulnerabilities and dependency policy; less tuned for tiny one-command local agent gates before arbitrary CLI execution. |
| Provenance | npm provenance, Trusted Publishing, Sigstore, SLSA | Attest build origin. | Provenance proves origin, not safety or maintainer/CI compromise resistance. |

URLs:

- https://socket.dev/blog/introducing-safe-npm
- https://docs.socket.dev/docs/socket-npm-socket-npx
- https://www.aikido.dev/blog/introducing-safe-chain
- https://lavamoat.github.io/guides/allow-scripts/
- https://pnpm.io/supply-chain-security
- https://pnpm.io/cli/approve-builds
- https://yarnpkg.com/features/security
- https://docs.npmjs.com/generating-provenance-statements/
- https://snyk.io/blog/weaponizing-ai-coding-agents-for-malware-in-the-nx-malicious-package/

### Pain points

- `npx` resolves, downloads, installs, and executes with no lockfile/cooldown habit.
- Install-time malware can run before humans inspect the tree.
- Coding agents amplify the blast radius because they execute setup commands quickly and may expose secrets/context.
- CVE scanners do not catch fresh malware or weird one-off executable packages well.
- Commercial wrappers already validate the category; the gap for this repo is a tiny, local-first, dependency-light gate tuned for agent policy, JSON, and explicit credential/config theft signals.

### Product opportunity

Positioning:

> A tiny, local-first preflight gate before humans or agents run remote npm code.

Highest-leverage features:

1. No-code-execution preflight: metadata, tarball, scripts, bins, maintainers, publish time, integrity.
2. Agent-readable policy verdict: `allow`, `warn`, `block`, JSON, deterministic exit codes.
3. Cooldown/freshness policy.
4. Release diff vs previous version.
5. Typosquat/name confusion checks.
6. Agent-threat checks for `.claude`, Cursor/Windsurf/VS Code config, SSH/npm/cloud credentials.
7. Optional sandbox execution with temp `HOME`, stripped env, and network policy.

## 2. source-vault

### Competitors / adjacent tools

| Area | Examples | What they do | Gap to exploit |
|---|---|---|---|
| Git file encryption | git-crypt, transcrypt, git-secret, SOPS, BlackBox | Encrypt selected secrets/files in repos. | Secrets-centric; not policy/proof/redacted source sharing. |
| Encrypted remotes | git-remote-gcrypt, git-annex encryption | Encrypt remote/storage layer. | All-or-nothing remote privacy; poor partial-share UX. |
| Partial checkout | Git sparse-checkout / partial clone | Performance/subset checkout. | Not access control or share policy. |
| AI repo packing | Repomix, GitIngest | LLM-friendly repo digests. | Optimized for giving models code; weaker policy/proof/redaction story. |
| Redaction tools | generic redactors / safe-paste tools | Remove secrets from text. | Not Git-native, repeatable, recipient-aware source views. |

URLs:

- https://github.com/AGWA/git-crypt
- https://github.com/elasticdog/transcrypt
- https://git-secret.io/
- https://github.com/getsops/sops
- https://git-scm.com/docs/git-sparse-checkout
- https://github.com/yamadashy/repomix
- https://github.com/coderamp-labs/gitingest

### Pain points

- Existing tools solve “encrypt secrets in Git,” not “share a useful redacted source view.”
- `.gitignore` / `.repomixignore` style exports are brittle and hard to audit.
- Sparse checkout is often mistaken for privacy, but it is not an access-control boundary.
- Teams need repeatable policies, least-privilege AI/contractor/customer exports, audit trails, and proof of what was withheld.
- Proprietary source, prompts, internal comments, fixtures, customer logic, roadmap docs, and infra maps are not “secrets” but still private.

### Product opportunity

Positioning:

> Repomix for teams that cannot share the whole repo.

Highest-leverage features:

1. `source-vault.yml` with private paths, redaction rules, recipient groups, profiles.
2. `export --profile llm|contractor|oss|support` to create deterministic redacted trees.
3. Manifest with commit hash, policy hash, included/excluded/redacted files.
4. `--validate` / `preview` before export.
5. AI-safe context mode with file tree, token counts, summaries, and redaction explanations.
6. CI/pre-share guard for files moved into public paths without policy updates.

## 3. dev-sync

### Competitors / adjacent tools

| Area | Examples | What they do | Gap to exploit |
|---|---|---|---|
| Cloud dev envs | Codespaces, Coder, Gitpod/Ona, DevPod, Daytona | Provision cloud/container/sandbox workspaces. | Machine/workspace provisioning, not structure-first personal/team dev-state planning. |
| Dotfiles | chezmoi, yadm, Stow, Mackup, Dotbot | Sync home/editor/shell config. | Not repo/task/env graph; manual and fragile for whole dev state. |
| Repro tools | Dev Containers, Nix, Devbox, devenv, mise | Toolchain/environment reproducibility. | Project/tool focused, not full workspace sync or lazy hydration. |
| File sync | Mutagen, Syncthing, Unison, Resilio, rsync | Move bytes. | Not code-aware; conflicts and `.git` semantics are risky. |
| Large repo hydration | sparse-checkout, partial clone, Scalar, EdenFS/Sapling | Scale monorepos and lazy file access. | Git/source focused, not machine/env/task planning. |

URLs:

- https://docs.github.com/en/codespaces/about-codespaces/deep-dive
- https://coder.com/
- https://devpod.sh/
- https://www.chezmoi.io/
- https://containers.dev/
- https://www.jetify.com/devbox
- https://devenv.sh/
- https://mise.jdx.dev/
- https://mutagen.io/
- https://git-scm.com/docs/sparse-checkout
- https://sapling-scm.com/docs/scale/overview/

### Pain points

- Fresh machine setup is still brittle: README scripts rot, dotfiles assume too much, containers are project-scoped.
- Developers now work across laptop, cloud workspace, dev container, remote SSH box, agent sandbox, and CI runner.
- Generic file sync is dangerous for code repos, lockfiles, generated artifacts, package caches, and secrets.
- Monorepos are too large to eagerly hydrate; sparse profiles are hard to maintain manually.
- Agents need reproducible task capsules: repo slice, tools, env contract, tests, services.

### Product opportunity

Positioning:

> Structure-first sync planner for dev machines and agent sandboxes.

Highest-leverage features:

1. `scan`: discover repos, tools, package managers, config, services, secrets references.
2. `plan`: classify safe/apply/manual/conflict operations before touching disk.
3. `hydrate <task|repo|branch>`: fetch only the repo slice/deps/context needed.
4. `doctor`: explain why local/container/agent differs from expected state.
5. `handoff`: export a portable task capsule for agents/cloud workspaces.

## 4. mobile-lab

### Competitors / adjacent tools

| Area | Examples | What they do | Gap to exploit |
|---|---|---|---|
| Official compatibility | Android CTS, Trade Federation, Cuttlefish CTS | Certification/compat validation. | Heavy, expert-oriented; not early risk/planning. |
| Compat framework | Android app compatibility tools, `adb shell am compat` | Toggle Android behavior changes. | Fragmented docs; no migration planner or reset tracking. |
| Flashing/raw tools | Android Flash Tool, ADB, fastboot, Lineage guides | Device flashing/debugging. | Powerful/destructive; no universal dry-run/safety verifier. |
| Emulators | Android Emulator, Cuttlefish, Genymotion | App/platform testing envs. | Choosing emulator vs Cuttlefish vs device is manual. |
| Device farms | Firebase Test Lab, BrowserStack, Sauce, AWS Device Farm | Run app tests on devices. | App-level symptoms, not platform-risk planning. |
| Device control/flashing GUIs | STF, scrcpy, PixelFlasher, ADB AppControl, Universal Android Debloater | Device control, mirroring, package operations, flashing. | Execution tools, not general risk/checklist/rollback planners. |

URLs:

- https://source.android.com/docs/compatibility/cts
- https://source.android.com/docs/core/tests/tradefed
- https://developer.android.com/guide/app-compatibility/test-debug
- https://flash.android.com/
- https://developer.android.com/tools/adb
- https://source.android.com/docs/devices/cuttlefish
- https://firebase.google.com/docs/test-lab
- https://github.com/DeviceFarmer/stf
- https://github.com/Genymobile/scrcpy
- https://github.com/badabing2005/PixelFlasher

### Pain points

- Android compatibility knowledge is fragmented by version, CTS, compat framework, behavior changes, and platform tools.
- ADB/fastboot are powerful but unsafe: no dry-run, easy to forget slot/mode/partition/wipe implications.
- Device farms run tests but do not help decide what to test.
- Target-SDK migration requires mapping behavior changes to specific app risks.
- Platform/device experiments are ad-hoc and hard to reproduce.

### Product opportunity

Positioning:

> Safety and compatibility copilot for Android platform/app experiments.

Highest-leverage features:

1. Android version / target SDK compatibility checklist generator.
2. Compat-framework ADB toggle planner with reset/rollback.
3. ADB/fastboot command risk linter.
4. Device state snapshot and experiment manifest.
5. Environment recommender: emulator vs Cuttlefish vs real Pixel vs device farm.
6. Risk-based test matrix planner for Firebase/local/device-farm runs.

## 5. agent-workspace

### Competitors / adjacent tools

| Area | Examples | What they do | Gap to exploit |
|---|---|---|---|
| Chat/work suites | Slack AI/Agentforce, Teams/Copilot | Bring agents into existing chat/work surfaces. | Chat-first, ephemeral, weak provenance. |
| Enterprise AI/search | Dust, Glean, Atlassian Rovo | Agents/search across enterprise tools. | Broad/heavy; not developer/post-first workspace core. |
| Agent platforms | OpenAgents | Human-agent collaboration platform. | Broad platform; opportunity for opinionated software-team primitives. |
| Coding agents with Slack | Devin, Cursor Background Agents, Factory, Codegen | Assign coding work through Slack/Linear/GitHub. | Agent execution platforms, not durable shared collaboration substrate. |

URLs:

- https://slack.com/ai-agents
- https://dust.tt/
- https://www.glean.com/agents/slack
- https://www.atlassian.com/software/rovo
- https://openagents.org/
- https://devin.ai/
- https://cursor.com/docs/integrations/slack
- https://factory.ai/product/slack
- https://docs.codegen.com/introduction/overview

### Pain points

- Slack threads bury decisions, agent runs, and artifacts.
- Agent work lacks durable provenance: who initiated, what context, which tools/files, what assumptions, what changed.
- Agent identity/authority/scopes are unresolved.
- Teams need plan/tool/merge approval checkpoints.
- Every agent vendor has its own dashboard/log; no shared timeline.

### Product opportunity

Positioning:

> Post-first collaboration for human-agent software teams.

Core primitives:

1. `Post`: durable work/context object.
2. `Run`: agent execution with plan, context, tools, logs, outputs, costs, approvals.
3. `Decision`: explicit timestamped decision record.
4. `Artifact`: PR, branch, file, design doc, screenshot, terminal log, test result.
5. `Handoff`: human→agent, agent→human, agent→agent context contracts.
6. `Authority`: agent identity, scopes, approvals, budget/time limits.
7. Adapters: Slack, Linear, GitHub, Jira, Notion, email.

## 6. weird-bench

### Competitors / adjacent tools

| Area | Examples | What they do | Gap to exploit |
|---|---|---|---|
| Code-agent benchmarks | SWE-bench, Terminal-Bench, AgentBench | Curated benchmark suites. | Not “your failed run → fixture.” |
| Harnesses | OpenHands benchmarks, OpenAI Evals, Inspect AI | Evaluation frameworks/registries. | Users still author/curate tasks manually. |
| Browser/OS/mobile tasks | BrowserGym/WebArena/WorkArena, OSWorld, AndroidWorld | Realistic environment benchmarks. | Heavy environment setup; not general failure capture. |
| Eval/observability platforms | LangSmith, Braintrust | Traces, evals, regression workflows. | Platform-centric; fixture portability/reproducible sandboxes remain hard. |

URLs:

- https://www.swebench.com/
- https://github.com/SWE-bench/SWE-bench
- https://www.tbench.ai/
- https://github.com/OpenHands/benchmarks
- https://github.com/THUDM/AgentBench
- https://github.com/ServiceNow/BrowserGym
- https://github.com/xlang-ai/OSWorld
- https://github.com/google-research/android_world
- https://www.langchain.com/langsmith/evaluation
- https://www.braintrust.dev/articles/turn-llm-production-failures-into-regression-tests
- https://github.com/openai/evals

### Pain points

- Failed agent traces are not reusable; teams debug once and lose the failure.
- Benchmark authoring is expensive: Docker, setup, teardown, scoring, docs, hidden tests.
- Reproducibility drifts with network, package versions, clocks, secrets, APIs, and system state.
- Success oracles are hard: deterministic tests are work, LLM judges are noisy.
- Benchmarks are easy to game or leak hidden answers.
- Existing eval products/frameworks are siloed.

### Product opportunity

Positioning:

> From weird agent failure to reproducible benchmark fixture.

Highest-leverage features:

1. Trace importers: Hermes, OpenHands, LangSmith, Braintrust, Claude/Codex logs, raw terminal history.
2. Dockerized fixture generator.
3. Deterministic scorer/test scaffold.
4. Replay runner with pass/fail and summary.
5. Fixture lint: dependency pinning, hidden-answer leakage, network drift, time/randomness.
6. Exporters: SWE-bench-like, Terminal-Bench-like, OpenAI Evals, Inspect AI, BrowserGym, OpenHands.
7. Failure taxonomy: setup, wrong file, ignored instruction, tool misuse, context loss, flaky API, hallucinated command, premature success claim.

## Combined opportunities

### dev-sync + agent-workspace

```text
human post → task object → dev-sync task capsule → agent workspace → PR/artifact → durable update
```

This is meaningfully different from Slack + Devin or Codespaces + dotfiles: the workspace owns durable context, while dev-sync owns reproducible task environment planning.

### mobile-lab + weird-bench

```text
mobile-lab experiment manifest → agent/device failure → weird-bench fixture → AndroidWorld/Terminal-Bench-like regression
```

This connects Android runtime safety, ADB/fastboot planning, target-SDK compatibility, and agent benchmark generation.

## Recommended next build order

This order intentionally follows the Theo-grade plan: **win the sharpest wedge first**, then use the research to sequence the rest. `weird-bench` stays #2 strategically because it makes `safe-npx` measurable and gives the portfolio an agent-eval spine; `source-vault` is the next product feature wave after that support layer.

1. **safe-npx**: keep pushing the safety wedge.
   - Add corpus JSON output.
   - Add allowlist/review mechanism for benign-friction packages.
   - Add freshness/cooldown policy.
   - Add agent-threat pattern scan.
2. **weird-bench**: support the safety/eval story.
   - Add JSON-shape scorer.
   - Add fixture lint.
   - Add examples from `safe-npx` policy/corpus regressions.
3. **source-vault**: build `--validate` + `preview` because the research validates the “Repomix for teams that cannot share the whole repo” wedge.
4. **dev-sync**: build `--dry-run` + task capsule because the research validates “structure-first, not generic sync.”
5. **mobile-lab**: build `--checklist` + ADB/fastboot command risk linter.
6. **agent-workspace**: add a tiny local HTTP API with posts/runs/decisions/artifacts.
