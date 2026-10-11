# Technical debt tracker

Record observed debt with its consequence, owner and review trigger. Planned
API, map and product slices remain in [PLANS.md](../PLANS.md).

## Intermittent local test deadlines

- **Owner:** frontend maintainers.
- **Observed:** during the October harness portability correction on Windows,
  the unchanged AlertQueue interaction test exceeded its five-second deadline
  once; its focused control and complete acceptance repeat passed. The sample
  map guide exceeded its initial panel wait once; the configured retry and a
  focused run with retries disabled passed.
- **Consequence:** a transient timeout can reject local acceptance, or produce a
  flaky browser result even when the aggregate command succeeds. A group pass
  must not be described as proof that no retry occurred.
- **Review trigger:** the measured browser-quality harness PR, or recurrence in
  hosted CI. Capture a reproducible workload and startup/resource measurements;
  diagnose the cause before changing time limits or assertion policy.
- **Current disposition:** failures and repeats are recorded in the
  [portability correction evidence](completed/2026-10-harness-context-verification.md#ci-portability-correction-2026-10-11).
  Product assertions, timeouts and worker policy remain unchanged; root cause
  and hosted-CI recurrence have not been established.
