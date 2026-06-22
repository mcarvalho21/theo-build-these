# `@build-these/agent-workspace` roadmap

Goal: build a collaboration space where posts, replies, and agent task branches are durable first-class objects.

## Now

- Headless workspace model with groups, posts, nested replies, and bump ordering.
- Agent task branch records.
- JSON export/import with validation.

## Next

- Add a minimal HTTP API for posts, replies, search, and agent task creation.
- Define an event stream so agents can subscribe to relevant workspace changes.
- Add identity/permission primitives without overbuilding enterprise auth.
- Build a small web UI that demonstrates active-post-first navigation.
- Add import/export compatibility tests for schema evolution.

## Good first contributions

- Add API route sketches and contract tests.
- Add fixtures for busy threads, stale posts, and task-heavy workflows.
- Improve validation errors for malformed workspace JSON.

## Open questions

- What is the smallest UI that proves this is better than chat channels?
- How should agent context be summarized and archived?
- Which external chat bridges are useful without recreating Slack?
