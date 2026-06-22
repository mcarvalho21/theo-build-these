# @build-these/agent-workspace

[![CI](https://github.com/mcarvalho21/theo-build-these/actions/workflows/ci.yml/badge.svg)](https://github.com/mcarvalho21/theo-build-these/actions/workflows/ci.yml)

Prototype for a post-first, agent-native workspace: messages are durable objects with nested replies and branchable agent tasks.

```bash
agent-workspace "Felix Workbench"
agent-workspace "Felix Workbench" --export-workspace
```

## JSON persistence

The core exposes `exportWorkspace(ws)` and `importWorkspace(json, now)` for durable snapshots. The exported JSON intentionally omits the live clock function while preserving groups, posts, replies, timestamps, and references. Imports validate broken post/reply references before returning a usable workspace.

This MVP is intentionally headless. Next steps: HTTP API, Telegram/Discord bridges, per-post agent sessions, and a web UI.
