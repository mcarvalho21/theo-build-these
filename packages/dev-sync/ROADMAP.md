# `@build-these/dev-sync` roadmap

Goal: sync project structure first, then hydrate file contents only when needed.

## Now

- Deterministic structure manifest with sizes and SHA-256 hashes.
- `.syncignore` support with comments, globs, directory shorthand, and negation.
- Hydration/refresh/replace/delete planning with placeholder files.

## Next

- Prototype a local hydration service that can replace placeholders with real bytes on demand.
- Add conflict handling for local edits vs. remote manifest changes.
- Track executable bits, symlinks, and platform-specific path behavior.
- Add signed manifests and optional content-addressed storage backends.
- Improve progress output for large repositories.

## Good first contributions

- Add more `.syncignore` compatibility tests.
- Add sample manifests for common JS, Python, and Rust repos.
- Improve placeholder metadata for editor and filesystem watcher integrations.

## Open questions

- Should hydration be editor-triggered, filesystem-triggered, or explicit CLI-triggered first?
- How much local state is acceptable before this stops feeling lightweight?
- Which ignored/generated paths should be default across ecosystems?
