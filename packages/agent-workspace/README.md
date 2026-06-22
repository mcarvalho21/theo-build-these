# @build-these/agent-workspace

Prototype for an agent-native Slack replacement: a post-first workspace where active posts bump, replies can nest, and agents branch tasks as durable context.

```bash
agent-workspace "Felix Workbench"
agent-workspace "Felix Workbench" --export-workspace
```

## JSON persistence

The core exposes `exportWorkspace(ws)` and `importWorkspace(json, now)` for durable snapshots. The exported JSON intentionally omits the live clock function while preserving groups, posts, replies, timestamps, and references. Imports validate broken post/reply references before returning a usable workspace.

This MVP is intentionally headless. Next steps: HTTP API, Telegram/Discord bridges, per-post agent sessions, and a web UI.
