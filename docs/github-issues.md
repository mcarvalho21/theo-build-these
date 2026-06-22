# GitHub issue drafts

These are copy/paste-ready GitHub issue drafts for the public repos under `mcarvalho21`. They are intentionally scoped as contributor-friendly next steps and should be created manually after maintainer review.

## mcarvalho21/theo-build-these

### Issue 1

**Title:** Add a contributor quickstart that explains the monorepo and split-repo workflow

**Labels:** `good first issue`, `help wanted`, `documentation`

**Body:**

````markdown
## Summary

Add a short contributor quickstart to the monorepo so new contributors understand how to install, test, run demos, and choose between working in this monorepo or one of the split repos.

## Why

The repo currently has six working MVP packages, plus public split repos. A first-time contributor should be able to get from clone → tests → one package demo without guessing the workflow.

## Tasks

- [ ] Add a `CONTRIBUTING.md` at the repo root.
- [ ] Document the basic setup flow:
  - `npm install`
  - `npm test`
  - `npm run demo:all`
- [ ] Add a package map with one-line descriptions for:
  - `packages/safe-npx`
  - `packages/source-vault`
  - `packages/dev-sync`
  - `packages/mobile-lab`
  - `packages/agent-workspace`
  - `packages/weird-bench`
- [ ] Explain that focused package work can happen in the split repos, while broad/cross-package changes can happen in this monorepo.
- [ ] Link to `docs/ideas.md` for product context.
- [ ] Add a short "good first PR" checklist:
  - keep changes scoped
  - add or update tests when behavior changes
  - run `npm test` before opening the PR

## Acceptance criteria

- A new contributor can clone the repo and run the test suite using only the new contributor guide.
- The guide clearly names all six packages and their purpose.
- The guide explains when to use the monorepo vs. split repos.
- `npm test` still passes.
````

---

## mcarvalho21/safe-npx

### Issue 1

**Title:** Add a release-diff risk signal for newly added lifecycle scripts

**Labels:** `good first issue`, `help wanted`, `enhancement`, `security`

**Body:**

````markdown
## Summary

Add a `safe-npx` risk signal that compares the resolved package version against the previous published version and flags lifecycle scripts that were newly added.

## Why

Install hooks such as `preinstall`, `install`, `postinstall`, and `prepare` are high-value risk signals. A package that recently added one of these hooks should be more visible to humans and agents before execution.

## Suggested approach

- Fetch package metadata from the npm registry for the requested package.
- Determine the resolved version and the immediately previous semver version when available.
- Compare lifecycle scripts between the previous version and resolved version.
- Add a finding when a lifecycle script exists in the resolved version but not in the previous version.
- Include the finding in both human output and `--json --dry-run` output.
- Increase the risk score for newly added lifecycle scripts.

## Tasks

- [ ] Add a helper that identifies the previous published version from npm metadata.
- [ ] Add a helper that compares lifecycle script keys between two version manifests.
- [ ] Add the new signal to the risk reasons.
- [ ] Include structured JSON output such as `newLifecycleScripts` or similar.
- [ ] Add tests covering:
  - no previous version available
  - no new lifecycle scripts
  - one or more newly added lifecycle scripts

## Acceptance criteria

- `safe-npx <pkg> --dry-run` reports newly added lifecycle scripts when test metadata contains them.
- `safe-npx <pkg> --json --dry-run` exposes the same signal in machine-readable form.
- Existing tests continue to pass.
````

---

## mcarvalho21/source-vault

### Issue 1

**Title:** Add a manifest validation command for source-vault policies

**Labels:** `good first issue`, `help wanted`, `enhancement`

**Body:**

````markdown
## Summary

Add a validation mode that checks a `source-vault` policy and workspace before producing a share manifest.

## Why

Before this prototype grows into Git/JJ integration and recipient encryption, contributors need a safe way to verify policy files and catch common mistakes such as invalid globs, unknown recipients, or private rules that match nothing.

## Suggested CLI

```bash
source-vault ./examples/repo ./examples/vault.policy.json --validate
```

The command should print validation findings and exit non-zero for errors.

## Tasks

- [ ] Add a `--validate` CLI option.
- [ ] Validate that every private rule with `recipients` references recipients defined in the policy.
- [ ] Warn when a private rule matches no files in the target workspace.
- [ ] Warn when a redact rule matches no files in the target workspace.
- [ ] Validate that `default` is either `public` or `private` when present.
- [ ] Add tests for valid policy, unknown recipient, invalid default visibility, and no-match warnings.
- [ ] Document validation mode in `README.md`.

## Acceptance criteria

- `source-vault ./examples/repo ./examples/vault.policy.json --validate` succeeds for the example policy.
- Invalid policies produce clear messages and non-zero exit codes.
- Warnings do not block success unless there are also validation errors.
- Existing tests continue to pass.
````

---

## mcarvalho21/dev-sync

### Issue 1

**Title:** Add a dry-run apply summary for dev-sync manifests

**Labels:** `good first issue`, `help wanted`, `enhancement`

**Body:**

````markdown
## Summary

Add a dry-run mode that prints the planned `dev-sync` operations without creating directories or `.hydrate.json` placeholders.

## Why

`dev-sync` already builds an apply plan with operations such as `mkdir`, `hydrate`, `refresh`, `replace`, and `delete-local`. A contributor-friendly dry run would let users inspect what would happen before touching their local workspace.

## Suggested CLI

```bash
dev-sync ~/Code remote-manifest.json --dry-run
```

## Tasks

- [ ] Add a `--dry-run` CLI option for manifest apply mode.
- [ ] Reuse the existing apply-plan logic.
- [ ] Print a readable summary grouped by operation type.
- [ ] Do not create directories, replace files, delete files, or write `.hydrate.json` placeholders in dry-run mode.
- [ ] Include enough detail per operation to identify the target path and expected source hash/size when available.
- [ ] Add tests proving dry-run mode leaves the filesystem unchanged.
- [ ] Document dry-run mode in `README.md`.

## Acceptance criteria

- Running `dev-sync <local> <manifest> --dry-run` prints planned operations and changes no files.
- Existing non-dry-run behavior is unchanged.
- Tests cover both output and no-filesystem-mutation behavior.
````

---

## mcarvalho21/mobile-lab

### Issue 1

**Title:** Generate a starter fastboot checklist from a mobile-lab plan

**Labels:** `good first issue`, `help wanted`, `enhancement`, `documentation`

**Body:**

````markdown
## Summary

Add a mode that turns a `mobile-lab` compatibility plan into a starter fastboot/flashing checklist for open-bootloader Android devices.

## Why

The MVP currently scores device/app compatibility and risk. The next useful step is to produce a concrete, human-readable checklist that explains what a developer would need before experimenting on a real device.

## Suggested CLI

```bash
mobile-lab examples/device-apps.json --checklist
```

## Tasks

- [ ] Add a `--checklist` CLI option.
- [ ] Generate checklist sections for:
  - device bootloader status
  - required backups
  - OEM unlock / USB debugging prerequisites
  - fastboot/adb availability
  - image/manifest files needed
  - app compatibility smoke tests
  - rollback plan
- [ ] Include current plan risk level and blockers in the checklist.
- [ ] If `canProceed` is false, make the checklist clearly state that flashing should not proceed until blockers are resolved.
- [ ] Add tests for clear/low-risk and high-risk plan output.
- [ ] Document checklist mode in `README.md`.

## Acceptance criteria

- `mobile-lab examples/device-apps.json --checklist` prints a readable checklist.
- High-risk plans include a clear stop/warning section.
- JSON plan behavior remains unchanged when `--checklist` is not used.
- Existing tests continue to pass.
````

---

## mcarvalho21/agent-workspace

### Issue 1

**Title:** Add a small HTTP API for creating posts and replies

**Labels:** `good first issue`, `help wanted`, `enhancement`

**Body:**

````markdown
## Summary

Add a minimal HTTP API around the existing headless `agent-workspace` core so contributors can start building bridges and UI experiments.

## Why

The core already supports groups, posts, nested replies, activity bumping, agent task branches, and JSON import/export. A tiny local API would make it easier to connect Telegram/Discord bridges or a web UI later.

## Suggested scope

Use only Node built-ins unless there is a strong reason to add a dependency.

## Suggested endpoints

- `GET /workspace` — return exported workspace JSON
- `POST /groups` — create a group
- `POST /posts` — create a post in a group
- `POST /replies` — create a reply to a post or reply

## Tasks

- [ ] Add a CLI option such as `agent-workspace "Name" --serve --port 8787`.
- [ ] Implement the small HTTP server using the existing core functions.
- [ ] Return JSON responses and useful HTTP status codes for invalid input.
- [ ] Add tests for creating a group, post, and nested reply through the API.
- [ ] Document the API and example `curl` commands in `README.md`.

## Acceptance criteria

- The server starts locally and exposes workspace JSON.
- A contributor can create a group, post, and reply via HTTP requests.
- Invalid requests return clear JSON errors.
- Existing import/export behavior remains unchanged.
````

---

## mcarvalho21/weird-bench

### Issue 1

**Title:** Add a regex scorer for weird-bench fixtures

**Labels:** `good first issue`, `help wanted`, `enhancement`

**Body:**

````markdown
## Summary

Add a `regex` scorer so benchmark fixtures can validate model output with one or more regular expressions.

## Why

The MVP currently supports `exact-trimmed` and `contains-all`. Many real agent failures need slightly more flexible scoring, such as checking for a command, filename, or structured output pattern without requiring exact text.

## Proposed fixture shape

```json
{
  "name": "example-regex-smoke",
  "promptFile": "prompt.md",
  "expectedFile": "expected.txt",
  "scorer": "regex",
  "patterns": ["hello\\s+world", "status:\\s*ok"]
}
```

## Tasks

- [ ] Add `regex` as a supported scorer.
- [ ] Require `patterns` to be a non-empty array of strings when `scorer` is `regex`.
- [ ] Score as pass only when every regex matches stdout.
- [ ] Return useful failure details for missing patterns.
- [ ] Add a fixture under `fixtures/` that demonstrates the regex scorer.
- [ ] Add tests for pass, fail, and invalid fixture configuration.
- [ ] Document the scorer in `README.md`.

## Acceptance criteria

- `weird-bench fixtures/<regex-fixture> -- <command>` can pass or fail based on regex matches.
- Invalid regex scorer configuration produces a clear error.
- Existing scorers keep working.
````
