# Connected inspector live delivery

Status: active
Milestone: M04 - Semantic Twin and Live UI

## TL;DR

Product-plan PR 27 connects one selected exact property to authorized SSE.
Automatic reconnect is finite; scope changes cancel the old owner. Heavy gates
run on CI. D06 and full-profile qualification remain deferred.

## Goal

Keep committed current evidence fresh without inventing intermediate history,
asset health or device connectivity.

## Scope

- Pin merged backend baseline.19 and regenerate the selected browser client.
- Bounded same-origin SSE through the existing app-owned managed runtime.
- Complete inspector start/stop, current state, reconnect, resnapshot and access
  failure controls within the established responsive panels.
- Protocol, transport, continuity, service and Solid lifecycle regressions;
  POM browser continuity and bounded high-rate scenarios.

## Design decisions

Follow [live delivery design](../../design-docs/0007-inspector-live-delivery.md).
Preserve exact values, quality and immutable provenance. History and provenance
remain independent queries. The UI never interprets cursor scope as authority.

## Acceptance criteria

- [x] Validate complete frames and payloads before retaining the applied cursor.
- [x] Handle coalesced replacements, duplicates, heartbeat age and continuity loss.
- [x] Bound frames, idle waits, reconnect attempts and managed request lifetimes.
- [x] Cancel on stop/unmount/scope/account change and suppress late events.
- [x] Clear protected telemetry on denied/expired authority.
- [ ] Complete CI acceptance, browser, browser-quality and image qualification.

## Acceptance evidence

Passed focused checks are reported in the PR. Full acceptance is pending; browser/image gates are not run locally. Browser/quality/image gates are delegated
to CI on the busy development host. Test-owned SSE fixtures do not qualify a
provider, hardware or persistent installation. No live performance capacity claim
follows from the bounded synthetic burst.

### Local verification and approved budget review

Passed: 61 focused protocol/adapter/service/component tests; TypeScript;
architecture; exact browser boundaries; view-size; contract provenance/generation;
80 contract/generation fixtures; documentation and style. Managed runtime focused
coverage remains above the existing floors (92.72% lines, 89.68% statements,
88.39% branches, 76.47% functions).

The owner approved JavaScript caps of 375,000 / 110,000 gzip bytes for this
feature, from 350,000 / 100,000. The measured production artifact is approximately
364 kB / 105 kB, paired with the added 200-replacement burst/disposal resource
workload under unchanged latency, heap and DOM limits. Coverage and security
gates remain unchanged. Complete acceptance remains pending CI qualification.

The inherited edge go-jose v3 blocker remains upstream-dependent; this UI slice
does not add a security exception or claim a clean runtime scan.

## Out of scope

D06, full-profile qualification, history replay, maps, alert lifecycle, mobile and
unlimited unattended subscription renewal.
