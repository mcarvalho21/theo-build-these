# `@build-these/weird-bench` roadmap

Goal: turn real agent failures into small, repeatable, shareable benchmarks.

## Now

- Fixture format with `bench.json`, `prompt.md`, and `expected.txt`.
- Runner that pipes prompts to arbitrary commands.
- `exact-trimmed` and `contains-all` scorers.
- Compact JSONL result output.

## Next

- Add scorer plugins for regex, JSON shape validation, file output checks, and multi-step tasks.
- Add metadata fields for model, tool environment, task source, and privacy level.
- Create benchmark-pack examples from sanitized real failures.
- Add result comparison summaries across models or commits.
- Document safe fixture sanitization so prompts do not leak private context.

## Good first contributions

- Add scorer tests and fixture examples.
- Improve CLI errors for invalid fixtures.
- Add a README recipe for converting a failed agent task into a benchmark.

## Open questions

- How can fixtures preserve real difficulty without leaking proprietary context?
- Should benchmark packs be versioned independently from the runner?
- What result fields are essential for comparing agent regressions over time?
