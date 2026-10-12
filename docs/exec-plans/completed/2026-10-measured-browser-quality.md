# Gate measured browser quality and recovery

## TL;DR

Complete the third agreed harness PR with owned critical coverage/obligations,
real assertion and browser-error qualification, production graph/byte budgets,
rendered accessibility and a calibrated bounded rendering lane. Live fleet,
provider and deployment capacity remain outside this qualification.

Status: completed (implementation and focused qualification)
Milestone: M02 - Product Foundation

## Goal

Catch responsiveness, accessibility, production-output and critical-lifecycle
regressions through self-qualifying sensors and exact-source evidence.

## Scope

- Ten owned modules with measured per-file floors and minimum denominators.
- Session/access/logout/expiry/account, parsing, cancellation/disposal and
  tenant/source/cutoff/cursor obligations, plus three actual assertion mutants.
- Final-byte/module graph production budgets and sample isolation.
- Owned browser-error fixture, direct-import guard, category-only lifecycle
  observations and actual positive/error qualification.
- Representative rendered accessibility, fixed workload/viewports, warm-up,
  repeated timings and post-GC resource bounds on Windows and Linux.
- Dedicated CI lane, three-group guide qualification, control register and recovery.

## Design decisions

Use maintained Axe and the matching Vitest V8 provider, exact development-only
pins and actual Vite/Playwright APIs. Generate module evidence from the resolved
graph; do not blanket-search legitimate wire examples. No raw DOM/error payloads
enter quality receipts. Preserve meaningful assertions, own disposable module
context and temporary roots, and never edit application files for mutation runs.

Axe tooling is MPL-2.0; Vitest coverage/Vite tooling is MIT. None is imported into
product runtime. Production behavior changes are limited to readable planned
navigation and independently distinguishable inline links found by rendered scans.

## Acceptance criteria

- Omitting sources/assertions, lowering denominators or surviving a critical
  mutation prevents qualification.
- Actual output changes/sample modules/budget violations fail.
- Rendered representative surfaces pass; inaccessible controls and page errors
  fail real probes.
- Both fixed viewports pass calibrated repeated rendering/resource checks;
  controlled slow work and retained DOM fail. Missing tools/metrics cannot pass.
- Final acceptance, functional browser and measured-browser groups qualify the
  same unchanged sources; publication consumes all three.

## Acceptance evidence

Focused development qualification passed: 87 sensor/CI cases, four real browser
import lint probes, 26 changed session/snapshot component tests, three positive
and three mutation controls, production output checks, and rendered browser
scenarios. Ubuntu WSL qualified both measured-browser stages with frozen
installation and the pinned browser; its bounded calibration receipts are ignored
and separate from final-source evidence. Initial extraction/module-context and
rendered-style failures were corrected rather than treated as successful
qualification. Aggregate qualification passed: 18 acceptance stages, 415 harness tests, 175 component tests, 61 guide tests, 58 functional browser cases and eight measured-browser cases, plus actual page-error qualification. All six guide chapters generated, local release qualified and four artifact roots passed inspection. A final resource probe exposed an asynchronous DOM-sweeping boundary; fixed identical render/GC rounds now precede both resource snapshots, retaining the original node cap and the real retained-DOM negative control. After synchronizing the primary verification table and resource sampling, final handoff repeats the three groups and guide qualification at unchanged final sources. Their ignored receipts carry the exact verdict; development calibration never substitutes for final-source acceptance.

## Out of scope

Global coverage percentages, broad mutation campaigns, real OIDC, operational
telemetry, large/live fleet/map/backend capacity, signed independent attestation,
external GitHub administration and universal design/WCAG certification.

Parent: [agreed harness plan](2026-10-harness-hardening.md).
