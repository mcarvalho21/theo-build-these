# Build These — distilled backlog

Source: https://www.youtube.com/watch?v=wEAb0x3wTRc

## 1. Safer NPM / NPX

**Problem:** `npx some-package@latest` asks for yes/no with almost no useful risk context. Humans and agents both execute opaque remote code.

**MVP:** `safe-npx` wraps package execution with a preflight report:

- package identity, version, publisher/maintainer signal
- tarball size and unpacked size
- script hooks that run on install/package lifecycle
- dependency count
- executable entry points
- age/download/deprecation metadata where available
- heuristic risk score + machine-readable JSON for agents

## 2. Source control beyond Git

**Problem:** Git exposes everything in one repo to everyone, has poor ergonomics for secrets/private subtrees, weak agent worktree UX, and commits/branches may be the wrong primitive.

**MVP direction:** encrypted private paths + share policies over a Git-compatible object store; JJ-like snapshots/tags; first-class ephemeral agent checkouts.

## 3. Dropbox for dev machines

**Problem:** Multi-machine agent/dev setups drift: stale worktrees, missing env vars, inconsistent project locations.

**MVP direction:** a managed `~/Code` overlay that syncs structure immediately and lazily hydrates file contents when touched, with `.syncignore` / `.hydrateignore` semantics.

## 4. New mobile platform with Android app compatibility

**Problem:** iOS/App Store and Android/Play distribution are hostile; Android openness has narrowed.

**MVP direction:** experimental Android-compatible launcher/ROM layer for open-bootloader devices, optimized for sideloading, agent workflows, and developer-owned distribution.

## 5. Agent-native team communication

**Problem:** Slack is optimized for sending messages, not reading/prioritizing work or agent collaboration. Threads decay instead of bumping active context.

**MVP direction:** open-source post-first workspace: groups contain posts, posts bump on activity, threads/replies are nestable, agents can branch work and report back into durable context.

## 6. Weird benchmarks

**Problem:** Model capability is under-measured outside lab tasks. Real failures should become reproducible benchmarks.

**MVP direction:** tiny benchmark kit that turns failed agent tasks into repeatable fixtures with scoring adapters.
