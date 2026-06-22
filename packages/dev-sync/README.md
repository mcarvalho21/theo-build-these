# @build-these/dev-sync

Prototype for “Dropbox for devs”: sync project structure first, then lazily hydrate file contents when touched.

```bash
dev-sync ~/Code > manifest.json
dev-sync ~/Code remote-manifest.json
```

The MVP scans repo-shaped folders, ignores heavyweight directories, computes content hashes, and emits hydration operations/placeholders.
