# `@build-these/source-vault` roadmap

Goal: make a repo-shaped workspace shareable while keeping declared private paths protected.

## Now

- Policy-driven `public`/`private` classification.
- AES-256-GCM encrypted private entries in a manifest.
- Recipient/access metadata and public redaction rules.

## Next

- Replace demo symmetric secret flow with envelope encryption per recipient.
- Add decrypt/apply commands for authorized recipients.
- Sketch Git and Jujutsu workflows: pre-commit checks, manifest generation, and private subtree restoration.
- Add policy linting for overlapping rules, accidental public defaults, and missing recipients.
- Emit machine-readable explanations for every redaction/encryption decision.

## Good first contributions

- Add policy examples for teams, open-source repos, and client work.
- Add tests for glob precedence and redaction edge cases.
- Document threat-model limits in the package README.

## Open questions

- Should policies live inside the repo, outside it, or both?
- How should access be audited when private files are re-shared?
- What is the smallest workflow that feels better than `.gitignore` plus ad hoc secret sharing?
