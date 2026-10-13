# Stabilize browser resource measurements and retain diagnostics

## TL;DR

Keep Effect 4.0.2 and all existing quality limits. Separate recorded correctness
checks from unrecorded memory measurements; condition native engine caches with
precise asynchronous GC and preserve inspected failure reports.

Status: completed (implementation and focused qualification)
Milestone: M02 - Product Foundation

## Goal

Repair the intermittent browser-quality failure on the rebased Effect update and
make genuine future regressions diagnosable without weakening the harness.

## Scope

- Compare the unchanged workload under Effect 4.0.1/4.0.2 and traced/untraced Linux runs.
- Own separate recorded-accessibility and unrecorded-measurement projects.
- Qualify GC instrumentation, resource retention/reclamation and worker scope.
- Report bounded numeric breach details and inspect trace-viewer JSON manifests.

## Design decisions

The original fixed synchronous-GC probe reproduced excess native nodes under both
Effect versions. A 32-case native Linux comparison found five resource failures;
one additional timing failure remains preserved as diagnostic evidence. Heap
inspection identified native PointerEvent/template-cache retaining paths, and
the maintained recorder also caches real child nodes. These bounded experiments
do not establish live fleet capacity or attribute an application leak to Effect.

Use the pinned browser's asynchronous major last-resort collector at fixed
boundaries. Never choose the minimum measurement, raise a cap or retry until green.
Recording is worker-scoped in Playwright, so use separate registered projects
and an owned recorder guard. Leave production code and Effect dependency pins
unchanged. Unknown/missing instrumentation and changed worker workloads fail.

Accept .webmanifest only as a UTF-8 JSON object, then scan original bytes like all
other artifacts. Secret-bearing and malformed manifests still fail. No secret
exception or archive/upload bypass is introduced.

## Acceptance criteria

- Both viewports pass repeated unrecorded measurements at unchanged limits.
- Actual retained attached/detached nodes and heap exceed their respective caps.
- Released references are reclaimed; workers and missing instrumentation fail.
- Omitting a quality project/control or enabling recording/retries fails qualification.
- Actual traced reports pass retention inspection; secret-bearing manifests fail.
- Canonical acceptance, functional browser and browser-quality groups pass final sources.

## Acceptance evidence

Focused Windows qualification passed both workloads and actual retention,
reclamation, worker and missing-GC controls. Artifact/sensor cases passed and a
real 25-file Playwright trace report qualified inspection. Original failed
experiments remain distinct from acceptance. Final unchanged-source receipts,
including Linux and canonical groups, record the handoff verdict. A first repaired
12-case Linux repetition reported ten passes and two interaction-budget failures;
those are preserved as incomplete diagnostic evidence, not a complete pass.
Neither failure reported the resource-growth error. Timing caps remain unchanged
and their numeric diagnostics were added before final canonical qualification. The stronger collector also clears engine
caches, so latency now runs warm before a separate five-round retention phase;
this prevents GC from undoing its warm-up. The workload and all caps are retained.

## Out of scope

Dependency downgrades, product event-delegation changes, threshold increases,
automatic quality retries, worker/live-map/long-session capacity, raw heap
retention and remote PR publication.
