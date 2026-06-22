#!/usr/bin/env bash
set -euo pipefail

VISIBILITY="${VISIBILITY:-private}"
OWNER_ARG="${GITHUB_OWNER:+--owner $GITHUB_OWNER}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if ! command -v gh >/dev/null 2>&1; then
  echo "gh CLI is required. Install with: brew install gh" >&2
  exit 1
fi

gh auth status >/dev/null

cd "$ROOT"
if ! git diff --quiet --cached || ! git diff --quiet; then
  echo "Working tree has uncommitted changes; commit first." >&2
  exit 1
fi

create_or_push() {
  local repo="$1"
  local path="$2"
  local desc="$3"
  local tmp
  tmp="$(mktemp -d)"
  cp -R "$path"/. "$tmp"/
  if [[ -f "$ROOT/LICENSE" ]]; then cp "$ROOT/LICENSE" "$tmp/LICENSE"; fi
  cd "$tmp"
  git init -q
  git config user.name "$(git -C "$ROOT" config user.name || echo Felix)"
  git config user.email "$(git -C "$ROOT" config user.email || echo felix@local)"
  git add .
  git commit -q -m "feat: initial MVP"
  if gh repo view "$repo" >/dev/null 2>&1; then
    git remote add origin "$(gh repo view "$repo" --json url --jq .url).git"
  else
    gh repo create "$repo" "--$VISIBILITY" --description "$desc" --source=. --remote=origin --push
    cd "$ROOT"
    rm -rf "$tmp"
    return
  fi
  git branch -M main
  git push -u origin main
  cd "$ROOT"
  rm -rf "$tmp"
}

# Monorepo first
if gh repo view theo-build-these >/dev/null 2>&1; then
  git remote remove origin 2>/dev/null || true
  git remote add origin "$(gh repo view theo-build-these --json url --jq .url).git"
  git push -u origin main
else
  gh repo create theo-build-these "--$VISIBILITY" --description "Working prototypes for Theo's build-these ideas" --source=. --remote=origin --push
fi

create_or_push safe-npx "$ROOT/packages/safe-npx" "Safer NPX preflight and policy guard for humans and coding agents"
create_or_push source-vault "$ROOT/packages/source-vault" "Git-adjacent private path policy and encrypted manifest prototype"
create_or_push dev-sync "$ROOT/packages/dev-sync" "Dropbox-for-dev structure sync and lazy hydration planner"
create_or_push mobile-lab "$ROOT/packages/mobile-lab" "Android-compatible mobile platform planning toolkit"
create_or_push agent-workspace "$ROOT/packages/agent-workspace" "Post-first agent-native workspace core"
create_or_push weird-bench "$ROOT/packages/weird-bench" "Tiny fixture runner for reproducible model and agent benchmarks"

echo "Published/updated repos:"
gh repo view theo-build-these --json url --jq .url
for r in safe-npx source-vault dev-sync mobile-lab agent-workspace weird-bench; do gh repo view "$r" --json url --jq .url; done
