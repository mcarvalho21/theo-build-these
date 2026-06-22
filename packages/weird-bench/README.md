# @build-these/weird-bench

[![CI](https://github.com/mcarvalho21/theo-build-these/actions/workflows/ci.yml/badge.svg)](https://github.com/mcarvalho21/theo-build-these/actions/workflows/ci.yml)

Prototype for turning failed/interesting coding-agent tasks into reproducible benchmark fixtures.

A benchmark fixture is just:

```text
bench.json
prompt.md
expected.txt
```

Run a fixture by piping the prompt to any command and scoring stdout:

```bash
weird-bench fixtures/reverse-string -- node ./some-model-wrapper.js
weird-bench --jsonl results.jsonl fixtures/reverse-string -- node ./some-model-wrapper.js
```

`--jsonl` appends a compact result line plus a summary line without storing full model output, making it safe to collect many benchmark runs in one file.

## Fixture schema

```json
{
  "name": "reverse-string-smoke",
  "promptFile": "prompt.md",
  "expectedFile": "expected.txt",
  "scorer": "exact-trimmed"
}
```

Supported scorers in the MVP:

- `exact-trimmed`
- `contains-all` with `mustContain: ["token"]`

## Why this exists

When an agent fails a real task, capture the prompt/context and a simple scorer. Re-run the fixture across models later instead of relying on vibes.
