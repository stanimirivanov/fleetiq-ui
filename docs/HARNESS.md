# Coding harness

## TL;DR

Read the short entry points, run fast deterministic checks during editing, and run pnpm check before handoff. The checks enforce structure; tests and human review assess behavior and product judgment.

| Tier | Guide or sensor | Purpose |
|:--|:--|:--|
| T0 | AGENTS.md, docs/README.md, architecture and product guides | Route a task to the narrow source of truth before editing. |
| T1 | Biome CI (format, lint, import organization), TypeScript, dependency-cruiser, docs checker | Catch formatting, typing, import direction, and broken local documentation quickly. |
| T2 | Web build and mock-exclusion check, Expo dependency check and Android/web JavaScript exports, feature tests | Verify deliverability and behavior before review. |
| T3 | Device/emulator runs, accessibility review, live-contract compatibility | Run when the affected feature requires platform or service evidence. |

CI runs the deterministic T1/T2 gate. A passing import graph does not establish correct authorization, useful UX, or native runtime behavior. When a finding recurs, improve the narrow guide, add an actionable structural check, or add a behavior test. Keep exceptions owned and time-bounded in the debt tracker. A sensor should name the violated boundary and a fix; it must not silently rewrite source or treat missing tools as success.

The repository adopts the progressively discoverable knowledge map and active/completed execution plans described in the OpenAI and Martin Fowler harness articles. It does not copy a large generated-reference tree or machine-specific design notes without a current consumer. Sources: https://openai.com/index/harness-engineering/ and https://martinfowler.com/articles/harness-engineering.html.

