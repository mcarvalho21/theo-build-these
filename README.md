# Theo Build These — working prototypes

A local prototype workspace for ideas from Theo's video, starting with small but executable MVPs for every idea in the backlog.

```bash
npm install
npm test
npm run demo:all
```

## Packages

| Video idea | Package | Status | Purpose |
|---|---|---:|---|
| Better NPM / NPX | `@build-these/safe-npx` | ✅ MVP | Preflight-risk report before running an NPX package |
| Source control beyond Git | `@build-these/source-vault` | ✅ MVP | Policy-based private paths with encrypted share manifests |
| Dropbox for dev machines | `@build-these/dev-sync` | ✅ MVP | Structure sync and lazy hydration planner for repo folders |
| New mobile platform | `@build-these/mobile-lab` | ✅ MVP | Device/app compatibility planner for Android-runtime experiments |
| Agent-native Slack replacement | `@build-these/agent-workspace` | ✅ MVP | Post-first workspace core with nested replies and agent task branches |
| Weird benchmarks | `@build-these/weird-bench` | ✅ MVP | Turn failed agent tasks into reproducible benchmark fixtures |

See [`docs/ideas.md`](docs/ideas.md) for the extracted backlog and product notes.
