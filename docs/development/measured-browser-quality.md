# Measured browser quality

## TL;DR

Run pnpm check, pnpm e2e and pnpm verify --group browser-quality before handing off
browser or harness changes. The first covers scoped critical coverage, assertion
qualification and production output. The second covers operator behavior; the
third uses one Chromium worker, no retries, representative rendered accessibility
and a bounded production-fixture rendering workload. All three groups must qualify
unchanged sources before guide publication. Measurements are rendering regression
controls, not live fleet capacity or backend latency promises.

## Critical behavior and coverage

[The scope](../../tools/quality/coverage-scope.json) names fourteen owned modules:
managed HTTP, session parsing/ownership/access, asset and semantic parsing, the live
metadata reader, URL context and cancellable reads, plus the device adapter, evidence validation and cancellable
read/command controllers. Generated code is excluded.
[The policy](../../tools/quality/policy.json) records measured per-file line,
statement, function and branch floors, rounded down to whole percentages.
Minimum instrumentation counts prevent deleting an uncovered owned branch from
silently improving its percentage. Legitimate simplification requires reviewed
baseline changes; coverage is not a proof of useful assertions.

The component runner checks owned output parents, removes only three stale report
files, runs the real pinned V8 provider, validates complete source registration,
and requires every named critical assertion to pass. Full raw component reports
stay in ignored apps/web/coverage; retained receipts contain counts and registered
relative module names only. Missing or skipped obligations fail qualification.

Obligations cover authorization invalidation, immediate hiding on failed logout,
account remount, expiry, cancellation/disposal, parser scope/precision, cursor
advancement, and tenant/effective/known/source/cursor transitions. A late old
completion must leave the new result visible. The mutation gate uses isolated Vite
load hooks against real component assertions: deleting immediate logout hiding,
read cancellation or stale-completion suppression must fail its named assertion.
Positive controls pass first. Changed anchors, setup failures and surviving
mutants require investigation; application files are never edited by qualification.
Mutation subprocesses explicitly disable the persistent transformed-module cache.
The unchanged on-disk source must not let a mutant reuse its positive control's
compiled bytes. Ordinary component runs retain their normal caching. See the
[Vitest cache limitation for dynamic plugins](https://vitest.dev/config/fsmodulecache).

## Production output

The Vite plugin records resolved application module ownership and hashes final
emitted JS/CSS bytes after asset processing. The build gate checks actual inventory,
hashes and gzip sizes. Demo owners, the fixture reader and synthetic playback
service cannot be shipped in production. Legitimate generated wire examples are
not blanket-searched for words such as sample or locomotive.

The measured baseline is approximately 254 kB JS / 76 kB gzip and 37 kB CSS / 8 kB
gzip. Reviewed caps are 375,000 / 110,000 JS bytes and 60,000 / 16,000 CSS bytes.
The owner approved the PR 27 live-inspector increase from 350,000 / 100,000
to 375,000 / 110,000 JS bytes after measuring approximately 364 kB / 105 kB
and adding a 200-replacement burst/disposal workload under unchanged latency,
heap and DOM limits. Coverage and security gates remain unchanged.
A new map SDK or substantial feature requires a workload and budget review, not
an automatic increase. Real Vite fixtures qualify allowed examples, forbidden
sample ownership, changed output bytes and a deliberately exceeded budget.

## Rendered accessibility and browser errors

Axe 4.13.0 audits selected WCAG 2.0/2.1 A/AA rules on the connected catalogue,
inspector and registry in Light/Dark and desktop/narrow layouts. Signed-out and
denied-access surfaces are checked too. Evidence keeps rule IDs and counts, never
DOM snippets. Keyboard and responsive functional journeys remain required.
Passing these checks does not certify full WCAG compliance or replace screen-reader
and human visual review. Incomplete/unsupported Axe execution fails the test.

Scenarios import the owned production or browser-quality test fixture. A real
Biome rule rejects direct Playwright imports in all three scenario directories.
The automatic fixture fails unexpected page errors and attaches only completed,
cancelled and rejected fetch/XHR counters plus page-error counts. Typed HTTP
failures remain explicit UI states; they are not uncaught JavaScript errors.
A separate real browser qualification proves an error-free page passes and an
uncaught error is rejected by the actual fixture. Its private temporary reports
are removed; module context is explicitly ESM.

## Rendering envelope and calibration

The separate quality config owns its built preview on loopback port 4175; use
FLEETIQ_E2E_QUALITY_PORT when occupied. It refuses server reuse. Tool pins are
Playwright 1.63.0 / Chromium 153.0.8010.12, Vite 8.3.2 and Node 24; receipts record
the actual versions and source identity. CI runs a separate browser-quality job.

The test-owned backend fixture seeds 100 identities, serves bounded 50-row pages,
and returns one relationship, target binding and exact-source candidate per
registry snapshot. Viewports are 1365×900 and 390×844. Two warm-up rounds precede
five recorded rounds of catalogue filtering and client-side registry/catalogue
navigation. Latency samples run before cache-conditioning GC so the warm-up
remains meaningful. A separate set of five equivalent, unrecorded rounds compares
conditioned memory snapshots. Each observation waits for visible readiness and
two animation frames.
Browser-clock durations include automation and local mocked transport/decoding;
they are not isolated INP or real backend request measurements.

Post-GC Chromium heap/node counts compare the same catalogue state after warm-up
and five complete round trips. The rendered-accessibility project retains traces;
the rendering-performance project disables trace/video recording and its owned
fixture rejects an accidental recorder. Snapshotter caches retain real child-node
references, so recordings must not contribute to the memory benchmark.

The measurement project alone launches Chromium with --js-flags=--expose-gc.
Both resource boundaries await exactly three asynchronous major collections with
last-resort cache cleanup, then read heap usage and native DOM counters. This
clears incidental engine caches without removing reachable application state.
[V8's implementation](https://github.com/v8/v8/blob/main/src/extensions/gc-extension.cc)
defines the asynchronous empty-stack mode and last-resort collector. Missing
instrumentation or metrics fail; there is no fallback, lowest-count selection or
threshold-driven retry. The main-renderer profile rejects workers before sampling,
because worker heaps need a separate workload. These flags belong to the test
browser and are not a production browser requirement.

Real controls prove attached/detached retained nodes and reachable heap allocations
still breach the unchanged caps, released references are reclaimed, an active
worker is rejected without termination, and an unconfigured browser cannot pass.
Failure messages contain only numeric growth and limits; receipts remain bounded.
Run this lane without concurrent local build/coverage work; the dedicated CI job
also owns one worker. Missing metrics, malformed samples and incomplete
runs fail. Raw numeric timings/resources and workload limits are retained in
ignored .verification/quality-performance-*.json and inspected browser attachments.

Initial 12 October 2026 qualification used Windows and Ubuntu WSL, frozen installs,
Node 24.18.0 and the same Chromium build:

| Workload | Observed maximum navigation | Observed maximum filter | Retained nodes |
| --- | ---: | ---: | ---: |
| Windows desktop/narrow development calibration | <390 ms | <211 ms | 0 |
| Linux desktop/narrow development calibration | <418 ms | <205 ms | 0 |

Heap growth was below 0.4 MiB across these runs. Conservative blocking limits are
2,000 ms maximum navigation, 1,000 ms filtering, 16 MiB post-GC heap growth and
400 retained nodes. These tolerate local/CI variation while rejecting a controlled
slowdown and retained DOM. Review the first hosted Linux results, upgrades and
changed workloads before tightening or changing caps. Linux calibration receipts
are retained separately under .verification/linux-calibration and do not
substitute for final-source handoff evidence.

## Portable module ownership

The production manifest canonicalizes the configured repository root and real
absolute module paths with native filesystem resolution before checking owned
source prefixes. This expands Windows 8.3 temporary-directory aliases and avoids
comparing equivalent filesystem locations as unrelated strings. Virtual module
IDs remain excluded; missing real paths or an empty owned graph still fail.
Actual Vite builds exercise an aliased root and confirm that development sample
imports remain forbidden. Final output inventory, hashes and size budgets are
still checked separately; output links remain forbidden.

## Failure and recovery

1. Read the incomplete group receipt and failing stage. Missing prerequisites are
   not a clean scan; setup failures cannot qualify a deliberate regression.
2. Inspect synthetic traces privately. Preserve rule categories and raw numeric
   samples; do not copy DOM, headers, tokens or error payloads into receipts.
3. Check source identity, frozen installation, selected viewport/workload, owned
   port and tool versions. Diagnose workload or product causes before changing caps.
4. Repair the component, lifecycle or sensor. Add a violation fixture if the gate
   escaped. Do not disable a rule, remove a source or turn a missing metric into zero.
5. Rerun complete groups at unchanged final sources. Guide release requires all
   three complete receipts, inspection and clean publication sources.

[The control register](harness-controls.md) records owners, triggers and remaining
review/deferred obligations. External required statuses and Code Owner protection
must include browser-quality; repository text cannot configure those settings.

## Geographic map workload and approved payload group

Issue #90 adds a separately bounded lazy map group: 1,700,000 / 470,000 gzip bytes
JavaScript and 75,000 / 12,000 CSS, explicitly approved by the owner after measuring
the SDK, route and local module worker. Existing non-map limits remain unchanged.
Every emitted `.js`, `.mjs` and CSS file is inventoried and hashed; the map group
is derived from owned lazy chunks rather than excluding vendor assets from checks.

The `geographic-map` project uses test-only software WebGL with trace/video off,
no retries and one test worker. Two warmups/five cycles exercise local synthetic
raster tiles, filtering, selection and disposal. The existing main-heap/DOM and
latency thresholds remain unchanged. Active workers are exactly one, none survive
route disposal, and bounded CDP records numeric worker-heap samples. Those samples
are diagnostic, not a calibrated peak/GPU budget. Existing worker-free projects
retain their worker rejection. See [the map decision](../design-docs/0008-connected-geodetic-map.md).

### Geographic measurement isolation and complete warmup

PR #91's first CI resource trial reported 773 retained nodes against the unchanged
400-node limit. A controlled local reproduction retained 604 nodes; omitting only
the in-loop Axe scan reduced that to 391. Accessibility instrumentation had been
introduced after the memory baseline, and each warmup reloaded the document while
omitting the measured filter/selection/worker-inspection work. Those states were
not equivalent before and after the measured window.

The geographic resource workload now keeps one document, warms two identical
complete SPA round trips, and measures five such cycles. Baselines compare the
same returned asset page. An explicit guard rejects an Axe-instrumented page;
a real-browser negative control proves that guard. Desktop/narrow light/dark map
accessibility runs in fresh contexts in `rendered-accessibility`, which the
configuration sensor requires. No accessibility check was removed.

The synthetic raster fixture was repaired after checksum/decompression inspection
found corrupt IDAT data. Renderer readiness now follows the reviewed style,
created point source and SDK idle boundary rather than initial blank style-load.
The resource scenario waits for one actual worker before inspecting it and zero
workers after disposal. These are bounded readiness waits, not resource-sample
retries. A separate unit regression verifies cancellation of superseded/disposed
style reads; it exposed and fixed a shadowed controller variable.

The corrected local five-cycle trial retained **0 nodes** (1,383 before/after),
877,760 heap bytes, and had a maximum navigation of 1,448 ms and filter of 496 ms.
The 400-node, 16-MiB, 2-second and 1-second caps are unchanged. Full CI qualification
remains authoritative; these bounded local results are not capacity certification.
