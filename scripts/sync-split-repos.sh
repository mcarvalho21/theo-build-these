#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OWNER="${GITHUB_OWNER:-mcarvalho21}"
TMP_PARENT="$(mktemp -d)"
trap 'rm -rf "$TMP_PARENT"' EXIT

sync_one() {
  local repo="$1"
  local package_dir="$2"
  local clone_dir="$TMP_PARENT/$repo"
  echo "==> Syncing $OWNER/$repo from $package_dir"
  gh repo clone "$OWNER/$repo" "$clone_dir" -- --quiet
  find "$clone_dir" -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +
  (cd "$ROOT/$package_dir" && tar -cf - .) | (cd "$clone_dir" && tar -xf -)
  cd "$clone_dir"
  git add --all
  if git diff --cached --quiet; then
    echo "    no changes"
  else
    git commit -m "feat: sync latest MVP hardening"
    git push
  fi
}

sync_one safe-npx packages/safe-npx
sync_one source-vault packages/source-vault
sync_one dev-sync packages/dev-sync
sync_one mobile-lab packages/mobile-lab
sync_one agent-workspace packages/agent-workspace
sync_one weird-bench packages/weird-bench
