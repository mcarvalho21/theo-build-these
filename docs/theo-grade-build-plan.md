# Theo-grade build plan: make the six prototypes undeniably useful

Last updated: 2026-06-23

Source idea video: https://www.youtube.com/watch?v=wEAb0x3wTRc

## North star

Build six small tools that feel like a Theo challenge answer, not a startup pitch deck:

- **sharp pain**: each tool attacks a dev workflow that already annoys people;
- **one-command proof**: every repo should show value in under 60 seconds;
- **agent-aware by default**: human-readable output plus JSON/policy mode;
- **risk is visible**: package execution, private code, device flashing, and weak evals get explicit guardrails;
- **boring implementation, spicy positioning**: Node built-ins, small pure cores, fast tests, clear CLIs.

## Portfolio strategy

| Priority | Repo | Why it matters | 90-day shape |
|---:|---|---|---|
| 1 | `safe-npx` | Remote package execution is the scariest daily agent/dev footgun. | A real agent package-execution gate with policy presets, provenance/trust signals, cache, and shell integration. |
| 2 | `weird-bench` | Everyone complains benchmarks miss real agent failures. | A fixture runner that turns failures into tiny reproducible evals with useful scorers and model run summaries. |
| 3 | `dev-sync` | Multi-machine dev + agents drift constantly. | A safe sync planner that explains exactly what it would hydrate/refresh/delete before touching disk. |
| 4 | `source-vault` | Git does not handle private/public partial sharing elegantly. | A policy validator + manifest builder that can safely share a redacted/encrypted repo view. |
| 5 | `agent-workspace` | Slack/Discord are chat logs, not agent work surfaces. | Local API around posts, nested replies, and agent task branches; bridge-ready core. |
| 6 | `mobile-lab` | Mobile platform experiments are high-risk and setup-heavy. | A safety-first planner/checklist for emulator/device experiments, not a reckless flashing tool. |

## Competitor and pain-point research

### 1. `safe-npx` — safer package execution for humans and agents

**Competitors / adjacent tools**

- npm audit / npm package provenance / package manager signatures: baseline vulnerability/provenance checks, but not an execution preflight for `npx` one-offs.
- Snyk: strong known-vulnerability workflow and supply-chain guidance. Source: https://snyk.io/articles/npm-security-best-practices-shai-hulud-attack/
- Socket.dev: behavioral package analysis and supply-chain risk signals. Source: https://socket.dev/
- OpenSSF Scorecard / Sigstore / npm provenance: trust and publisher hygiene signals.
- `npq`, npm-security-best-practices collections: closer to “ask before install,” but not agent-policy-first.

**Pain points**

- `npx foo@latest` trains humans and agents to approve remote code execution blindly.
- Existing tools focus on dependencies already in a project, not one-shot executable packages.
- Vulnerability scanners miss novel malware, install hooks, typosquats, packed artifacts, and weird maintainer events.
- Agents need deterministic JSON and policy exit codes, not interactive blog advice.

**Product wedge**

`safe-npx` should become: **“the preflight checklist before an agent runs remote npm code.”**

**Build plan**

1. Done: lifecycle script, tarball, dependency, maintainer, deprecation, release-diff risk.
2. Add `--agent-strict`: low max risk, require pinned version, deny lifecycle scripts, require bin, require integrity.
3. Add trust providers:
   - OpenSSF Scorecard summary when GitHub repo is known.
   - npm provenance/publisher signals when available.
   - optional Socket/Snyk adapters if API key is configured, but never required.
4. Add trust cache keyed by `name@version + integrity`.
5. Add `safe-npx explain <report.json>` / report snapshots so devs can discuss risky packages in PRs.
6. Add shell/agent integration docs: “Before any `npm create` or `npx`, run this.”

**Theo test**

Would Theo use it live before letting an agent install a random package? If not, make the report sharper and the command shorter.

---

### 2. `source-vault` — private paths and share-safe source manifests

**Competitors / adjacent tools**

- `git-crypt`: transparent file encryption in Git; lets repos mix public/private files. Source: https://github.com/AGWA/git-crypt
- `git-annex` encrypted remotes: powerful but heavyweight. Source: https://git-annex.branchable.com/encryption/
- BlackBox, Transcrypt, SOPS, git-secret: secrets/file encryption workflows.
- Git sparse checkout / partial clone: structural subset sharing, not private policy or redaction.
- Jujutsu (`jj`): better snapshot/workflow primitives, not encrypted sharing by itself.

**Pain points**

- Existing Git encryption tools are often all-or-nothing once a collaborator has keys.
- Private files, generated files, examples, test fixtures, and secrets have different sharing semantics.
- Redaction is usually a separate manual process, so people either overshare or give up.
- Agents need temporary, least-privilege source views.

**Product wedge**

`source-vault` should become: **“share a useful repo view without sharing the whole repo.”**

**Build plan**

1. Add `--validate` policy checks before building manifests.
2. Add example policies: open-source cleanup, contractor handoff, agent-limited view.
3. Add `source-vault preview` to print public/private/redacted file groups.
4. Add recipient-group model and per-rule reason strings.
5. Add Git/JJ integration experiment only after validation/preview are great.

**Theo test**

Could this help someone open-source a repo they currently cannot? If yes, it is real.

---

### 3. `dev-sync` — Dropbox for dev-machine structure, not blind file sync

**Competitors / adjacent tools**

- GitHub Codespaces / Dev Containers: reproduce environments, but cloud/container-first. Source: https://docs.github.com/en/codespaces/setting-up-your-project-for-codespaces/adding-a-dev-container-configuration/introduction-to-dev-containers
- chezmoi / dotfiles managers: strong personal config sync. Source: https://www.chezmoi.io/user-guide/machines/containers-and-vms/
- Syncthing / Dropbox / iCloud Drive: generic file sync, poor for code state and `.git` semantics.
- Mutagen / Unison / rsync: sync primitives, not dev-aware UX.
- Nix / devenv / mise: reproducible tooling, not repo structure hydration.

**Pain points**

- Every new machine or agent workspace needs the same repo map, ignores, env hints, and project shape.
- Full file sync is dangerous for `.git`, build artifacts, secrets, and node_modules.
- Devs want instant structure with lazy content hydration, not “sync everything now.”
- Sync tools often cannot explain what they will mutate before doing it.

**Product wedge**

`dev-sync` should become: **“the manifest-first sync planner for `~/Code`.”**

**Build plan**

1. Add `--dry-run` apply summary.
2. Add conflict explanation for changed local files.
3. Add `.syncignore` examples for Node, Python, Rust, mobile.
4. Add manifest signing/hash verification later.
5. Add daemon/watch mode only when CLI semantics are safe.

**Theo test**

Would a dev trust it not to trash their laptop? Dry-run and explanations decide that.

---

### 4. `mobile-lab` — safety-first Android-compatible experimentation planner

**Competitors / adjacent tools**

- GrapheneOS install/build docs: precise but device-specific and intimidating. Sources: https://grapheneos.org/build and https://grapheneos.org/install/cli
- LineageOS ADB/fastboot guides. Source: https://wiki.lineageos.org/adb_fastboot_guide
- Android Studio emulator / Gradle managed devices: app testing, not platform distribution strategy.
- Expo / React Native / Flutter: app frameworks, not platform control.

**Pain points**

- Flashing/rooting/custom ROM work has real bricking/security risk.
- App compatibility is fragmented: Play Integrity, attestation, Google services, sideloading, permissions.
- People need a stop/go checklist more than another vague “install adb” doc.
- Agents should not tell users to flash devices without explicit safety gates.

**Product wedge**

`mobile-lab` should become: **“a preflight planner for mobile platform experiments.”**

**Build plan**

1. Add `--checklist` output for ADB/fastboot/emulator experiments.
2. Add stop conditions for locked bootloader, missing backups, missing platform tools.
3. Add app compatibility smoke-test checklist.
4. Add emulator-first examples.
5. Keep real-device flashing as guided planning only, not automated flashing.

**Theo test**

Would this stop someone from doing something dumb while still helping them explore? That is the bar.

---

### 5. `agent-workspace` — post-first collaboration for humans and agents

**Competitors / adjacent tools**

- Slack / Discord / Teams: huge network effects, but chat-first and context-decay-prone.
- Linear / GitHub Issues: better work objects, weaker conversational context.
- AI Slack bots / agents: bolt-on agents inside a chat product.
- Emerging AI workspaces: often closed, heavyweight, or demo-first.

**Pain points**

- Chat optimizes sending messages, not returning to durable context.
- Threads die even when the underlying work is still active.
- Agents need persistent task branches and structured callbacks, not just messages in a channel.
- Slack search/history is poor as a project memory substrate.

**Product wedge**

`agent-workspace` should become: **“threads as work objects, not chat exhaust.”**

**Build plan**

1. Add tiny local HTTP API.
2. Add import/export persistence through the API.
3. Add agent task status transitions: queued/running/blocked/done.
4. Add bridge examples for Telegram/Discord.
5. Add a minimal web/TUI viewer only after API is solid.

**Theo test**

Could this make an agent’s work easier to inspect than a Slack thread? If not, it is just another chat toy.

---

### 6. `weird-bench` — failed agent tasks as tiny benchmark fixtures

**Competitors / adjacent tools**

- SWE-bench: realistic GitHub issue benchmark, but heavyweight.
- OpenAI Evals / Inspect AI / DeepEval / Promptfoo / LangSmith / Braintrust / Phoenix: strong eval ecosystems, but often too much machinery for one weird failure.
- Custom scripts in repos: quick but non-standard and hard to aggregate.

**Pain points**

- Real model failures disappear in chat logs.
- Existing eval tools can be too heavyweight for “this one task failed weirdly.”
- Scoring needs flexible adapters: exact, contains, regex, JSON shape, command exit, file diff.
- Contributors need fixtures they can understand in one directory.

**Product wedge**

`weird-bench` should become: **“turn one cursed agent failure into a reproducible eval in five minutes.”**

**Build plan**

1. Add `regex` scorer.
2. Add JSON-shape scorer.
3. Add fixture metadata for task type, tools, model, and failure mode.
4. Add multi-command runner and summary table.
5. Add examples from this repo’s own failed/edge cases.

**Theo test**

Would someone actually paste a failed agent prompt into this instead of rage-tweeting? Make that path tiny.

## Build waves

### Wave 1 — “make the safety wedge undeniable”

Claude’s review was right: do not hedge six bets before the strongest repo has a knockout demo. Wave 1 goes all-in on `safe-npx`, with `weird-bench` supporting the eval story.

1. `safe-npx --agent-strict`
2. `safe-npx-corpus` with catch-rate and false-positive-rate reporting
3. realistic benign-friction fixtures so strict-policy pain is visible, not hidden
4. `weird-bench regex` scorer so failed agent/security tasks can become fixtures

Why: a measurable agent package-execution guard is the clearest “Theo would care” wedge.

### Wave 2 — “make the roadmap real”

Implement one high-leverage next feature in the serious-but-thinner repos:

1. `source-vault --validate`
2. `dev-sync --dry-run`
3. `mobile-lab --checklist`, safety-first and emulator-first

Why: these are contributor-sized, independent, and make the repos obviously more useful without pretending they are finished platforms.

### Wave 3 — “agent interfaces”

Expose usable surfaces:

1. `agent-workspace --serve`
2. `mobile-lab --checklist`
3. better examples/demos across all repos

### Wave 4 — “Theo would share this”

Polish for public attention:

1. GIF/demo recordings or asciinema-style transcripts
2. crisp README hero examples
3. issue labels by difficulty and project priority
4. one X thread per repo with a concrete demo, not vague launch copy

## Definition of good enough

A repo graduates from prototype to “Theo might like this” when:

- one command shows the core value;
- tests cover the risky branch;
- README has a real example and a next step;
- JSON output is useful to agents;
- there is a sharp sentence explaining why the existing world sucks;
- CI is green in monorepo and split repo.
