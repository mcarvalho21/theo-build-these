# Next steps across the Theo-inspired repos

This is the current practical sequence: make each prototype cross the line from demo to useful tool, while keeping every next task contributor-sized.

## 1. safe-npx — agent package-execution guard

**Current focus:** strongest wedge; remote package execution is an obvious agent-safety pain.

- [x] Detect newly added/changed lifecycle scripts compared with the previous published version.
- [ ] Add provenance/trust signals from OpenSSF/Socket-style APIs when available.
- [ ] Add local trust cache keyed by `package@version + integrity`, not package name.
- [ ] Add an agent-facing policy preset: `--agent-strict`.
- [ ] Dogfood it as the default wrapper before any future agent-driven `npx`/`npm create` command.

## 2. source-vault — private source-sharing manifests

**Current focus:** policy validation before Git/JJ integration.

- [ ] Add `--validate` to check policies without building a manifest.
- [ ] Warn on private/redact rules that match nothing.
- [ ] Error on unknown recipients or invalid defaults.
- [ ] Add example policies for solo dev, contractor, and open-source partial-share workflows.
- [ ] Explore Git/JJ filter integration after validation is solid.

## 3. dev-sync — structure-first dev machine sync

**Current focus:** make sync plans safe to inspect before mutation.

- [ ] Add `--dry-run` for apply/hydration plans.
- [ ] Group planned operations by `mkdir`, `hydrate`, `refresh`, `replace`, and `delete-local`.
- [ ] Add a conflict explanation mode for changed local files.
- [ ] Add a small real-world fixture repo for demos.
- [ ] Decide whether this is a CLI, daemon, or Git-adjacent extension.

## 4. mobile-lab — Android-compatible platform planner

**Current focus:** convert risk scores into human checklists.

- [ ] Add `--checklist` output for fastboot/ADB experiments.
- [ ] Clearly stop on locked bootloader / rollback blockers.
- [ ] Add app compatibility smoke-test steps.
- [ ] Add example manifests for “safe emulator only” vs “real device lab”.
- [ ] Keep safety language explicit; this should not encourage reckless flashing.

## 5. agent-workspace — post-first collaboration core

**Current focus:** expose the headless model through a tiny local API.

- [ ] Add `--serve --port 8787`.
- [ ] Implement JSON endpoints for workspace, groups, posts, and replies.
- [ ] Add validation errors with useful HTTP statuses.
- [ ] Add `curl` examples in README.
- [ ] Later: bridge Telegram/Discord threads or build a minimal web UI.

## 6. weird-bench — failed-agent-task benchmark fixtures

**Current focus:** make scoring flexible enough for real failures.

- [ ] Add `regex` scorer.
- [ ] Return missing-pattern diagnostics.
- [ ] Add a fixture that demonstrates exact/contains/regex scoring tradeoffs.
- [ ] Add fixture metadata for model/tool/runtime tags.
- [ ] Later: aggregate runs across multiple model commands.

## Operating principles

- Prioritize `safe-npx` first: clearest pain, strongest story, easiest to dogfood immediately.
- Keep each issue small and mergeable.
- Use `claude -p` for second-opinion review when auth works; if it fails, record the blocker and use a separate reviewer lane.
- Every merged change needs tests and CI green before social amplification.
