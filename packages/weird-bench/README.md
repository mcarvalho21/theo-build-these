# @build-these/weird-bench

Tiny proof-of-concept for Theo's "go build weird benchmarks" idea.

A benchmark fixture is just:

```text
bench.json
prompt.md
expected.txt
```

Run a fixture by piping the prompt to any command and scoring stdout:

```bash
weird-bench fixtures/reverse-string -- node ./some-model-wrapper.js
```

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
