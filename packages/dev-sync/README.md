# @build-these/dev-sync

[![CI](https://github.com/mcarvalho21/theo-build-these/actions/workflows/ci.yml/badge.svg)](https://github.com/mcarvalho21/theo-build-these/actions/workflows/ci.yml)

Prototype for “Dropbox for dev machines”: sync repo structure first, then hydrate heavy files lazily from a remote manifest.

```bash
dev-sync ~/Code > manifest.json
dev-sync ~/Code remote-manifest.json
```

## MVP features

- Scans repo-shaped folders into a deterministic manifest of directories, file sizes, and SHA-256 hashes.
- Applies default ignores for `.git/**` and `node_modules/**`.
- Reads `.syncignore` from the scanned root. Syntax supports blank lines, `#` comments, globs such as `dist/**` and `*.log`, anchored patterns such as `/coverage/**`, directory shorthand such as `build/`, and later negations such as `!dist/keep.txt`.
- Builds an apply plan with `mkdir`, `hydrate`, `refresh`, `replace`, and optional `delete-local` operations.
- Emits rich `.hydrate.json` placeholders carrying target path, expected hash/size, source, and the operation that should hydrate the file.

## Example `.syncignore`

```gitignore
# Generated and heavyweight local state
dist/**
*.log
/coverage/**

# Keep one fixture even though dist is ignored
!dist/fixtures/sample.json
```

The prototype does not transfer file bytes yet. `hydrate` and `refresh` operations create placeholders so a future filesystem watcher or editor integration can fetch contents on demand.
